import { Alert, Linking, Platform } from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

export interface DocumentPickerResult {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
}

export const pickDocument = async (): Promise<DocumentPickerResult | null> => {
  try {
    console.log('🔍 Opening file/document picker...');
    
    // Use image picker with mixed media type for better file manager access
    const result = await new Promise<ImagePickerResponse>((resolve) => {
      launchImageLibrary({
        mediaType: 'mixed' as MediaType,
        includeBase64: false,
        quality: 1,
        selectionLimit: 1,
        includeExtra: true,
        presentationStyle: 'fullScreen',
      }, resolve);
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      console.log('📁 File picked:', {
        name: asset.fileName,
        type: asset.type,
        uri: asset.uri,
        size: asset.fileSize
      });

      return {
        uri: asset.uri || '',
        name: asset.fileName || asset.uri?.split('/').pop(),
        type: asset.type,
        size: asset.fileSize,
      };
    }

    console.log('❌ No file selected');
    return null;
  } catch (error) {
    console.error('❌ Error picking document:', error);
    
    // Show helpful message for PDF selection
    Alert.alert(
      'File Selection',
      'For PDF files, you can:\n\n1. Save PDFs as photos in your gallery\n2. Use a file sharing app to open PDFs with this app\n3. Convert PDFs to images\n\nFor now, please select image files.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: () => pickDocument() }
      ]
    );
    return null;
  }
};

export const isValidReceiptFile = (fileName: string): boolean => {
  if (!fileName) return false;
  const extension = fileName.toLowerCase().split('.').pop();
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'];
  const isValid = allowedExtensions.includes(extension || '');
  console.log(`📋 File validation - ${fileName}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  return isValid;
};