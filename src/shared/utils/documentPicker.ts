import { Alert, Platform } from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';

export interface DocumentPickerResult {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
}

export const pickDocument = async (): Promise<DocumentPickerResult | null> => {
  try {
    console.log('🔍 Opening file/document picker...');

    // Use proper document picker to open file manager
    const result = await pick({
      type: [types.allFiles],
    });

    console.log('📁 File picked:', {
      name: result[0]?.name,
      type: result[0]?.type,
      uri: result[0]?.uri,
      size: result[0]?.size,
    });

    if (result && result[0]) {
      return {
        uri: result[0].uri || '',
        name: result[0].name || undefined,
        type: result[0].type || undefined,
        size: result[0].size || undefined,
      };
    }

    console.log('❌ No file selected');
    return null;
  } catch (error) {
    // Check if user cancelled - this is normal behavior, not an error
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      console.log('✅ User cancelled document picker (normal behavior)');
      return null;
    }

    // Also check for string-based cancellation messages
    if (error instanceof Error && error.message.includes('canceled')) {
      console.log('✅ User cancelled document picker (normal behavior)');
      return null;
    }

    // Only log and show alert for actual errors, not cancellations
    console.error('❌ Error picking document:', error);
    // No in-alert "Try Again": this function has already returned null to the
    // caller, so a file picked from a retry here would be silently dropped. The
    // user re-taps the attach control to retry cleanly.
    Alert.alert('File Selection Error', 'Failed to open file picker. Please try again.', [
      { text: 'OK', style: 'cancel' },
    ]);
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
