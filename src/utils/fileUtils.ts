import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Download a file from Firebase Storage URL and open it
 * @param fileUrl The Firebase Storage download URL or local file URI
 * @param fileName Optional filename for the downloaded file
 */
export async function downloadAndOpenFile(fileUrl: string, fileName?: string): Promise<void> {
  try {
    // Check if this is already a local file URI
    if (fileUrl.startsWith('file://') || fileUrl.startsWith(FileSystem.cacheDirectory)) {
      // It's already a local file, open it directly
      const extractedFileName = fileName || fileUrl.split('/').pop() || 'download';
      await openFile(fileUrl, extractedFileName);
      return;
    }
    
    // Extract filename from URL if not provided
    const extractedFileName = fileName || fileUrl.split('/').pop() || 'download';
    
    // Create a temporary file path
    const fileUri = `${FileSystem.cacheDirectory}${extractedFileName}`;
    
    // Download the file
    const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
    
    if (downloadResult.status === 200) {
      // Try to open the file with the appropriate app
      await openFile(downloadResult.uri, extractedFileName);
    } else {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('Error downloading and opening file:', error);
    throw error;
  }
}

/**
 * Open a file with the appropriate app
 * @param fileUri Local file URI
 * @param fileName File name for display
 */
export async function openFile(fileUri: string, fileName: string): Promise<void> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Determine MIME type based on file extension
    const mimeType = getMimeType(fileName);
    
    if (Platform.OS === 'android') {
      // Use Intent Launcher for Android
      const result = await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.View,
        {
          data: fileUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        }
      );
      
      if (result.resultCode !== IntentLauncher.ResultCode.Success) {
        // Fallback to sharing if intent launcher fails
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Open ${fileName}`,
        });
      }
    } else {
      // Use Sharing for iOS
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Open ${fileName}`,
      });
    }
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
}

/**
 * Get MIME type based on file extension
 * @param fileName File name
 * @returns MIME type string
 */
function getMimeType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    case 'mp4':
      return 'video/mp4';
    case 'mp3':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Check if a file exists locally
 * @param fileUrl Firebase Storage URL
 * @returns Promise<boolean>
 */
export async function isFileDownloaded(fileUrl: string): Promise<boolean> {
  try {
    const fileName = fileUrl.split('/').pop() || 'download';
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

/**
 * Get local file URI if file is downloaded
 * @param fileUrl Firebase Storage URL
 * @returns Promise<string | null>
 */
export async function getLocalFileUri(fileUrl: string): Promise<string | null> {
  try {
    const fileName = fileUrl.split('/').pop() || 'download';
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      return fileUri;
    }
    return null;
  } catch (error) {
    console.error('Error getting local file URI:', error);
    return null;
  }
} 