import {
  uploadToR2,
  deleteFromR2,
  getDisplayUrl,
  type StorageFolder,
} from '@shared/services/storage/r2Storage';
import { MediaType, MediaUploadResult } from '@shared/types/MediaAttachment';

const KNOWN_FOLDERS: ReadonlySet<StorageFolder> = new Set([
  'notes',
  'investments',
  'registrations',
  'students',
  'transactions',
  'workout',
]);

/**
 * Media upload/delete facade on top of the R2 storage client.
 *
 * Note: callers currently treat the returned `uri` as a display URL. We return
 * a short-lived signed URL from R2 so existing display code keeps working. The
 * underlying opaque `key` is also returned for callers that can persist it.
 */
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
   * Coerce the legacy free-form `folder` string into a valid R2 StorageFolder.
   * Unknown folders (e.g. the legacy 'chat-media', 'notes-media') fall back to
   * 'notes' so uploads still land in a valid bucket prefix.
   */
  private static resolveFolder(folder: string): StorageFolder {
    if (KNOWN_FOLDERS.has(folder as StorageFolder)) return folder as StorageFolder;
    return 'notes';
  }

  static async uploadMedia(
    uri: string,
    type: MediaType,
    originalName?: string,
    onProgress?: (progress: number) => void,
    folder: string = 'notes',
  ): Promise<MediaUploadResult> {
    try {
      const fileName = this.generateFileName(type, originalName);
      const mimeType = this.getMimeType(type, originalName || fileName);

      const result = await uploadToR2({
        uri,
        fileName,
        mimeType,
        folder: this.resolveFolder(folder),
      });
      onProgress?.(100);

      // Return a signed display URL so existing callers that treat `uri` as
      // an <Image source={{ uri }}> value keep working. The opaque key is the
      // source of truth for later deletes / re-signing.
      const displayUrl = await getDisplayUrl(result.key);
      return { success: true, uri: displayUrl };
    } catch (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete by R2 object key. Callers that still pass a signed URL will hit the
   * warning branch — those call sites need to be migrated to store the key.
   */
  static async deleteMedia(keyOrUrl: string): Promise<boolean> {
    try {
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        console.warn(
          'MediaService.deleteMedia called with a URL instead of an R2 key; skipping delete.',
        );
        return false;
      }
      await deleteFromR2(keyOrUrl);
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
        const overallProgress = ((completed + progress / 100) / uris.length) * 100;
        onProgress?.(overallProgress);
      });

      results.push(result);
      completed++;

      if (!result.success) {
        break;
      }
    }

    return results;
  }
}
