/**
 * Notes service — talks to huginn-external REST API (no Firebase).
 *
 * - CRUD goes through `api.*` which auto-unwraps the `{ success, data }` envelope
 *   and attaches the shared bearer token.
 * - Attachments live in Cloudflare R2. We store **object keys** (not URLs) in
 *   the comma-separated attachment fields on a Note. Display URLs are resolved
 *   lazily elsewhere via `getDisplayUrl(key)`.
 * - Backend DTO uses snake_case (`image_uris`, `last_edited`, `is_rich_text`);
 *   mobile `Note` type uses camelCase. Conversion happens in the mappers below.
 */
import { api } from '@shared/services/api/httpClient';
import {
  uploadToR2,
  deleteFromR2,
  StorageFolder,
} from '@shared/services/storage/r2Storage';
import { Note, NoteFormData } from '@features/notes/types/Note';

const NOTES_FOLDER: StorageFolder = 'notes';

// ──────────────────────────────────────────────────────────────────────────
// Backend DTO <-> mobile Note mapping
// ──────────────────────────────────────────────────────────────────────────

interface BackendNote {
  id: number;
  title: string;
  content: string;
  is_rich_text: boolean;
  date: string;
  last_edited: string;
  image_uris: string | null;
  video_uris: string | null;
  voice_note_uris: string | null;
  drawing_uris: string | null;
}

interface BackendNoteFormData {
  title: string;
  content: string;
  is_rich_text?: boolean;
  image_uris?: string | null;
  video_uris?: string | null;
  voice_note_uris?: string | null;
  drawing_uris?: string | null;
}

const fromBackend = (n: BackendNote): Note => ({
  id: n.id,
  title: n.title ?? '',
  content: n.content ?? '',
  date: n.date,
  lastEdited: n.last_edited,
  isRichText: n.is_rich_text ?? true,
  imageUris: n.image_uris ?? undefined,
  videoUris: n.video_uris ?? undefined,
  voiceNoteUris: n.voice_note_uris ?? undefined,
  drawingUris: n.drawing_uris ?? undefined,
});

const toBackend = (
  data: NoteFormData,
  overrides?: Partial<BackendNoteFormData>,
): BackendNoteFormData => ({
  title: data.title,
  content: data.content,
  is_rich_text: true,
  image_uris: data.imageUris ?? null,
  video_uris: data.videoUris ?? null,
  voice_note_uris: data.voiceNoteUris ?? null,
  drawing_uris: data.drawingUris ?? null,
  ...overrides,
});

// ──────────────────────────────────────────────────────────────────────────
// Attachment helpers
// ──────────────────────────────────────────────────────────────────────────

const splitCsv = (s?: string | null): string[] =>
  s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];

const joinCsv = (arr: string[]): string | null =>
  arr.length > 0 ? arr.join(',') : null;

/** A value "looks like" an R2 key if it's not a URL and not a local file URI. */
const looksLikeR2Key = (s: string): boolean => {
  if (!s) return false;
  if (s.startsWith('http://') || s.startsWith('https://')) return false;
  if (s.startsWith('file://') || s.startsWith('content://')) return false;
  if (s.startsWith('<?xml')) return false;
  return true;
};

const guessMimeType = (fileName: string, kind: 'image' | 'video' | 'audio'): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return kind === 'audio' ? 'audio/mp4' : 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (kind === 'image') return 'image/jpeg';
  if (kind === 'video') return 'video/mp4';
  return 'audio/mp4';
};

// ──────────────────────────────────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────────────────────────────────

