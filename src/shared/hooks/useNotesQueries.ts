import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib';
import {
  getNotes,
  addNote as addNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
} from '@features/notes/services/notes';
import { Note, NoteFormData } from '@features/notes/types/Note';

// Hook for fetching notes
export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: getNotes,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for fetching a single note
export function useNote(noteId: number | string, enabled = true) {
  const { data: notes = [] } = useNotes();
  const numericId = typeof noteId === 'string' ? parseInt(noteId, 10) : noteId;
  const note = notes.find((n) => n.id === numericId);

  return {
    data: note,
    isLoading: !note && enabled,
  };
}

// Mutation for adding a note
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteData: NoteFormData) => addNoteService(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });
}

// Mutation for updating a note
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, noteData }: { noteId: number; noteData: NoteFormData }) =>
      updateNoteService(noteId, noteData),
    onMutate: async ({ noteId, noteData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });

      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());

      queryClient.setQueryData<Note[]>(
        queryKeys.notes.list(),
        (old) =>
          old?.map((n) => (n.id === noteId ? { ...n, ...noteData, lastEdited: new Date().toISOString() } : n)) ?? [],
      );

      return { previousNotes };
    },
    onError: (_err, _params, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });
}

// Mutation for deleting a note
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => deleteNoteService(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });

      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());

      queryClient.setQueryData<Note[]>(queryKeys.notes.list(), (old) => old?.filter((n) => n.id !== noteId) ?? []);

      return { previousNotes };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });
}

// Hook for searching notes
export function useSearchNotes(searchQuery: string) {
  const { data: notes = [], isLoading } = useNotes();

  const filteredNotes = searchQuery
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notes;

  return { data: filteredNotes, isLoading };
}
