import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity, Modal, Text, Image } from 'react-native';
import { launchImageLibrary, launchCamera, MediaType as ImagePickerMediaType } from 'react-native-image-picker';
import { MediaAttachment, MediaType, MediaAttachmentsState } from '@shared/types/MediaAttachment';
import { MediaService } from '@shared/services/MediaService';
import MediaViewer from '@shared/components/ui/MediaViewer';
import VoiceRecorder from '@shared/components/ui/VoiceRecorder';
import { useAppTheme } from '@shared/theme';
import { Card, CardContent, IconButton, Button, ProgressBar, Chip } from '@shared/components/ui';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

interface MediaAttachmentManagerProps {
  state: MediaAttachmentsState;
  onStateChange: (state: MediaAttachmentsState) => void;
  onViewAttachment?: (attachment: MediaAttachment, index: number) => void;
}

const MediaAttachmentManager: React.FC<MediaAttachmentManagerProps> = ({ state, onStateChange, onViewAttachment }) => {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MediaAttachment | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { colors, spacing, radius, textStyles } = useAppTheme();

  const updateState = useCallback(
    (updates: Partial<MediaAttachmentsState>) => {
      onStateChange({ ...state, ...updates });
    },
    [state, onStateChange],
  );

  const handleImagePicker = useCallback(async (mediaType: ImagePickerMediaType) => {
    try {
      const result = await launchImageLibrary({
        mediaType,
        selectionLimit: 10,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri!).filter(Boolean);
        await uploadMedia(uris, mediaType === 'video' ? MediaType.VIDEO : MediaType.IMAGE);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  }, []);

  const handleCamera = useCallback(async (mediaType: ImagePickerMediaType) => {
    try {
      const result = await launchCamera({
        mediaType,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri!;
        await uploadMedia([uri], mediaType === 'video' ? MediaType.VIDEO : MediaType.IMAGE);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture media');
    }
  }, []);

  const uploadMedia = useCallback(
    async (uris: string[], type: MediaType) => {
      updateState({ isUploading: true, uploadProgress: 0, error: undefined });

      try {
        const results = await MediaService.uploadMultipleMedia(uris, type, (progress) => {
          updateState({ uploadProgress: progress });
        });

        const successfulResults = results.filter((result) => result.success);
        const failedResults = results.filter((result) => !result.success);

        if (failedResults.length > 0) {
          updateState({ error: `Failed to upload ${failedResults.length} files` });
        }

        if (successfulResults.length > 0) {
          const newAttachments: MediaAttachment[] = successfulResults.map((result, index) => ({
            id: `attachment_${Date.now()}_${index}`,
            uri: result.uri!,
            type,
            name: `Media ${state.attachments.length + index + 1}`,
          }));

          updateState({
            attachments: [...state.attachments, ...newAttachments],
            isUploading: false,
            uploadProgress: 0,
          });
        } else {
          updateState({ isUploading: false, uploadProgress: 0 });
        }
      } catch (error) {
        console.error('Upload error:', error);
        updateState({
          isUploading: false,
          uploadProgress: 0,
          error: 'Upload failed',
        });
      }
    },
    [state.attachments, updateState],
  );

  const removeAttachment = useCallback(
    async (attachment: MediaAttachment, index: number) => {
      Alert.alert('Remove Attachment', 'Are you sure you want to remove this attachment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Remove from Firebase Storage
            await MediaService.deleteMedia(attachment.uri);

            // Remove from local state
            const newAttachments = state.attachments.filter((_, i) => i !== index);
            updateState({ attachments: newAttachments });
          },
        },
      ]);
    },
    [state.attachments, updateState],
  );

  const handleAttachmentPress = useCallback(
    (attachment: MediaAttachment, index: number) => {
      setSelectedAttachment(attachment);
      setSelectedIndex(index);
      setShowMediaViewer(true);
      onViewAttachment?.(attachment, index);
    },
    [onViewAttachment],
  );

  const handleRecordingComplete = useCallback(
    (filePath: string, duration: number) => {
      const attachment: MediaAttachment = {
        id: `voice_${Date.now()}`,
        uri: filePath,
        type: MediaType.AUDIO,
        name: `Voice Recording ${new Date().toLocaleTimeString()}`,
        duration,
      };
      updateState({
        attachments: [...state.attachments, attachment],
      });
      setShowVoiceRecorder(false);
    },
    [state.attachments, updateState],
  );

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.IMAGE:
        return 'image-outline';
      case MediaType.VIDEO:
        return 'videocam-outline';
      case MediaType.AUDIO:
        return 'musical-note-outline';
      default:
        return 'document-outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return '';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Attachment Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          leftIcon={<Ionicons name="image-outline" size={18} color={colors.primary} />}
          onPress={() => handleImagePicker('photo')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Add Images
        </Button>

        <Button
          variant="outline"
          leftIcon={<Ionicons name="videocam-outline" size={18} color={colors.primary} />}
          onPress={() => handleImagePicker('video')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Add Videos
        </Button>

        <Button
          variant="outline"
          leftIcon={<Ionicons name="camera-outline" size={18} color={colors.primary} />}
          onPress={() => handleCamera('photo')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Camera
        </Button>

        <Button
          variant="outline"
          leftIcon={<Ionicons name="mic-outline" size={18} color={colors.primary} />}
          onPress={() => setShowVoiceRecorder(true)}
          style={styles.button}
          disabled={state.isUploading}
        >
          Voice Record
        </Button>
      </View>

      {/* Upload Progress */}
      {state.isUploading && (
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: colors.foregroundMuted }]}>Uploading media...</Text>
          <ProgressBar progress={state.uploadProgress} size="sm" style={styles.progressBar} />
          <Text style={[styles.progressText, { color: colors.foregroundMuted }]}>{Math.round(state.uploadProgress)}%</Text>
        </View>
      )}

      {/* Error Message */}
      {state.error && (
        <Card style={[styles.errorCard, { backgroundColor: colors.destructiveMuted }]} padding="md">
          <Text style={[styles.errorText, { color: colors.destructive }]}>{state.error}</Text>
        </Card>
      )}

      {/* Attachments List */}
      {state.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Attachments ({state.attachments.length})</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.attachmentsList}>
              {state.attachments.map((attachment, index) => (
                <Card key={attachment.id} style={[styles.attachmentCard, { backgroundColor: colors.card }]} padding="none">
                  <TouchableOpacity onPress={() => handleAttachmentPress(attachment, index)}>
                    <Image
                      source={{ uri: attachment.thumbnailUri || attachment.uri }}
                      style={styles.attachmentImage}
                    />
                  </TouchableOpacity>

                  <View style={styles.attachmentContent}>
                    <Text style={[styles.attachmentName, { color: colors.foreground }]} numberOfLines={1}>
                      {attachment.name}
                    </Text>

                    <View style={styles.attachmentMeta}>
                      <Chip
                        size="sm"
                        leftIcon={<Ionicons name={getMediaIcon(attachment.type)} size={12} color={colors.mutedForeground} />}
                      >
                        {attachment.type}
                      </Chip>

                      {attachment.size && <Text style={[styles.metaText, { color: colors.foregroundMuted }]}>{formatFileSize(attachment.size)}</Text>}

                      {attachment.duration && (
                        <Text style={[styles.metaText, { color: colors.foregroundMuted }]}>{formatDuration(attachment.duration)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.attachmentActions}>
                    <IconButton icon="trash-outline" size="sm" variant="ghost" onPress={() => removeAttachment(attachment, index)} />
                  </View>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Media Viewer Modal */}
      <Modal
        visible={showMediaViewer}
        onRequestClose={() => setShowMediaViewer(false)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          {selectedAttachment && (
            <MediaViewer attachment={selectedAttachment} onClose={() => setShowMediaViewer(false)} />
          )}
        </View>
      </Modal>

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        onRequestClose={() => setShowVoiceRecorder(false)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalSurface, { backgroundColor: colors.surface }]}>
            <VoiceRecorder onRecordingComplete={handleRecordingComplete} onCancel={() => setShowVoiceRecorder(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    minWidth: 100,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  errorCard: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  attachmentsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  attachmentsList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  attachmentCard: {
    width: 120,
    marginBottom: 8,
  },
  attachmentImage: {
    height: 80,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  attachmentContent: {
    padding: 8,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  attachmentMeta: {
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },
  attachmentActions: {
    padding: 4,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSurface: {
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: '80%',
  },
});

export default MediaAttachmentManager;
