import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useColors } from '@shared/theme';
import { MediaService } from '@shared/services/MediaService';
import { MediaType } from '@shared/types/MediaAttachment';

interface PendingImage {
  localUri: string;
  uploadedUrl?: string;
  uploading: boolean;
}

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const colors = useColors();
  const [text, setText] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const hasImages = pendingImages.length > 0;
  const allUploaded = pendingImages.every(img => !!img.uploadedUrl);
  const canSend = (!disabled) && (text.trim() || hasImages) && (!hasImages || allUploaded);

  const handleSend = () => {
    if (!canSend) return;
    const imageUrls = pendingImages.map(img => img.uploadedUrl!).filter(Boolean);
    onSend(text.trim(), imageUrls.length > 0 ? imageUrls : undefined);
    setText('');
    setPendingImages([]);
  };

  const handlePickImage = async () => {
    if (disabled || pendingImages.length >= 3) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 3 - pendingImages.length,
      quality: 0.7,
    });

    if (result.didCancel || !result.assets?.length) return;

    const newImages: PendingImage[] = result.assets.map(asset => ({
      localUri: asset.uri!,
      uploading: true,
    }));

    setPendingImages(prev => [...prev, ...newImages]);

    // Upload each image
    for (const img of newImages) {
      try {
        const uploadResult = await MediaService.uploadMedia(
          img.localUri,
          MediaType.IMAGE,
          undefined,
          undefined,
          'chat-media',
        );
        if (uploadResult.success && uploadResult.uri) {
          setPendingImages(prev =>
            prev.map(p =>
              p.localUri === img.localUri ? { ...p, uploadedUrl: uploadResult.uri, uploading: false } : p,
            ),
          );
        } else {
          // Remove failed image
          setPendingImages(prev => prev.filter(p => p.localUri !== img.localUri));
        }
      } catch {
        setPendingImages(prev => prev.filter(p => p.localUri !== img.localUri));
      }
    }
  };

  const removeImage = (localUri: string) => {
    setPendingImages(prev => prev.filter(p => p.localUri !== localUri));
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {hasImages && (
        <View style={styles.imagePreviewRow}>
          {pendingImages.map(img => (
            <View key={img.localUri} style={styles.imagePreviewContainer}>
              <Image source={{ uri: img.localUri }} style={styles.imagePreview} />
              {img.uploading && (
                <View style={styles.imageUploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <TouchableOpacity
                style={[styles.removeImageBtn, { backgroundColor: colors.destructive }]}
                onPress={() => removeImage(img.localUri)}
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={handlePickImage}
          disabled={disabled || pendingImages.length >= 3}
        >
          <Ionicons
            name="image-outline"
            size={24}
            color={disabled || pendingImages.length >= 3 ? colors.foregroundSubtle : colors.primary}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.foreground }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.foregroundSubtle}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.border }]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons name="send" size={18} color={canSend ? colors.primaryForeground : colors.foregroundSubtle} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  imageUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
