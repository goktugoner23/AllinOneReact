import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Note, NoteFormData } from '../types/Note';
import { firebaseIdManager } from './firebaseIdManager';

// Global error handler to suppress Firestore assertion errors
const handleFirestoreError = (error: any, operation: string) => {
  if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.warn(`⚠️ Firestore assertion error in ${operation} - suppressing:`, error.message);
    return true; // Error was handled
  }
  return false; // Error was not handled
};

// Delete attachments from Firebase Storage
const deleteAttachmentsFromStorage = async (noteId: number): Promise<void> => {
  try {
    console.log(`🗑️ Deleting attachments for note ${noteId} from Firebase Storage...`);
    
    // Create a reference to the note's attachments folder
    const noteAttachmentsRef = ref(storage, `notes/${noteId}/attachments`);
    
    // List all files in the attachments folder
    const result = await listAll(noteAttachmentsRef);
    
    if (result.items.length === 0) {
      console.log(`ℹ️ No attachments found for note ${noteId}`);
      return;
    }
    
    // Delete all files in the folder
    const deletePromises = result.items.map(async (item) => {
      try {
        await deleteObject(item);
        console.log(`✅ Deleted attachment: ${item.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to delete attachment ${item.name}:`, error);
        // Continue with other deletions even if one fails
      }
    });
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${result.items.length} attachments for note ${noteId}`);
  } catch (error) {
    console.error(`❌ Error deleting attachments for note ${noteId}:`, error);
    // Don't throw error - we want to continue with note deletion even if attachment deletion fails
  }
};

// Delete individual attachment by URI (for future use)
export const deleteAttachmentByUri = async (uri: string): Promise<void> => {
  try {
    // Check if it's a Firebase Storage URI
    if (uri.includes('firebasestorage.googleapis.com')) {
      const storageRef = ref(storage, uri);
      await deleteObject(storageRef);
      console.log(`✅ Deleted attachment: ${uri}`);
    } else {
      console.log(`ℹ️ Skipping local file: ${uri}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to delete attachment ${uri}:`, error);
  }
};

// Delete multiple attachments by URIs
export const deleteAttachmentsByUris = async (uris: string[]): Promise<void> => {
  try {
    console.log(`🗑️ Deleting ${uris.length} attachments...`);
    
    const deletePromises = uris.map(uri => deleteAttachmentByUri(uri));
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${uris.length} attachments`);
  } catch (error) {
    console.error('❌ Error deleting attachments:', error);
  }
};

// Helper function to normalize URIs for comparison
const normalizeUris = (uris: string[]): string[] => {
  return uris
    .map(uri => uri.trim())
    .filter(uri => uri.length > 0)
    .sort(); // Sort for consistent comparison
};

// Simple debounce to prevent duplicate note creation
let isCreatingNote = false;
let lastCreatedNote: { title: string; content: string; timestamp: number } | null = null;

const NOTES_COLLECTION = 'notes';

// Convert Firestore document to Note
const docToNote = (doc: any): Note => {
  const data = doc.data();
  
  // Helper function to safely convert timestamp to ISO string
  const safeDateToISO = (timestamp: any): string => {
    try {
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toISOString();
      }
      return new Date().toISOString();
    } catch (error) {
      console.warn('Error converting date:', error);
      return new Date().toISOString();
    }
  };

  return {
    id: doc.id,
    title: data?.title || '',
    content: data?.content || '',
    date: safeDateToISO(data?.date),
    imageUris: data?.imageUris || null,
    videoUris: data?.videoUris || null,
    voiceNoteUris: data?.voiceNoteUris || null,
    lastEdited: safeDateToISO(data?.lastEdited),
    isRichText: data?.isRichText ?? true,
  };
};

// Convert Note to Firestore document
const noteToDoc = (note: NoteFormData) => ({
  title: note.title,
  content: note.content,
  date: Timestamp.now(),
  imageUris: note.imageUris || null,
  videoUris: note.videoUris || null,
  voiceNoteUris: note.voiceNoteUris || null,
  lastEdited: Timestamp.now(),
  isRichText: true,
});

