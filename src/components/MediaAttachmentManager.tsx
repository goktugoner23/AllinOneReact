import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  IconButton,
  Text,
  Button,
  ProgressBar,
  Chip,
  Portal,
  Modal,
  Surface,
} from 'react-native-paper';
import { launchImageLibrary, launchCamera, MediaType as ImagePickerMediaType } from 'react-native-image-picker';
import { MediaAttachment, MediaType, MediaAttachmentsState } from '../types/MediaAttachment';
import { MediaService } from '../services/MediaService';
import MediaViewer from './MediaViewer';
import VoiceRecorder from './VoiceRecorder';

const { width: screenWidth } = Dimensions.get('window');

interface MediaAttachmentManagerProps {
  state: MediaAttachmentsState;
  onStateChange: (state: MediaAttachmentsState) => void;
  onViewAttachment?: (attachment: MediaAttachment, index: number) => void;
}

const MediaAttachmentManager: React.FC<MediaAttachmentManagerProps> = ({
  state,
  onStateChange,
  onViewAttachment,
}) => {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MediaAttachment | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const updateState = useCallback((updates: Partial<MediaAttachmentsState>) => {
    onStateChange({ ...state, ...updates });
  }, [state, onStateChange]);

  const handleImagePicker = useCallback(async (mediaType: ImagePickerMediaType) => {
    try {
      const result = await launchImageLibrary({
        mediaType,
        selectionLimit: 10,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri!).filter(Boolean);
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

  const uploadMedia = useCallback(async (uris: string[], type: MediaType) => {
    updateState({ isUploading: true, uploadProgress: 0, error: undefined });

    try {
      const results = await MediaService.uploadMultipleMedia(uris, type, (progress) => {
        updateState({ uploadProgress: progress });
      });

      const successfulResults = results.filter(result => result.success);
      const failedResults = results.filter(result => !result.success);

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
  }, [state.attachments, updateState]);

  const removeAttachment = useCallback(async (attachment: MediaAttachment, index: number) => {
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
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
      ]
    );
  }, [state.attachments, updateState]);

  const handleAttachmentPress = useCallback((attachment: MediaAttachment, index: number) => {
    setSelectedAttachment(attachment);
    setSelectedIndex(index);
    setShowMediaViewer(true);
    onViewAttachment?.(attachment, index);
  }, [onViewAttachment]);

  const handleRecordingComplete = useCallback((attachment: MediaAttachment) => {
    updateState({
      attachments: [...state.attachments, attachment],
    });
    setShowVoiceRecorder(false);
  }, [state.attachments, updateState]);

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.IMAGE:
        return 'image';
      case MediaType.VIDEO:
        return 'video';
      case MediaType.AUDIO:
        return 'music-note';
      case MediaType.DRAWING:
        return 'brush';
      default:
        return 'file';
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
          mode="outlined"
          icon="image"
          onPress={() => handleImagePicker('photo')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Add Images
        </Button>
        
        <Button
          mode="outlined"
          icon="video"
          onPress={() => handleImagePicker('video')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Add Videos
        </Button>
        
        <Button
          mode="outlined"
          icon="camera"
          onPress={() => handleCamera('photo')}
          style={styles.button}
          disabled={state.isUploading}
        >
          Camera
        </Button>
        
        <Button
          mode="outlined"
          icon="microphone"
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
          <Text style={styles.progressText}>Uploading media...</Text>
          <ProgressBar progress={state.uploadProgress / 100} style={styles.progressBar} />
          <Text style={styles.progressText}>{Math.round(state.uploadProgress)}%</Text>
        </View>
      )}

      {/* Error Message */}
      {state.error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{state.error}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Attachments List */}
      {state.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <Text style={styles.sectionTitle}>
            Attachments ({state.attachments.length})
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.attachmentsList}>
              {state.attachments.map((attachment, index) => (
                <Card key={attachment.id} style={styles.attachmentCard}>
                  <Card.Cover
                    source={{ uri: attachment.thumbnailUri || attachment.uri }}
                    style={styles.attachmentImage}
                    onPress={() => handleAttachmentPress(attachment, index)}
                  />
                  
                  <Card.Content style={styles.attachmentContent}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    
                    <View style={styles.attachmentMeta}>
                      <Chip icon={getMediaIcon(attachment.type)} compact>
                        {attachment.type}
                      </Chip>
                      
                      {attachment.size && (
                        <Text style={styles.metaText}>
                          {formatFileSize(attachment.size)}
                        </Text>
                      )}
                      
                      {attachment.duration && (
                        <Text style={styles.metaText}>
                          {formatDuration(attachment.duration)}
                        </Text>
                      )}
                    </View>
                  </Card.Content>
                  
                  <Card.Actions style={styles.attachmentActions}>
                    <IconButton
                      icon="delete"
                      size={16}
                      onPress={() => removeAttachment(attachment, index)}
                    />
                  </Card.Actions>
                </Card>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Media Viewer Modal */}
      <Portal>
        <Modal
          visible={showMediaViewer}
          onDismiss={() => setShowMediaViewer(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedAttachment && (
            <MediaViewer
              attachment={selectedAttachment}
              onClose={() => setShowMediaViewer(false)}
            />
          )}
        </Modal>
      </Portal>

      {/* Voice Recorder Modal */}
      <Portal>
        <Modal
          visible={showVoiceRecorder}
          onDismiss={() => setShowVoiceRecorder(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
            />
          </Surface>
        </Modal>
      </Portal>
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
    color: '#666',
    textAlign: 'center',
    marginVertical: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  attachmentsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
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
    color: '#666',
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
    backgroundColor: 'white',
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: '80%',
    elevation: 5,
  },
});

export default MediaAttachmentManager; 