export const getNotes = async (): Promise<Note[]> => {
  try {
    const backend = await api.get<BackendNote[]>('/api/notes');
    return backend.map(fromBackend);
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

export const addNote = async (
  noteData: NoteFormData,
  _onProgress?: (progress: number) => void,
): Promise<Note> => {
  const created = await api.post<BackendNote>('/api/notes', toBackend(noteData));
  return fromBackend(created);
};

export const updateNote = async (
  noteId: number,
  noteData: NoteFormData,
  _onProgress?: (progress: number) => void,
): Promise<void> => {
  await api.put<BackendNote>(`/api/notes/${noteId}`, toBackend(noteData));
};

export const deleteNote = async (noteId: number): Promise<void> => {
  // Best-effort: fetch current note so we can clean up attached R2 objects first.
  try {
    const current = await api.get<BackendNote>(`/api/notes/${noteId}`);
    const keys = [
      ...splitCsv(current.image_uris),
      ...splitCsv(current.video_uris),
      ...splitCsv(current.voice_note_uris),
      ...splitCsv(current.drawing_uris),
    ].filter(looksLikeR2Key);
    await Promise.all(
      keys.map((k) =>
        deleteFromR2(k).catch((e) =>
          console.warn(`Failed to delete R2 object ${k}:`, e),
        ),
      ),
    );
  } catch (e) {
    console.warn(`Could not preload note ${noteId} attachments before delete:`, e);
  }

  await api.delete(`/api/notes/${noteId}`);
};

// ──────────────────────────────────────────────────────────────────────────
// Realtime (disabled)
// ──────────────────────────────────────────────────────────────────────────

/**
 * TODO: real-time updates are disabled until huginn-external exposes a notes
 * websocket. For now this is a one-shot fetch that invokes the callback once.
 */
export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  let cancelled = false;
  getNotes()
    .then((notes) => {
      if (!cancelled) callback(notes);
    })
    .catch(() => {});
  return () => {
    cancelled = true;
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Attachment upload / delete
// ──────────────────────────────────────────────────────────────────────────

/**
 * Upload a single local file to R2 under the `notes` folder and return the
 * opaque R2 object **key** (not a URL). Callers should persist the key.
 */
export const uploadAttachmentToStorage = async (
  noteId: number,
  fileUri: string,
  fileName: string,
  _onProgress?: (progress: number) => void,
): Promise<string> => {
  // Infer a kind from the file extension for mime-type fallback.
  const lower = fileName.toLowerCase();
  const kind: 'image' | 'video' | 'audio' =
    lower.endsWith('.mp4') || lower.endsWith('.mov')
      ? 'video'
      : lower.endsWith('.m4a') || lower.endsWith('.wav') || lower.endsWith('.mp3')
        ? 'audio'
        : 'image';
  const mimeType = guessMimeType(fileName, kind);

  const result = await uploadToR2({
    uri: fileUri,
    fileName,
    mimeType,
    folder: NOTES_FOLDER,
    entityId: String(noteId),
  });
  return result.key;
};

/**
 * Upload multiple attachments sequentially. No per-byte progress is available
 * from fetch in React Native, so we emit a coarse progress that advances once
 * per completed file.
 */
export const uploadAttachmentsWithProgress = async (
  noteId: number,
  attachments: { uri: string; type: 'image' | 'video' | 'audio' }[],
  onProgress?: (progress: number) => void,
): Promise<{ images: string[]; videos: string[]; audio: string[] }> => {
  const images: string[] = [];
  const videos: string[] = [];
  const audio: string[] = [];

  const total = attachments.length;
  let completed = 0;

  for (const a of attachments) {
    const ext = a.type === 'image' ? 'jpg' : a.type === 'video' ? 'mp4' : 'm4a';
    const fileName = `${a.type}_${Date.now()}_${Math.floor(Math.random() * 1e9)}.${ext}`;

    if (onProgress) onProgress((completed / total) * 100);

    try {
      const key = await uploadAttachmentToStorage(noteId, a.uri, fileName);
      if (a.type === 'image') images.push(key);
      else if (a.type === 'video') videos.push(key);
      else audio.push(key);
    } catch (error) {
      console.error(`Failed to upload ${a.type} attachment:`, error);
      throw error;
    }

    completed++;
    if (onProgress) onProgress(Math.min((completed / total) * 100, 99));
  }

  if (onProgress) onProgress(100);
  return { images, videos, audio };
};

/**
 * Delete a single attachment.
 * Accepts R2 keys (or legacy Firebase URLs — those are ignored / handled by the
 * server). Local `file://` URIs are also ignored.
 */
export const deleteAttachmentByUri = async (uri: string): Promise<void> => {
  if (!uri) return;
  if (!looksLikeR2Key(uri)) {
    console.warn(`deleteAttachmentByUri: skipping non-key value: ${uri}`);
    return;
  }
  try {
    await deleteFromR2(uri);
  } catch (error) {
    console.warn(`Failed to delete R2 object ${uri}:`, error);
  }
};

/**
 * Delete multiple attachments.
 * Accepts R2 keys (or legacy Firebase URLs — those are ignored / handled by the
 * server).
 */
export const deleteAttachmentsByUris = async (uris: string[]): Promise<void> => {
  await Promise.all(uris.map((u) => deleteAttachmentByUri(u)));
};

/**
 * Delete an attachment given either an R2 key or a legacy URL.
 * URLs are treated as no-ops (logged). Keys are deleted via R2.
 */
export const deleteAttachmentFromStorage = async (
  fileUrlOrKey: string,
): Promise<void> => {
  if (!fileUrlOrKey) return;
  if (!looksLikeR2Key(fileUrlOrKey)) {
    console.warn(
      `deleteAttachmentFromStorage: received URL/local URI, skipping: ${fileUrlOrKey}`,
    );
    return;
  }
  await deleteFromR2(fileUrlOrKey);
};

/**
 * Best-effort cleanup of every R2 object referenced by a note. There is no
 * list-all endpoint, so we fetch the note and iterate its attachment keys. If
 * the note is gone, we resolve silently.
 */
export const deleteAllAttachmentsFromStorage = async (
  noteId: number,
): Promise<void> => {
  try {
    const note = await api.get<BackendNote>(`/api/notes/${noteId}`);
    const keys = [
      ...splitCsv(note.image_uris),
      ...splitCsv(note.video_uris),
      ...splitCsv(note.voice_note_uris),
      ...splitCsv(note.drawing_uris),
    ].filter(looksLikeR2Key);
    await Promise.all(
      keys.map((k) =>
        deleteFromR2(k).catch((e) =>
          console.warn(`Failed to delete R2 object ${k}:`, e),
        ),
      ),
    );
  } catch {
    // Note no longer exists or network failure — nothing to do.
  }
};

// Re-export a joinCsv/splitCsv pair? Not needed externally; screens receive
// already-joined strings from Note and pass them back via NoteFormData.
void joinCsv;
