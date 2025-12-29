import { uploadFile, getFileNameFromUri } from '@shared/services/firebase/firebaseStorage';
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

export interface UploadedInvestmentUris {
  imageUris: string[];
  videoUris: string[];
  voiceNoteUris: string[];
}

/**
 * Upload investment attachments under investments/{investmentId}/filename
 * Returns arrays of download URLs grouped by media type.
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
    const ext = getExtensionFromUri(att.uri);
    const baseName = getFileNameFromUri(att.uri);

    // Keep remote URIs as-is
    if (isRemoteUri(att.uri)) {
      if (att.type === MediaType.IMAGE) result.imageUris.push(att.uri);
      else if (att.type === MediaType.VIDEO) result.videoUris.push(att.uri);
      else if (att.type === MediaType.AUDIO) result.voiceNoteUris.push(att.uri);
      continue;
    }

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
        // Fallback to original name if type is unknown
        finalName = baseName || `file_${Date.now()}`;
      }
    }

    const uploaded = await uploadFile(att.uri, 'investments', investmentId, finalName);
    const url = uploaded || att.uri; // fallback to original if upload fails

    if (att.type === MediaType.IMAGE) result.imageUris.push(url);
    else if (att.type === MediaType.VIDEO) result.videoUris.push(url);
    else if (att.type === MediaType.AUDIO) result.voiceNoteUris.push(url);
  }

  return result;
}
