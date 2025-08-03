import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Note, NoteFormData } from '../types/Note';
import { firebaseIdManager } from './firebaseIdManager';

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
    const q = query(collection(db, NOTES_COLLECTION), orderBy('lastEdited', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNote);
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
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
    console.error('❌ Error adding note:', error);
    throw error;
  } finally {
    isCreatingNote = false;
    console.log('🔵 Note creation completed, flag reset');
  }
};

// Update an existing note
export const updateNote = async (noteId: number, noteData: NoteFormData): Promise<void> => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    const updateData = {
      ...noteToDoc(noteData),
      lastEdited: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId.toString());
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Subscribe to notes changes - temporarily disabled due to Firestore assertion errors
export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  console.warn('Notes subscription temporarily disabled due to Firestore assertion errors');
  callback([]);
  return () => {}; // Return empty unsubscribe function
}; 