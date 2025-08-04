export interface Note {
  id: number;
  title: string;
  content: string;
  date: string; // ISO string format for serialization
  imageUris?: string; // Comma-separated list of image URIs
  videoUris?: string; // Comma-separated list of video URIs
  voiceNoteUris?: string; // Comma-separated list of voice note URIs
  drawingUris?: string; // Comma-separated list of drawing URIs
  lastEdited: string; // ISO string format for serialization
  isRichText: boolean; // Flag to indicate if content has rich formatting
}

export interface NoteFormData {
  title: string;
  content: string;
  imageUris?: string;
  videoUris?: string;
  voiceNoteUris?: string;
  drawingUris?: string;
}

 