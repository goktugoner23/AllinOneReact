/**
 * Investment attachment uploads — talks to Cloudflare R2 via huginn-external.
 *
 * NOTE: The exported field names `imageUris`, `videoUris`, `voiceNoteUris`
 * are preserved for backward compatibility with call sites, but their
 * contents are now R2 object KEYS (opaque, e.g. "investments/123/...") not
 * signed URLs. Use getDisplayUrl(key) from r2Storage to render them.
 */

import { uploadToR2 } from '@shared/services/storage/r2Storage';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';

function getExtensionFromUri(uri: string): string {
  try {
    const withoutQuery = uri.split('?')[0];
    const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    return match && match[1] ? match[1] : '';
  } catch {
    return '';
  }
}

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function mimeTypeFor(att: MediaAttachment, ext: string): string {
  const e = ext.toLowerCase();
  if (att.type === MediaType.IMAGE) {
    if (e === 'png') return 'image/png';
    if (e === 'webp') return 'image/webp';
    if (e === 'gif') return 'image/gif';
    return 'image/jpeg';
  }
  if (att.type === MediaType.VIDEO) {
    if (e === 'mov') return 'video/quicktime';
    if (e === 'webm') return 'video/webm';
    return 'video/mp4';
  }
  if (att.type === MediaType.AUDIO) {
    if (e === 'mp3') return 'audio/mpeg';
    if (e === 'wav') return 'audio/wav';
    if (e === 'aac') return 'audio/aac';
    return 'audio/m4a';
  }
  return 'application/octet-stream';
}

export interface UploadedInvestmentUris {
  /** R2 object keys for images (field name kept for back-compat). */
  imageUris: string[];
  /** R2 object keys for videos. */
  videoUris: string[];
  /** R2 object keys for voice notes. */
  voiceNoteUris: string[];
}

/**
 * Upload investment attachments under R2 folder `investments/{investmentId}/`.
 * Returns arrays of R2 object keys grouped by media type. Remote (http/https)
 * attachments are passed through unchanged so previously-uploaded items are
 * preserved as-is.
 */
export async function uploadInvestmentAttachments(
  investmentId: string,
  attachments: MediaAttachment[],
): Promise<UploadedInvestmentUris> {
  const result: UploadedInvestmentUris = {
    imageUris: [],
    videoUris: [],
    voiceNoteUris: [],
  };

  let imageIndex = 1;
  let videoIndex = 1;
  let audioIndex = 1;

  for (const att of attachments) {
    // Keep remote URIs / already-uploaded keys as-is.
    if (isRemoteUri(att.uri)) {
      if (att.type === MediaType.IMAGE) result.imageUris.push(att.uri);
      else if (att.type === MediaType.VIDEO) result.videoUris.push(att.uri);
      else if (att.type === MediaType.AUDIO) result.voiceNoteUris.push(att.uri);
      continue;
    }

    const ext = getExtensionFromUri(att.uri);

    let finalName = '';
    switch (att.type) {
      case MediaType.IMAGE: {
        finalName = `image_${String(imageIndex).padStart(3, '0')}${ext ? '.' + ext : ''}`;
        imageIndex += 1;
        break;
      }
      case MediaType.VIDEO: {
        finalName = `video_${String(videoIndex).padStart(3, '0')}${ext ? '.' + ext : ''}`;
        videoIndex += 1;
        break;
      }
      case MediaType.AUDIO: {
        finalName = `audio_${String(audioIndex).padStart(3, '0')}${ext ? '.' + ext : ''}`;
        audioIndex += 1;
        break;
      }
      default: {
        finalName = att.name || `file_${Date.now()}${ext ? '.' + ext : ''}`;
      }
    }

    try {
      const uploaded = await uploadToR2({
        uri: att.uri,
        fileName: finalName,
        mimeType: mimeTypeFor(att, ext),
        folder: 'investments',
        entityId: String(investmentId),
      });

      if (att.type === MediaType.IMAGE) result.imageUris.push(uploaded.key);
      else if (att.type === MediaType.VIDEO) result.videoUris.push(uploaded.key);
      else if (att.type === MediaType.AUDIO) result.voiceNoteUris.push(uploaded.key);
    } catch {
      // Fall back to the original local URI so the caller still sees something;
      // matches the previous implementation.
      if (att.type === MediaType.IMAGE) result.imageUris.push(att.uri);
      else if (att.type === MediaType.VIDEO) result.videoUris.push(att.uri);
      else if (att.type === MediaType.AUDIO) result.voiceNoteUris.push(att.uri);
    }
  }

  return result;
}
