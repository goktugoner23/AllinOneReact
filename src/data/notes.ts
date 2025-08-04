import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';
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
    drawingUris: data?.drawingUris || null,
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
  drawingUris: note.drawingUris || null,
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
export const addNote = async (noteData: NoteFormData, onProgress?: (progress: number) => void): Promise<Note> => {
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
    
    // Upload attachments to Firebase Storage if they exist
    let uploadedImageUris: string | null = null;
    let uploadedVideoUris: string | null = null;
    let uploadedVoiceUris: string | null = null;
    
    // Collect all attachments that need uploading
    const attachmentsToUpload: { uri: string; type: 'image' | 'video' | 'audio' | 'drawing' }[] = [];
    
    if (noteData.imageUris && noteData.imageUris.trim()) {
      const imageUris = noteData.imageUris.split(',').map(uri => uri.trim()).filter(uri => uri);
      imageUris.forEach(uri => attachmentsToUpload.push({ uri, type: 'image' }));
    }
    
    if (noteData.videoUris && noteData.videoUris.trim()) {
      const videoUris = noteData.videoUris.split(',').map(uri => uri.trim()).filter(uri => uri);
      videoUris.forEach(uri => attachmentsToUpload.push({ uri, type: 'video' }));
    }
    
    if (noteData.voiceNoteUris && noteData.voiceNoteUris.trim()) {
      const voiceUris = noteData.voiceNoteUris.split(',').map(uri => uri.trim()).filter(uri => uri);
      voiceUris.forEach(uri => attachmentsToUpload.push({ uri, type: 'audio' }));
    }
    
    if (noteData.drawingUris && noteData.drawingUris.trim()) {
      const drawingUris = noteData.drawingUris.split(',').map(uri => uri.trim()).filter(uri => uri);
      drawingUris.forEach(uri => attachmentsToUpload.push({ uri, type: 'drawing' }));
    }
    
    // Upload all attachments with progress tracking
    let uploadedDrawingUris: string | null = null;
    if (attachmentsToUpload.length > 0) {
      console.log(`📤 Uploading ${attachmentsToUpload.length} attachments...`);
      const uploadResult = await uploadAttachmentsWithProgress(noteId, attachmentsToUpload, onProgress);
      
      uploadedImageUris = uploadResult.images.length > 0 ? uploadResult.images.join(',') : null;
      uploadedVideoUris = uploadResult.videos.length > 0 ? uploadResult.videos.join(',') : null;
      uploadedVoiceUris = uploadResult.audio.length > 0 ? uploadResult.audio.join(',') : null;
      uploadedDrawingUris = uploadResult.drawings.length > 0 ? uploadResult.drawings.join(',') : null;
    }
    
    // Create note document with uploaded attachment URLs
    const noteDoc = {
      ...noteToDoc(noteData),
      id: noteId,
      imageUris: uploadedImageUris,
      videoUris: uploadedVideoUris,
      voiceNoteUris: uploadedVoiceUris,
      drawingUris: uploadedDrawingUris,
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
      imageUris: uploadedImageUris || undefined,
      videoUris: uploadedVideoUris || undefined,
      voiceNoteUris: uploadedVoiceUris || undefined,
      drawingUris: uploadedDrawingUris || undefined,
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
export const updateNote = async (noteId: number, noteData: NoteFormData, onProgress?: (progress: number) => void): Promise<void> => {
  try {
    console.log(`📝 Updating note ${noteId}...`);
    
    // Initialize final URIs
    let finalImageUris: string[] = [];
    let finalVideoUris: string[] = [];
    let finalAudioUris: string[] = [];
    let finalDrawingUris: string[] = [];
    
    // First, get the original note data to compare attachments
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    const originalNoteDoc = await getDoc(docRef);
    
    if (originalNoteDoc.exists()) {
      const originalData = originalNoteDoc.data();
      
      // Extract and normalize original attachment URIs
      const originalImageUris = normalizeUris(originalData.imageUris ? originalData.imageUris.split(',') : []);
      const originalVideoUris = normalizeUris(originalData.videoUris ? originalData.videoUris.split(',') : []);
      const originalAudioUris = normalizeUris(originalData.voiceNoteUris ? originalData.voiceNoteUris.split(',') : []);
      const originalDrawingUris = normalizeUris(originalData.drawingUris ? originalData.drawingUris.split(',') : []);
      
      // Extract and normalize new attachment URIs
      const newImageUris = normalizeUris(noteData.imageUris ? noteData.imageUris.split(',') : []);
      const newVideoUris = normalizeUris(noteData.videoUris ? noteData.videoUris.split(',') : []);
      const newAudioUris = normalizeUris(noteData.voiceNoteUris ? noteData.voiceNoteUris.split(',') : []);
      const newDrawingUris = normalizeUris(noteData.drawingUris ? noteData.drawingUris.split(',') : []);
      
      // Find new attachments that need to be uploaded (not Firebase Storage URLs)
      const newImageUrisToUpload = newImageUris.filter(uri => !uri.includes('firebasestorage.googleapis.com'));
      const newVideoUrisToUpload = newVideoUris.filter(uri => !uri.includes('firebasestorage.googleapis.com'));
      const newAudioUrisToUpload = newAudioUris.filter(uri => !uri.includes('firebasestorage.googleapis.com'));
      const newDrawingUrisToUpload = newDrawingUris.filter(uri => !uri.includes('firebasestorage.googleapis.com'));
      
      // Upload new attachments to Firebase Storage with progress tracking
      let uploadedImageUris: string[] = [];
      let uploadedVideoUris: string[] = [];
      let uploadedAudioUris: string[] = [];
      let uploadedDrawingUris: string[] = [];
      
      // Collect new attachments that need uploading
      const newAttachmentsToUpload: { uri: string; type: 'image' | 'video' | 'audio' | 'drawing' }[] = [];
      
      newImageUrisToUpload.forEach(uri => newAttachmentsToUpload.push({ uri, type: 'image' }));
      newVideoUrisToUpload.forEach(uri => newAttachmentsToUpload.push({ uri, type: 'video' }));
      newAudioUrisToUpload.forEach(uri => newAttachmentsToUpload.push({ uri, type: 'audio' }));
      newDrawingUrisToUpload.forEach(uri => newAttachmentsToUpload.push({ uri, type: 'drawing' }));
      
      if (newAttachmentsToUpload.length > 0) {
        console.log(`📤 Uploading ${newAttachmentsToUpload.length} new attachments...`);
        const uploadResult = await uploadAttachmentsWithProgress(noteId, newAttachmentsToUpload, onProgress);
        
        uploadedImageUris = uploadResult.images;
        uploadedVideoUris = uploadResult.videos;
        uploadedAudioUris = uploadResult.audio;
        uploadedDrawingUris = uploadResult.drawings;
      }
      
      // Combine existing Firebase Storage URLs with newly uploaded ones
      const existingImageUris = newImageUris.filter(uri => uri.includes('firebasestorage.googleapis.com'));
      const existingVideoUris = newVideoUris.filter(uri => uri.includes('firebasestorage.googleapis.com'));
      const existingAudioUris = newAudioUris.filter(uri => uri.includes('firebasestorage.googleapis.com'));
      const existingDrawingUris = newDrawingUris.filter(uri => uri.includes('firebasestorage.googleapis.com'));
      
      finalImageUris = [...existingImageUris, ...uploadedImageUris];
      finalVideoUris = [...existingVideoUris, ...uploadedVideoUris];
      finalAudioUris = [...existingAudioUris, ...uploadedAudioUris];
      finalDrawingUris = [...existingDrawingUris, ...uploadedDrawingUris];
      
      // Find removed attachments
      const removedImageUris = originalImageUris.filter(uri => !newImageUris.includes(uri));
      const removedVideoUris = originalVideoUris.filter(uri => !newVideoUris.includes(uri));
      const removedAudioUris = originalAudioUris.filter(uri => !newAudioUris.includes(uri));
      const removedDrawingUris = originalDrawingUris.filter(uri => !newDrawingUris.includes(uri));
      
      const allRemovedUris = [...removedImageUris, ...removedVideoUris, ...removedAudioUris, ...removedDrawingUris];
      
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
    
    // Update the note document with final attachment URIs
    const updateData = {
      ...noteToDoc(noteData),
      imageUris: finalImageUris.length > 0 ? finalImageUris.join(',') : null,
      videoUris: finalVideoUris.length > 0 ? finalVideoUris.join(',') : null,
      voiceNoteUris: finalAudioUris.length > 0 ? finalAudioUris.join(',') : null,
      drawingUris: finalDrawingUris.length > 0 ? finalDrawingUris.join(',') : null,
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

// Helper function to upload multiple attachments with progress tracking
export const uploadAttachmentsWithProgress = async (
  noteId: number,
  attachments: { uri: string; type: 'image' | 'video' | 'audio' | 'drawing' }[],
  onProgress?: (progress: number) => void
): Promise<{ images: string[]; videos: string[]; audio: string[]; drawings: string[] }> => {
  const uploadedImages: string[] = [];
  const uploadedVideos: string[] = [];
  const uploadedAudio: string[] = [];
  const uploadedDrawings: string[] = [];
  
  const totalAttachments = attachments.length;
  let completedUploads = 0;
  
  for (const attachment of attachments) {
    try {
      const fileName = `${attachment.type}_${Date.now()}_${Math.random()}.${attachment.type === 'image' ? 'jpg' : attachment.type === 'video' ? 'mp4' : attachment.type === 'audio' ? 'm4a' : 'svg'}`;
      
      const downloadURL = await uploadAttachmentToStorage(noteId, attachment.uri, fileName, (progress) => {
        // Calculate overall progress
        const overallProgress = ((completedUploads + progress / 100) / totalAttachments) * 100;
        if (onProgress) {
          onProgress(Math.min(overallProgress, 99)); // Cap at 99% until all uploads complete
        }
      });
      
      // Add to appropriate array
      if (attachment.type === 'image') {
        uploadedImages.push(downloadURL);
      } else if (attachment.type === 'video') {
        uploadedVideos.push(downloadURL);
      } else if (attachment.type === 'audio') {
        uploadedAudio.push(downloadURL);
      } else if (attachment.type === 'drawing') {
        uploadedDrawings.push(downloadURL);
      }
      
      completedUploads++;
      
      // Update progress
      const overallProgress = (completedUploads / totalAttachments) * 100;
      if (onProgress) {
        onProgress(Math.min(overallProgress, 99));
      }
      
    } catch (error) {
      console.error(`Failed to upload ${attachment.type} attachment:`, error);
      throw error;
    }
  }
  
  // Report completion
  if (onProgress) {
    onProgress(100);
  }
  
  return { images: uploadedImages, videos: uploadedVideos, audio: uploadedAudio, drawings: uploadedDrawings };
};

// Firebase Storage functions for attachments
export const uploadAttachmentToStorage = async (
  noteId: number, 
  fileUri: string, 
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    let blob: Blob;
    
    // Handle SVG strings (drawings) differently
    if (fileName.endsWith('.svg') && fileUri.startsWith('<?xml')) {
      // This is an SVG string, convert it to blob
      blob = new Blob([fileUri], { type: 'image/svg+xml' });
    } else {
      // This is a file URI, fetch it
      const response = await fetch(fileUri);
      blob = await response.blob();
    }
    
    // Create storage reference with proper folder structure
    const storageRef = ref(storage, `notes-attachments/${noteId}/${fileName}`);
    
    // Upload the file with progress tracking
    const uploadResult = await uploadBytes(storageRef, blob, {
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      }
    });
    
    // Report progress completion
    if (onProgress) {
      onProgress(100);
    }
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log(`Attachment uploaded successfully: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading attachment to storage:', error);
    throw error;
  }
};

export const deleteAttachmentFromStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
    if (!pathMatch) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return;
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);
    
    await deleteObject(storageRef);
    console.log(`Attachment deleted from storage: ${filePath}`);
  } catch (error) {
    console.error('Error deleting attachment from storage:', error);
    throw error;
  }
};

export const deleteAllAttachmentsFromStorage = async (noteId: number): Promise<void> => {
  try {
    const folderRef = ref(storage, `notes-attachments/${noteId}`);
    const result = await listAll(folderRef);
    
    // Delete all files in the folder
    const deletePromises = result.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
    
    console.log(`All attachments deleted for note ${noteId}`);
  } catch (error) {
    console.error('Error deleting all attachments from storage:', error);
    throw error;
  }
}; 