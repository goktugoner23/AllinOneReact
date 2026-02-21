import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorageInstance } from '@shared/services/firebase/firebase';
import { MediaType, MediaUploadResult } from '@shared/types/MediaAttachment';

export class MediaService {
  private static generateFileName(type: MediaType, originalName?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalName ? originalName.split('.').pop() : this.getDefaultExtension(type);
    return `${type.toLowerCase()}_${timestamp}_${randomId}.${extension}`;
  }

  private static getDefaultExtension(type: MediaType): string {
    switch (type) {
      case MediaType.IMAGE:
        return 'jpg';
      case MediaType.VIDEO:
        return 'mp4';
      case MediaType.AUDIO:
        return 'm4a';
      case MediaType.DOCUMENT:
        return 'pdf';
      default:
        return 'jpg';
    }
  }

  private static getMimeType(type: MediaType, originalName?: string): string {
    if (originalName) {
      const ext = originalName.split('.').pop()?.toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp4: 'video/mp4', mov: 'video/quicktime',
        m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac',
        pdf: 'application/pdf', csv: 'text/csv', txt: 'text/plain',
      };
      if (ext && mimeMap[ext]) return mimeMap[ext];
    }
    switch (type) {
      case MediaType.IMAGE: return 'image/jpeg';
      case MediaType.VIDEO: return 'video/mp4';
      case MediaType.AUDIO: return 'audio/mp4';
      case MediaType.DOCUMENT: return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Read a local file as a Blob using RN's native fetch(),
   * which handles file://, content://, and other local URIs.
   */
  private static async readFileAsBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return response.blob();
  }

  static async uploadMedia(
    uri: string,
    type: MediaType,
    originalName?: string,
    onProgress?: (progress: number) => void,
    folder: string = 'notes-media',
  ): Promise<MediaUploadResult> {
    try {
      // Generate file name and determine content type
      const fileName = this.generateFileName(type, originalName);
      const contentType = this.getMimeType(type, originalName || fileName);
      const storageRef = ref(getStorageInstance(), `${folder}/${fileName}`);

      const blob = await this.readFileAsBlob(uri);
      const snapshot = await uploadBytes(storageRef, blob, { contentType });
      onProgress?.(100);

      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, uri: downloadURL };
    } catch (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteMedia(uri: string): Promise<boolean> {
    try {
      const storageRef = ref(getStorageInstance(), uri);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Delete media error:', error);
      return false;
    }
  }

  static async uploadMultipleMedia(
    uris: string[],
    type: MediaType,
    onProgress?: (progress: number) => void,
  ): Promise<MediaUploadResult[]> {
    const results: MediaUploadResult[] = [];
    let completed = 0;

    for (const uri of uris) {
      const result = await this.uploadMedia(uri, type, undefined, (progress) => {
        // Calculate overall progress
        const overallProgress = ((completed + progress / 100) / uris.length) * 100;
        onProgress?.(overallProgress);
      });

      results.push(result);
      completed++;

      if (!result.success) {
        // Stop on first error
        break;
      }
    }

    return results;
  }
}
