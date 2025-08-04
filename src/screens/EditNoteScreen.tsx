import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  TextInput,
  Button,
  Appbar,
  Snackbar,
  Portal,
  Modal,
  Dialog,
  ProgressBar,
} from 'react-native-paper';
import { useNotes } from '../store/notesHooks';
import { NoteFormData } from '../types/Note';
import RichTextEditor from '../components/RichTextEditor';
import AttachmentGallery from '../components/AttachmentGallery';
import VoiceRecorder from '../components/VoiceRecorder';
// import DrawingScreen from './DrawingScreen'; // DISABLED: Drawing functionality temporarily removed
import { MediaAttachmentsState, MediaAttachment, MediaType } from '../types/MediaAttachment';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import { Video } from 'react-native-video';
import ViewShot from 'react-native-view-shot';
// import { saveDrawingToGallery } from '../utils/svgToPng'; // DISABLED: Drawing functionality temporarily removed

interface RouteParams {
  noteId?: number;
}

const EditNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { noteId } = (route.params as RouteParams) || {};

  const {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    clearError,
  } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachmentsState>({
    attachments: [],
    isUploading: false,
    uploadProgress: 0,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{ uri: string; type: 'image' | 'video' | 'audio'; name?: string }>>([]);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [playingMedia, setPlayingMedia] = useState<string | null>(null);
  const [mediaRefs, setMediaRefs] = useState<{ [key: string]: any }>({});
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  // const [showDrawingScreen, setShowDrawingScreen] = useState(false); // DISABLED: Drawing functionality temporarily removed
  // const [lastDrawingSvg, setLastDrawingSvg] = useState<string>(''); // DISABLED: Drawing functionality temporarily removed
  // const svgViewRef = useRef<ViewShot>(null); // DISABLED: Drawing functionality temporarily removed

  // Find existing note if editing
  const existingNote = notes.find((note: any) => note.id === noteId);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      
      // Load existing media attachments
      const existingAttachments: MediaAttachment[] = [];
      
      // Process images
      if (existingNote.imageUris) {
        existingNote.imageUris.split(',').filter(Boolean).forEach((uri: string) => {
          existingAttachments.push({
            id: `image_${Date.now()}_${Math.random()}`,
            uri: uri.trim(),
            type: MediaType.IMAGE,
            name: 'Image'
          });
        });
      }
      
      // Process videos
      if (existingNote.videoUris) {
        existingNote.videoUris.split(',').filter(Boolean).forEach((uri: string) => {
          existingAttachments.push({
            id: `video_${Date.now()}_${Math.random()}`,
            uri: uri.trim(),
            type: 'VIDEO' as any,
            name: 'Video'
          });
        });
      }
      
      // Process voice notes
      if (existingNote.voiceNoteUris) {
        existingNote.voiceNoteUris.split(',').filter(Boolean).forEach((uri: string) => {
          existingAttachments.push({
            id: `audio_${Date.now()}_${Math.random()}`,
            uri: uri.trim(),
            type: MediaType.AUDIO,
            name: 'Voice Note'
          });
        });
      }
      
      // DISABLED: Drawing functionality temporarily removed
      /*
      // Process drawings
      if (existingNote.drawingUris) {
        existingNote.drawingUris.split(',').filter(Boolean).forEach(uri => {
          existingAttachments.push({
            id: `drawing_${Date.now()}_${Math.random()}`,
            uri: uri.trim(),
            type: MediaType.DRAWING,
            name: 'Drawing'
          });
        });
      }
      */
      
      setMediaAttachments({
        attachments: existingAttachments,
        isUploading: false,
        uploadProgress: 0,
      });
    }
  }, [existingNote]);

  useEffect(() => {
    // Check if there are changes compared to the existing note
    const hasChanges = title.trim() !== (existingNote?.title || '') ||
                      content.trim() !== (existingNote?.content || '') ||
                      hasAttachmentChanges();
    setHasUnsavedChanges(hasChanges);
  }, [title, content, mediaAttachments.attachments, existingNote]);

  // Cleanup media playback when component unmounts
  useEffect(() => {
    return () => {
      // Stop all playing media
      Object.values(mediaRefs).forEach(ref => {
        if (ref && typeof ref.stop === 'function') {
          ref.stop();
        }
      });
      setPlayingMedia(null);
    };
  }, [mediaRefs]);

  // Helper function to check if attachments have changed
  const hasAttachmentChanges = () => {
    if (!existingNote) {
      // For new notes, any attachments mean there are changes
      return mediaAttachments.attachments.length > 0;
    }

    // For existing notes, compare current attachments with original ones
    const currentImageUris = mediaAttachments.attachments
      .filter(att => att.type === MediaType.IMAGE)
      .map(att => att.uri)
      .join(',');
    
    const currentVideoUris = mediaAttachments.attachments
      .filter(att => att.type === MediaType.VIDEO)
      .map(att => att.uri)
      .join(',');
    
    const currentVoiceUris = mediaAttachments.attachments
      .filter(att => att.type === MediaType.AUDIO)
      .map(att => att.uri)
      .join(',');
    
    // DISABLED: Drawing functionality temporarily removed
    /*
    const currentDrawingUris = mediaAttachments.attachments
      .filter(att => att.type === MediaType.DRAWING)
      .map(att => att.uri)
      .join(',');
    */

    return currentImageUris !== (existingNote.imageUris || '') ||
           currentVideoUris !== (existingNote.videoUris || '') ||
           currentVoiceUris !== (existingNote.voiceNoteUris || '');
           // currentDrawingUris !== (existingNote.drawingUris || ''); // DISABLED: Drawing functionality removed
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      const noteData: NoteFormData = {
        title: title.trim(),
        content: content.trim(),
        imageUris: mediaAttachments.attachments
          .filter(att => att.type === MediaType.IMAGE)
          .map(att => att.uri)
          .join(','),
        videoUris: mediaAttachments.attachments
          .filter(att => att.type === MediaType.VIDEO)
          .map(att => att.uri)
          .join(','),
        voiceNoteUris: mediaAttachments.attachments
          .filter(att => att.type === MediaType.AUDIO)
          .map(att => att.uri)
          .join(','),
        // drawingUris: mediaAttachments.attachments
        //   .filter(att => att.type === MediaType.DRAWING)
        //   .map(att => att.uri)
        //   .join(','), // DISABLED: Drawing functionality temporarily removed
      };

      if (noteId) {
        await updateNote(noteId, noteData);
      } else {
        await addNote(noteData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      setShowSaveDialog(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscardChanges = () => {
    setShowSaveDialog(false);
    navigation.goBack();
  };

  const handleKeepEditing = () => {
    setShowSaveDialog(false);
  };

  const handlePlayMedia = (attachmentId: string, mediaType: string) => {
    if (playingMedia === attachmentId) {
      // Stop current media
      if (mediaRefs[attachmentId]) {
        if (mediaType === 'VIDEO') {
          mediaRefs[attachmentId].seek(0);
        } else if (mediaType === 'AUDIO') {
          mediaRefs[attachmentId].stop();
        }
      }
      setPlayingMedia(null);
    } else {
      // Stop any currently playing media
      if (playingMedia && mediaRefs[playingMedia]) {
        const currentType = mediaAttachments.attachments.find(att => att.id === playingMedia)?.type;
        if (currentType === MediaType.VIDEO) {
          mediaRefs[playingMedia].seek(0);
        } else if (currentType === MediaType.AUDIO) {
          mediaRefs[playingMedia].stop();
        }
      }
      
      // Start new media
      if (mediaType === 'AUDIO') {
        const attachment = mediaAttachments.attachments.find(att => att.id === attachmentId);
        if (attachment) {
          // Check if this is a simulated recording (doesn't start with file:// or http://)
          if (!attachment.uri.startsWith('file://') && !attachment.uri.startsWith('http://')) {
            // Simulated audio - just show playing state without actual playback
            setPlayingMedia(attachmentId);
            // Use the attachment duration or default to 5 seconds
            const audioDuration = attachment.duration || 5000;
            setTimeout(() => {
              setPlayingMedia(null);
            }, audioDuration);
            return;
          }
          
          const sound = new Sound(attachment.uri, undefined, (error) => {
            if (error) {
              console.error('Error loading audio:', error);
              Alert.alert('Error', 'Failed to load audio file');
              return;
            }
            
            sound.play((success) => {
              if (success) {
                console.log('Audio played successfully');
              } else {
                console.log('Audio playback failed');
              }
              setPlayingMedia(null);
            });
          });
          
          setMediaRefs(prev => ({
            ...prev,
            [attachmentId]: sound
          }));
          setPlayingMedia(attachmentId);
        }
      } else {
        setPlayingMedia(attachmentId);
      }
    }
  };

  const handleMediaRef = (attachmentId: string, ref: any) => {
    setMediaRefs(prev => ({
      ...prev,
      [attachmentId]: ref
    }));
  };

  const handleVideoEnd = () => {
    setPlayingMedia(null);
  };

  const handleAudioEnd = () => {
    setPlayingMedia(null);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos and videos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record videos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  const handleAddImage = async () => {
    Alert.alert(
      'Add Image',
      'Choose image source',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: async () => {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
              Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
              return;
            }
            
            launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
              saveToPhotos: true,
            }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                Alert.alert('Error', `Camera error: ${response.errorMessage}`);
              } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                  const newAttachment: MediaAttachment = {
                    id: `image_${Date.now()}_${Math.random()}`,
                    uri: asset.uri,
                    type: MediaType.IMAGE,
                    name: asset.fileName || 'Image',
                    size: asset.fileSize,
                  };
                  setMediaAttachments(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, newAttachment]
                  }));
                }
              }
            });
          }
        },
        { 
          text: 'Gallery', 
          onPress: () => launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            includeBase64: false,
            selectionLimit: 10,
          }, (response) => {
            if (response.assets) {
              const newAttachments: MediaAttachment[] = response.assets.map(asset => ({
                id: `image_${Date.now()}_${Math.random()}`,
                uri: asset.uri!,
                type: MediaType.IMAGE,
                name: asset.fileName || 'Image',
                size: asset.fileSize,
              }));
              setMediaAttachments(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newAttachments]
              }));
            }
          })
        },
      ]
    );
  };

  const handleAddVideo = async () => {
    Alert.alert(
      'Add Video',
      'Choose video source',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: async () => {
            const hasCameraPermission = await requestCameraPermission();
            const hasAudioPermission = await requestAudioPermission();
            
            if (!hasCameraPermission) {
              Alert.alert('Permission Denied', 'Camera permission is required to record videos.');
              return;
            }
            
            if (!hasAudioPermission) {
              Alert.alert('Permission Denied', 'Microphone permission is required to record videos with audio.');
              return;
            }
            
            launchCamera({
              mediaType: 'video',
              quality: 0.8,
              includeBase64: false,
              videoQuality: 'medium',
              saveToPhotos: true,
            }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                Alert.alert('Error', `Camera error: ${response.errorMessage}`);
              } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                  const newAttachment: MediaAttachment = {
                    id: `video_${Date.now()}_${Math.random()}`,
                    uri: asset.uri,
                    type: MediaType.VIDEO,
                    name: asset.fileName || 'Video',
                    size: asset.fileSize,
                    duration: asset.duration,
                  };
                  setMediaAttachments(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, newAttachment]
                  }));
                }
              }
            });
          }
        },
        { 
          text: 'Gallery', 
          onPress: () => launchImageLibrary({
            mediaType: 'video',
            quality: 0.8,
            includeBase64: false,
            selectionLimit: 5,
          }, (response) => {
            if (response.assets) {
              const newAttachments: MediaAttachment[] = response.assets.map(asset => ({
                id: `video_${Date.now()}_${Math.random()}`,
                uri: asset.uri!,
                type: MediaType.VIDEO,
                name: asset.fileName || 'Video',
                size: asset.fileSize,
                duration: asset.duration,
              }));
              setMediaAttachments(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newAttachments]
              }));
            }
          })
        },
      ]
    );
  };

  const handleAddAudio = () => {
    setShowVoiceRecorder(true);
  };

  const handleVoiceRecordingComplete = (filePath: string, duration: number) => {
    const newAttachment: MediaAttachment = {
      id: `audio_${Date.now()}_${Math.random()}`,
      uri: filePath,
      type: MediaType.AUDIO,
      name: 'Voice Recording',
      duration: duration,
    };
    
    setMediaAttachments(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment]
    }));
    
    setShowVoiceRecorder(false);
  };

  const handleVoiceRecordingCancel = () => {
    setShowVoiceRecorder(false);
  };

  // DISABLED: Drawing functionality temporarily removed
  /*
  const handleAddDrawing = () => {
    setShowDrawingScreen(true);
  };

  const handleDrawingSave = async (svgContent: string, saveToGallery: boolean) => {
    // Drawing functionality removed
  };

  const handleDrawingCancel = () => {
    setShowDrawingScreen(false);
  };
  */

  if (loading && noteId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading note...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackPress} disabled={saving} />
        <Appbar.Content title={noteId ? 'Edit Note' : 'New Note'} />
        <Appbar.Action
          icon={saving ? "loading" : "content-save"}
          onPress={handleSave}
          disabled={!hasUnsavedChanges || saving}
        />
      </Appbar.Header>
      
              {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.uploadProgressContainer}>
            <Text style={styles.uploadProgressText}>
              Uploading attachments... {Math.round(uploadProgress)}%
            </Text>
            <ProgressBar
              progress={uploadProgress / 100}
              color="#007AFF"
              style={styles.uploadProgressBar}
            />
          </View>
        )}

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
          mode="outlined"
          placeholder="Enter note title..."
        />

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing your note..."
          style={styles.richTextEditor}
        />

        {/* Attachment Previews */}
        <View style={styles.attachmentPreviewsSection}>
          <Text style={styles.attachmentPreviewsTitle}>Attachments</Text>
          
          {/* Attachment Buttons */}
          <View style={styles.attachmentButtons}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAddImage}
            >
              <Icon name="photo" size={20} color="#8B5CF6" />
              <Text style={styles.attachmentButtonText}>Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAddVideo}
            >
              <Icon name="videocam" size={20} color="#8B5CF6" />
              <Text style={styles.attachmentButtonText}>Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAddAudio}
            >
              <Icon name="mic" size={20} color="#8B5CF6" />
              <Text style={styles.attachmentButtonText}>Voice</Text>
            </TouchableOpacity>
            
            {/* DISABLED: Drawing functionality temporarily removed
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAddDrawing}
            >
              <Icon name="brush" size={20} color="#8B5CF6" />
              <Text style={styles.attachmentButtonText}>Drawing</Text>
            </TouchableOpacity>
            */}
          </View>
          
          {/* Attachment Previews */}
          {mediaAttachments.attachments.length > 0 && (
            <View style={styles.attachmentPreviews}>
              {mediaAttachments.attachments.map((attachment, index) => {
                const handleAttachmentPress = () => {
                  const attachments = mediaAttachments.attachments.map(att => ({
                    uri: att.uri,
                    type: (att.type === 'IMAGE' ? 'image' : att.type === 'VIDEO' ? 'video' : 'audio') as 'image' | 'video' | 'audio',
                    name: `${att.type.toLowerCase()} attachment`
                  }));
                  
                  setSelectedAttachments(attachments);
                  setSelectedAttachmentIndex(index);
                  setShowAttachmentGallery(true);
                };

                const handleRemoveAttachment = () => {
                  const newAttachments = mediaAttachments.attachments.filter((_, i) => i !== index);
                  setMediaAttachments({
                    ...mediaAttachments,
                    attachments: newAttachments
                  });
                };

                return (
                  <View key={index} style={styles.attachmentPreviewContainer}>
                    <TouchableOpacity
                      style={styles.attachmentPreview}
                      onPress={handleAttachmentPress}
                    >
                      {attachment.type === MediaType.IMAGE ? (
                        <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
                      ) : attachment.type === MediaType.VIDEO ? (
                        <View style={styles.previewVideo}>
                          <Video
                            source={{ uri: attachment.uri }}
                            style={styles.previewVideoThumbnail}
                            resizeMode="cover"
                            paused={true}
                            muted={true}
                          />
                          <View style={styles.playOverlay}>
                            <Icon name="play-arrow" size={20} color="white" />
                          </View>
                        </View>
                      ) : /* attachment.type === MediaType.DRAWING ? (
                        <View style={styles.previewDrawing}>
                          <Icon name="brush" size={40} color="#8B5CF6" />
                          <Text style={styles.drawingLabel}>Drawing</Text>
                        </View>
                      ) : */ (
                        <View style={styles.previewAudio}>
                          {playingMedia === attachment.id ? (
                            <View style={styles.audioPlaying}>
                              <Icon name="music-note" size={20} color="#007AFF" />
                              <TouchableOpacity
                                style={styles.stopButton}
                                onPress={() => handlePlayMedia(attachment.id, 'AUDIO')}
                              >
                                <Icon name="stop" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <>
                              <Icon name="music-note" size={20} color="#666" />
                              <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => handlePlayMedia(attachment.id, 'AUDIO')}
                              >
                                <Icon name="play-arrow" size={16} color="white" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeAttachmentButton}
                      onPress={handleRemoveAttachment}
                    >
                      <Icon name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>


      </ScrollView>

      {/* Unsaved Changes Dialog */}
      <Portal>
        <Dialog visible={showSaveDialog} onDismiss={handleKeepEditing}>
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Text>You have unsaved changes. Do you want to save them?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDiscardChanges}>Discard</Button>
            <Button onPress={handleKeepEditing}>Keep Editing</Button>
            <Button onPress={handleSave} mode="contained">
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Attachment Gallery */}
      {showAttachmentGallery && (
        <AttachmentGallery
          attachments={selectedAttachments}
          initialIndex={selectedAttachmentIndex}
          onClose={() => setShowAttachmentGallery(false)}
        />
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <Portal>
          <Modal
            visible={showVoiceRecorder}
            onDismiss={handleVoiceRecordingCancel}
            contentContainerStyle={styles.voiceRecorderModal}
          >
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={handleVoiceRecordingCancel}
            />
          </Modal>
        </Portal>
      )}

      {/* DISABLED: Drawing functionality temporarily removed
      <DrawingScreen
        visible={showDrawingScreen}
        onClose={handleDrawingCancel}
        onSave={handleDrawingSave}
      />
      */}

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        action={{
          label: 'Dismiss',
          onPress: clearError,
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  titleInput: {
    marginBottom: 16,
  },
  richTextEditor: {
    marginBottom: 24,
  },
  attachmentPreviewsSection: {
    marginBottom: 24,
  },
  attachmentPreviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  attachmentButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  attachmentPreviews: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentPreviewContainer: {
    position: 'relative',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  previewAudio: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
  },
  previewDrawing: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  drawingLabel: {
    fontSize: 10,
    color: '#8B5CF6',
    marginTop: 4,
    fontWeight: '500',
  },
  previewVideoPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  previewVideoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaying: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  uploadProgressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  uploadProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  uploadProgressBar: {
    height: 4,
    borderRadius: 2,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  voiceRecorderModal: {
    backgroundColor: 'white',
    margin: 0,
    padding: 0,
  },
});

export default EditNoteScreen; 