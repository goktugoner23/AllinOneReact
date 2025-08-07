import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { MediaType, MediaUploadResult } from '../types/MediaAttachment';

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
      default:
        return 'jpg';
    }
  }

  static async uploadMedia(
    uri: string,
    type: MediaType,
    originalName?: string,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResult> {
    try {
      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate file name
      const fileName = this.generateFileName(type, originalName);
      const storageRef = ref(storage, `notes-media/${fileName}`);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            resolve({
              success: false,
              error: error.message,
            });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                success: true,
                uri: downloadURL,
              });
            } catch (error) {
              console.error('Get download URL error:', error);
              resolve({
                success: false,
                error: 'Failed to get download URL',
              });
            }
          }
        );
      });
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
      const storageRef = ref(storage, uri);
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
    onProgress?: (progress: number) => void
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