export interface MediaAttachment {
  id: string;
  /**
   * Short-lived signed display URL (10min) resolved from `key` via
   * `getDisplayUrl`. Ephemeral — never persist this. For legacy rows without
   * a `key`, this may hold a raw stored URL as a fallback.
   */
  uri: string;
  /**
   * Opaque R2 object key. Source of truth for persistence. Optional because
   * legacy attachments loaded from old notes may only have a URL.
   */
  key?: string;
  type: MediaType;
  name?: string;
  size?: number;
  duration?: number; // For audio/video in milliseconds
  thumbnailUri?: string;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DRAWING = 'DRAWING',
  DOCUMENT = 'DOCUMENT',
}

export interface MediaAttachmentsState {
  attachments: MediaAttachment[];
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

export interface MediaUploadResult {
  success: boolean;
  /** R2 object key — source of truth for persistence. */
  key?: string;
  /** Short-lived signed display URL for immediate rendering. */
  uri?: string;
  error?: string;
}
