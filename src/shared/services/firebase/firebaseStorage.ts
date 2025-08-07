import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorageInstance } from '@shared/services/firebase/firebase';
const storage = getStorageInstance();

export interface FileUploadResult {
  url: string;
  fileName: string;
}

/**
 * Upload a file to Firebase Storage and return the download URL
 * Files are stored in a structure: /{folderName}/{id}/filename
 * 
 * @param fileUri The URI of the file to upload
 * @param folderName The folder name in Firebase Storage (e.g., "registrations", "profile_pictures")
 * @param id ID for creating a subfolder (e.g., registration ID)
 * @param fileName Optional custom filename
 * @return The download URL of the uploaded file or null if upload failed
 */
export const uploadFile = async (
  fileUri: string,
  folderName: string,
  id: string,
  fileName?: string
): Promise<string | null> => {
  try {
    console.log(`📤 Uploading file to Firebase Storage: ${folderName}/${id}`);
    
    // Fetch the file from URI
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Generate filename if not provided
    const finalFileName = fileName || `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create reference to the file location
    const fileRef = ref(storage, `${folderName}/${id}/${finalFileName}`);
    
    // Upload file
    await uploadBytes(fileRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    console.log(`✅ File uploaded successfully: ${downloadURL}`);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    return null;
  }
};

/**
 * Delete a file from Firebase Storage
 *
 * @param fileUrl The download URL of the file to delete
 * @return True if the deletion was successful, false otherwise
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting file from Firebase Storage: ${fileUrl}`);
    
    // Get reference from URL
    const fileRef = ref(storage, fileUrl);
    
    // Delete the file
    await deleteObject(fileRef);
    
    console.log('✅ File deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

/**
 * Extract file name from URI
 */
export const getFileNameFromUri = (uri: string): string => {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `file_${Date.now()}`;
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
};