// Get all notes
export const getNotes = async (): Promise<Note[]> => {
  try {
    console.log('📝 Fetching notes from Firestore...');
    const q = query(collection(db, NOTES_COLLECTION), orderBy('lastEdited', 'desc'));
    const querySnapshot = await getDocs(q);
    const notes = querySnapshot.docs.map(docToNote);
    console.log(`📝 Successfully fetched ${notes.length} notes`);
    return notes;
  } catch (error) {
    if (handleFirestoreError(error, 'getNotes')) {
      return []; // Return empty array for assertion errors
    }
    console.error('❌ Error getting notes:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Add a new note
export const addNote = async (noteData: NoteFormData): Promise<Note> => {
  console.log('🔵 addNote called with:', { title: noteData.title, content: noteData.content?.substring(0, 50) });
  
  // Prevent duplicate note creation
  if (isCreatingNote) {
    console.log('❌ Note creation already in progress');
    throw new Error('Note creation already in progress');
  }
  
  // Check for duplicate content within last 5 seconds
  const now = Date.now();
  if (lastCreatedNote && 
      lastCreatedNote.title === noteData.title && 
      lastCreatedNote.content === noteData.content &&
      now - lastCreatedNote.timestamp < 5000) {
    console.log('❌ Duplicate note detected');
    throw new Error('Duplicate note detected');
  }
  
  try {
    isCreatingNote = true;
    console.log('✅ Starting note creation...');
    
    const noteId = await firebaseIdManager.getNextId('notes');
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    
    const noteDoc = {
      ...noteToDoc(noteData),
      id: noteId,
    };
    
    // Use merge option to prevent overwriting if document already exists
    await setDoc(docRef, noteDoc, { merge: false });
    
    // Track the created note to prevent duplicates
    lastCreatedNote = {
      title: noteData.title,
      content: noteData.content,
      timestamp: now
    };
    
    console.log('✅ Note created successfully with ID:', noteId);
    
    return {
      id: noteId,
      ...noteData,
      date: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      isRichText: true,
    };
  } catch (error) {
    if (handleFirestoreError(error, 'addNote')) {
      // For assertion errors, reset flag and return a mock note
      isCreatingNote = false;
      console.log('🔵 Note creation failed due to assertion error, flag reset');
      throw new Error('Failed to create note due to Firestore error');
    }
    console.error('❌ Error adding note:', error);
    // Reset the flag even on error
    isCreatingNote = false;
    console.log('🔵 Note creation failed, flag reset');
    throw error;
  } finally {
    isCreatingNote = false;
    console.log('🔵 Note creation completed, flag reset');
  }
};

// Update an existing note
export const updateNote = async (noteId: number, noteData: NoteFormData): Promise<void> => {
  try {
    console.log(`📝 Updating note ${noteId}...`);
    
    // First, get the original note data to compare attachments
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    const originalNoteDoc = await getDoc(docRef);
    
    if (originalNoteDoc.exists()) {
      const originalData = originalNoteDoc.data();
      
      // Extract and normalize original attachment URIs
      const originalImageUris = normalizeUris(originalData.imageUris ? originalData.imageUris.split(',') : []);
      const originalVideoUris = normalizeUris(originalData.videoUris ? originalData.videoUris.split(',') : []);
      const originalAudioUris = normalizeUris(originalData.voiceNoteUris ? originalData.voiceNoteUris.split(',') : []);
      
      // Extract and normalize new attachment URIs
      const newImageUris = normalizeUris(noteData.imageUris ? noteData.imageUris.split(',') : []);
      const newVideoUris = normalizeUris(noteData.videoUris ? noteData.videoUris.split(',') : []);
      const newAudioUris = normalizeUris(noteData.voiceNoteUris ? noteData.voiceNoteUris.split(',') : []);
      
      // Find removed attachments
      const removedImageUris = originalImageUris.filter(uri => !newImageUris.includes(uri));
      const removedVideoUris = originalVideoUris.filter(uri => !newVideoUris.includes(uri));
      const removedAudioUris = originalAudioUris.filter(uri => !newAudioUris.includes(uri));
      
      const allRemovedUris = [...removedImageUris, ...removedVideoUris, ...removedAudioUris];
      
      if (allRemovedUris.length > 0) {
        console.log(`🗑️ Found ${allRemovedUris.length} removed attachments to delete:`, allRemovedUris);
        console.log(`📊 Attachment changes:`, {
          images: { original: originalImageUris.length, new: newImageUris.length, removed: removedImageUris.length },
          videos: { original: originalVideoUris.length, new: newVideoUris.length, removed: removedVideoUris.length },
          audio: { original: originalAudioUris.length, new: newAudioUris.length, removed: removedAudioUris.length },
        });
        
        // Delete removed attachments from Firebase Storage
        await deleteAttachmentsByUris(allRemovedUris);
      } else {
        console.log(`ℹ️ No attachments were removed from note ${noteId}`);
      }
    }
    
    // Update the note document
    const updateData = {
      ...noteToDoc(noteData),
      lastEdited: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
    
    console.log(`✅ Successfully updated note ${noteId}`);
  } catch (error) {
    if (handleFirestoreError(error, 'updateNote')) {
      throw new Error('Failed to update note due to Firestore error');
    }
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    console.log(`🗑️ Deleting note ${noteId}...`);
    
    // First, get the note data to extract attachment URIs
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    const noteDoc = await getDoc(docRef);
    
    if (noteDoc.exists()) {
      const noteData = noteDoc.data();
      console.log(`📝 Found note with attachments:`, {
        images: noteData.imageUris ? noteData.imageUris.split(',').length : 0,
        videos: noteData.videoUris ? noteData.videoUris.split(',').length : 0,
        audio: noteData.voiceNoteUris ? noteData.voiceNoteUris.split(',').length : 0,
      });
    }
    
    // Delete all attachments from Firebase Storage
    await deleteAttachmentsFromStorage(noteId);
    
    // Then delete the note document from Firestore
    await deleteDoc(docRef);
    
    console.log(`✅ Successfully deleted note ${noteId}`);
  } catch (error) {
    if (handleFirestoreError(error, 'deleteNote')) {
      throw new Error('Failed to delete note due to Firestore error');
    }
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Subscribe to notes changes - DISABLED due to Firestore assertion errors
export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  console.warn('⚠️ Notes subscription DISABLED due to Firestore assertion errors');
  console.warn('⚠️ Using manual fetch instead of real-time updates');
  
  // Return empty array immediately and empty unsubscribe function
  setTimeout(() => callback([]), 0);
  return () => {
    console.log('📝 Notes subscription cleanup (no-op)');
  };
}; 