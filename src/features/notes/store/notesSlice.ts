import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Note, NoteFormData } from '@features/notes/types/Note';
import * as notesApi from '@features/notes/services/notes';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedNote: Note | null;
}

const initialState: NotesState = {
  notes: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedNote: null,
};

// Async thunks
export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
  const notes = await notesApi.getNotes();
  return notes;
});

export const addNoteAsync = createAsyncThunk('notes/addNote', async (noteData: NoteFormData, { dispatch }) => {
  const newNote = await notesApi.addNote(noteData);
  // Manually refresh notes since subscription is disabled
  dispatch(fetchNotes());
  return newNote;
});

export const updateNoteAsync = createAsyncThunk(
  'notes/updateNote',
  async ({ noteId, noteData }: { noteId: number; noteData: NoteFormData }, { dispatch }) => {
    await notesApi.updateNote(noteId, noteData);
    // Manually refresh notes since subscription is disabled
    dispatch(fetchNotes());
    return { noteId, noteData };
  },
);

export const deleteNoteAsync = createAsyncThunk('notes/deleteNote', async (noteId: number, { dispatch }) => {
  await notesApi.deleteNote(noteId);
  // Manually refresh notes since subscription is disabled
  dispatch(fetchNotes());
  return noteId;
});

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedNote: (state, action: PayloadAction<Note | null>) => {
      state.selectedNote = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateNotesFromSubscription: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notes';
      })
      // Add note
      .addCase(addNoteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNoteAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure the note has proper string dates
        const note = {
          ...action.payload,
          date: typeof action.payload.date === 'string' ? action.payload.date : new Date().toISOString(),
          lastEdited:
            typeof action.payload.lastEdited === 'string' ? action.payload.lastEdited : new Date().toISOString(),
        };
        state.notes.unshift(note);
      })
      .addCase(addNoteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add note';
      })
      // Update note
      .addCase(updateNoteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNoteAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { noteId, noteData } = action.payload;
        const index = state.notes.findIndex((note) => note.id === noteId);
        if (index !== -1) {
          state.notes[index] = {
            ...state.notes[index],
            ...noteData,
            lastEdited: new Date().toISOString(),
          };
        }
      })
      .addCase(updateNoteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update note';
      })
      // Delete note
      .addCase(deleteNoteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload);
      })
      .addCase(deleteNoteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete note';
      });
  },
});

export const { setSearchQuery, setSelectedNote, clearError, updateNotesFromSubscription } = notesSlice.actions;

export default notesSlice.reducer;
