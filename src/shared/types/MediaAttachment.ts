export interface MediaAttachment {
  id: string;
  uri: string;
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
}

export interface MediaAttachmentsState {
  attachments: MediaAttachment[];
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

export interface MediaUploadResult {
  success: boolean;
  uri?: string;
  error?: string;
}
