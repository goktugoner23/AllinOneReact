import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import {
  fetchNotes,
  addNoteAsync,
  updateNoteAsync,
  deleteNoteAsync,
  setSearchQuery,
  setSelectedNote,
  clearError,
  updateNotesFromSubscription,
} from '@features/notes/store/notesSlice';
import { Note, NoteFormData } from '@features/notes/types/Note';
import { subscribeToNotes } from '@features/notes/services/notes';

/**
 * @deprecated Use TanStack Query hooks from @shared/hooks instead:
 * - useNotes() -> import { useNotes } from '@shared/hooks'
 * - useAddNote() -> import { useAddNote } from '@shared/hooks'
 * - useUpdateNote() -> import { useUpdateNote } from '@shared/hooks'
 * - useDeleteNote() -> import { useDeleteNote } from '@shared/hooks'
 */
export const useNotesLegacy = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notes, loading, error, searchQuery, selectedNote } = useSelector((state: RootState) => state.notes);

  // Filter notes based on search query
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  // Initialize notes subscription (temporarily disabled due to Firestore errors)
  useEffect(() => {
    // Temporarily disabled subscription due to Firestore assertion errors
    // const unsubscribe = subscribeToNotes((notes) => {
    //   dispatch(updateNotesFromSubscription(notes));
    // });
    // return () => unsubscribe();

    // Manually load notes on mount instead
    dispatch(fetchNotes());
  }, [dispatch]);

  // Actions
  const loadNotes = useCallback(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

  const addNote = useCallback(
    (noteData: NoteFormData) => {
      return dispatch(addNoteAsync(noteData));
    },
    [dispatch],
  );

  const updateNote = useCallback(
    (noteId: number, noteData: NoteFormData) => {
      return dispatch(updateNoteAsync({ noteId, noteData }));
    },
    [dispatch],
  );

  const deleteNote = useCallback(
    (noteId: number) => {
      return dispatch(deleteNoteAsync(noteId));
    },
    [dispatch],
  );

  const setSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch],
  );

  const selectNote = useCallback(
    (note: Note | null) => {
      dispatch(setSelectedNote(note));
    },
    [dispatch],
  );

  const clearErrorState = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    notes: filteredNotes,
    loading,
    error,
    searchQuery,
    selectedNote,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    setSearch,
    selectNote,
    clearError: clearErrorState,
  };
};
