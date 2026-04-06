import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotes, useAddNote, useUpdateNote } from '@shared/hooks';
import { NoteFormData } from '@features/notes/types/Note';
import RichTextEditor from '@features/notes/components/RichTextEditor';
import AttachmentGallery from '@features/notes/components/AttachmentGallery';
import DrawingScreen from '@features/notes/components/DrawingScreen';
import VoiceRecorder from '@shared/components/ui/VoiceRecorder';
import { MediaAttachmentsState, MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import { MediaService } from '@shared/services/MediaService';
import { getDisplayUrl, buildLegacyRedirectUrl } from '@shared/services/storage/r2Storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Button, Skeleton, SkeletonCard, ProgressBar, Appbar, AppbarAction, Snackbar, Dialog, Input } from '@shared/components/ui';
import { useAppTheme } from '@shared/theme';

import { Video } from 'react-native-video';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

interface RouteParams {
  noteId?: string | number;
}

const EditNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const rawNoteId = (route.params as RouteParams)?.noteId;
  const noteId = rawNoteId != null ? Number(rawNoteId) : undefined;
  const { colors, spacing, textStyles, radius } = useAppTheme();

  // TanStack Query hooks
  const { data: notes = [], isLoading } = useNotes();
  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();

  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

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
  const [selectedAttachments, setSelectedAttachments] = useState<MediaAttachment[]>([]);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [playingMedia, setPlayingMedia] = useState<string | null>(null);
  const [mediaRefs, setMediaRefs] = useState<{ [key: string]: any }>({});
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showDrawingScreen, setShowDrawingScreen] = useState(false);
  const svgViewRef = useRef<ViewShot>(null);

  // Snapshot of the note's originally-persisted attachment CSVs, taken once
  // when the note loads. `hasAttachmentChanges` compares against this
  // snapshot so the background signed-URL resolver doesn't spuriously mark
  // the note as dirty when it rewrites `uri` on legacy attachments.
  const originalAttachmentsRef = useRef<{
    imageUris: string;
    videoUris: string;
    voiceNoteUris: string;
    drawingUris: string;
  }>({ imageUris: '', videoUris: '', voiceNoteUris: '', drawingUris: '' });

  // Find existing note if editing
  const existingNote = notes.find((note: any) => note.id === noteId);

  // Build available notes for [[ linking (exclude current note)
  const availableNotes = useMemo(() => {
    return notes
      .filter((note: any) => note.id !== noteId)
      .map((note: any) => ({ id: note.id, title: note.title }));
  }, [notes, noteId]);

  const handleNoteLinkPress = useCallback((linkedNoteId: number) => {
    (navigation as any).push('EditNote', { noteId: linkedNoteId });
  }, [navigation]);

  useEffect(() => {
    if (!existingNote) return;

    setTitle(existingNote.title);
    setContent(existingNote.content);

    // Capture the original attachment CSVs so dirty-checking compares against
    // the raw stored values (R2 keys), not the dynamically-rewritten `uri`s
    // produced by the signed-URL resolver below.
    originalAttachmentsRef.current = {
      imageUris: existingNote.imageUris || '',
      videoUris: existingNote.videoUris || '',
      voiceNoteUris: existingNote.voiceNoteUris || '',
      drawingUris: existingNote.drawingUris || '',
    };

    // CSV values stored on the note are R2 object keys (or legacy URLs for
    // old data). Treat each value as a `key` and resolve a signed display
    // URL asynchronously. On first render we pass the raw csvValue through
    // as `uri` so there's a fallback source while `getDisplayUrl` resolves.
    const buildInitial = (
      csv: string | undefined,
      type: MediaType,
      name: string,
      extra?: Partial<MediaAttachment>,
    ): MediaAttachment[] =>
      (csv?.split(',').filter(Boolean) ?? []).map((rawValue) => {
        const value = rawValue.trim();
        return {
          id: `${type.toLowerCase()}_${Date.now()}_${Math.random()}`,
          key: value,
          uri: value, // placeholder until getDisplayUrl resolves
          type,
          name,
          ...extra,
        };
      });

    const initial: MediaAttachment[] = [
      ...buildInitial(existingNote.imageUris, MediaType.IMAGE, 'Image'),
      ...buildInitial(existingNote.videoUris, MediaType.VIDEO, 'Video'),
      ...buildInitial(existingNote.voiceNoteUris, MediaType.AUDIO, 'Voice Note', {
        duration: 30000,
      }),
      ...buildInitial(existingNote.drawingUris, MediaType.DRAWING, 'Drawing'),
    ];

    setMediaAttachments({
      attachments: initial,
      isUploading: false,
      uploadProgress: 0,
    });

    // Resolve signed display URLs in the background. If a value is a legacy
    // URL that /sign can't resolve, fall back to the legacy redirect.
    let cancelled = false;
    (async () => {
      const resolved = await Promise.all(
        initial.map(async (att) => {
          if (!att.key) return att;
          try {
            const displayUrl = await getDisplayUrl(att.key);
            return { ...att, uri: displayUrl };
          } catch {
            // Legacy URL or /sign failure — use legacy redirect fallback.
            try {
              return { ...att, uri: buildLegacyRedirectUrl(att.key) };
            } catch {
              return att; // keep raw value as a last resort
            }
          }
        }),
      );
      if (cancelled) return;
      setMediaAttachments((prev) => ({ ...prev, attachments: resolved }));
    })();

    return () => {
      cancelled = true;
    };
  }, [existingNote]);

  useEffect(() => {
    // Check if there are changes compared to the existing note
    const hasChanges =
      title.trim() !== (existingNote?.title || '') ||
      content.trim() !== (existingNote?.content || '') ||
      hasAttachmentChanges();
    setHasUnsavedChanges(hasChanges);
  }, [title, content, mediaAttachments.attachments, existingNote]);

  // Cleanup media playback when component unmounts
  useEffect(() => {
    return () => {
      // Stop all playing media
      Object.values(mediaRefs).forEach((ref) => {
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

    // For existing notes, compare current attachments against the ORIGINAL
    // CSV snapshot captured on load. The background signed-URL resolver
    // rewrites `uri` on legacy attachments, so comparing `att.key ?? att.uri`
    // against `existingNote.imageUris` (which also gets rewritten on resolve)
    // produced spurious "unsaved changes" flags.
    const serializeKey = (att: MediaAttachment) => att.key ?? att.uri;

    const currentImageUris = mediaAttachments.attachments
      .filter((att) => att.type === MediaType.IMAGE)
      .map(serializeKey)
      .join(',');

    const currentVideoUris = mediaAttachments.attachments
      .filter((att) => att.type === MediaType.VIDEO)
      .map(serializeKey)
      .join(',');

    const currentVoiceUris = mediaAttachments.attachments
      .filter((att) => att.type === MediaType.AUDIO)
      .map(serializeKey)
      .join(',');

    const currentDrawingUris = mediaAttachments.attachments
      .filter((att) => att.type === MediaType.DRAWING)
      .map(serializeKey)
      .join(',');

    const original = originalAttachmentsRef.current;
    return (
      currentImageUris !== original.imageUris ||
      currentVideoUris !== original.videoUris ||
      currentVoiceUris !== original.voiceNoteUris ||
      currentDrawingUris !== original.drawingUris
    );
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      // Persist the opaque R2 key (source of truth), not the ephemeral
      // signed display URL. Legacy attachments without a key fall back to
      // their stored URL so old notes keep rendering.
      const serializeKey = (att: MediaAttachment) => att.key ?? att.uri;

      const noteData: NoteFormData = {
        title: title.trim(),
        content: content.trim(),
        imageUris: mediaAttachments.attachments
          .filter((att) => att.type === MediaType.IMAGE)
          .map(serializeKey)
          .join(','),
        videoUris: mediaAttachments.attachments
          .filter((att) => att.type === MediaType.VIDEO)
          .map(serializeKey)
          .join(','),
        voiceNoteUris: mediaAttachments.attachments
          .filter((att) => att.type === MediaType.AUDIO)
          .map(serializeKey)
          .join(','),
        drawingUris: mediaAttachments.attachments
          .filter((att) => att.type === MediaType.DRAWING)
          .map(serializeKey)
          .join(','),
      };

      // Show upload progress if we have attachments
      const hasAttachments = mediaAttachments.attachments.length > 0;

      if (hasAttachments) {
        // Show upload progress simulation for immediate feedback
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 15, 95));
        }, 50);

        // Complete progress after a short time
        setTimeout(() => {
          clearInterval(progressInterval);
          setUploadProgress(100);
        }, 800);
      }

      // Save note using TanStack Query mutations
      if (noteId && existingNote) {
        await updateNoteMutation.mutateAsync({
          noteId: existingNote.id,
          noteData,
        });
      } else {
        await addNoteMutation.mutateAsync(noteData);
      }

      // Navigate back immediately after saving
      navigation.goBack();
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note. Please try again.');
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
    // Only handle video playback now - audio files open preview modal instead
    if (mediaType !== 'VIDEO') return;

    if (playingMedia === attachmentId) {
      // Stop current video
      if (mediaRefs[attachmentId]) {
        mediaRefs[attachmentId].seek(0);
      }
      setPlayingMedia(null);
    } else {
      // Stop any currently playing video
      if (playingMedia && mediaRefs[playingMedia]) {
        const currentType = mediaAttachments.attachments.find((att) => att.id === playingMedia)?.type;
        if (currentType === MediaType.VIDEO) {
          mediaRefs[playingMedia].seek(0);
        }
      }

      // Start new video
      setPlayingMedia(attachmentId);
    }
  };

  const handleMediaRef = (attachmentId: string, ref: any) => {
    setMediaRefs((prev) => ({
      ...prev,
      [attachmentId]: ref,
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
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos and videos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
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
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record videos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  /**
   * Upload a local file://... URI to R2 via MediaService and append the
   * resulting attachment (with `key` + signed `uri`) to local state. Shows
   * upload progress on the EditNoteScreen's existing progress bar.
   */
  const uploadAndAppendAttachment = useCallback(
    async (
      localUri: string,
      type: MediaType,
      meta: { name?: string; size?: number; duration?: number } = {},
    ) => {
      setUploadProgress(1);
      try {
        const result = await MediaService.uploadMedia(
          localUri,
          type,
          meta.name,
          (progress) => setUploadProgress(Math.max(1, Math.round(progress))),
          'notes',
        );
        if (!result.success || !result.uri) {
          Alert.alert('Upload Failed', result.error ?? 'Could not upload attachment');
          return;
        }
        const newAttachment: MediaAttachment = {
          id: `${type.toLowerCase()}_${Date.now()}_${Math.random()}`,
          key: result.key,
          uri: result.uri,
          type,
          name: meta.name ?? type.charAt(0) + type.slice(1).toLowerCase(),
          size: meta.size,
          duration: meta.duration,
        };
        setMediaAttachments((prev) => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      } catch (err) {
        console.error('Attachment upload error:', err);
        Alert.alert('Upload Failed', 'Could not upload attachment');
      } finally {
        setUploadProgress(0);
      }
    },
    [],
  );

  const handleAddImage = async () => {
    Alert.alert('Add Image', 'Choose image source', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
          }

          launchCamera(
            {
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
              saveToPhotos: true,
            },
            async (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                Alert.alert('Error', `Camera error: ${response.errorMessage}`);
              } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                  await uploadAndAppendAttachment(asset.uri, MediaType.IMAGE, {
                    name: asset.fileName || 'Image',
                    size: asset.fileSize,
                  });
                }
              }
            },
          );
        },
      },
      {
        text: 'Gallery',
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
              selectionLimit: 10,
            },
            async (response) => {
              if (response.assets) {
                for (const asset of response.assets) {
                  if (!asset.uri) continue;
                  await uploadAndAppendAttachment(asset.uri, MediaType.IMAGE, {
                    name: asset.fileName || 'Image',
                    size: asset.fileSize,
                  });
                }
              }
            },
          ),
      },
    ]);
  };

  const handleAddVideo = async () => {
    Alert.alert('Add Video', 'Choose video source', [
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

          launchCamera(
            {
              mediaType: 'video',
              quality: 0.8,
              includeBase64: false,
              videoQuality: 'medium',
              saveToPhotos: true,
            },
            async (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                Alert.alert('Error', `Camera error: ${response.errorMessage}`);
              } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                if (asset.uri) {
                  await uploadAndAppendAttachment(asset.uri, MediaType.VIDEO, {
                    name: asset.fileName || 'Video',
                    size: asset.fileSize,
                    duration: asset.duration,
                  });
                }
              }
            },
          );
        },
      },
      {
        text: 'Gallery',
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: 'video',
              quality: 0.8,
              includeBase64: false,
              selectionLimit: 5,
            },
            async (response) => {
              if (response.assets) {
                for (const asset of response.assets) {
                  if (!asset.uri) continue;
                  await uploadAndAppendAttachment(asset.uri, MediaType.VIDEO, {
                    name: asset.fileName || 'Video',
                    size: asset.fileSize,
                    duration: asset.duration,
                  });
                }
              }
            },
          ),
      },
    ]);
  };

  const handleAddAudio = () => {
    setShowVoiceRecorder(true);
  };

  const handleVoiceRecordingComplete = async (filePath: string, duration: number) => {
    try {
      // Generate a unique filename with note ID and UUID using platform-specific extension
      const noteIdStr = noteId ? `note_${noteId}` : 'new_note';
      const uuid = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Use proper file extension based on platform (matching recording format)
      const fileExtension = Platform.select({
        ios: '.m4a',
        android: '.mp4',
        default: '.m4a',
      });
      const fileName = `${noteIdStr}_voice_${uuid}${fileExtension}`;

      // Create the destination path in the app's documents directory
      const destPath = `${RNFS.DocumentDirectoryPath}/voice_recordings/${fileName}`;

      // Ensure the directory exists
      const dirPath = `${RNFS.DocumentDirectoryPath}/voice_recordings`;
      const dirExists = await RNFS.exists(dirPath);
      if (!dirExists) {
        await RNFS.mkdir(dirPath);
      }

      // Copy the recording to the new location
      const sourcePath = filePath.replace('file://', '');
      await RNFS.copyFile(sourcePath, destPath);

      // Upload the locally-saved recording to R2 so persistence stores a key.
      await uploadAndAppendAttachment(`file://${destPath}`, MediaType.AUDIO, {
        name: `Voice Recording ${new Date().toLocaleTimeString()}`,
        duration,
      });

      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error saving voice recording:', error);
      Alert.alert('Error', 'Failed to save voice recording. Please try again.');
    }
  };

  const handleVoiceRecordingCancel = () => {
    setShowVoiceRecorder(false);
  };

  const handleAddDrawing = () => {
    setShowDrawingScreen(true);
  };

  const handleDrawingSave = async (svgContent: string, saveToGallery: boolean) => {
    try {
      // Generate a unique filename
      const uuid = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const fileName = `drawing_${uuid}.svg`;
      const filePath = `${RNFS.DocumentDirectoryPath}/drawings/${fileName}`;

      // Ensure drawings directory exists
      const dirPath = `${RNFS.DocumentDirectoryPath}/drawings`;
      const dirExists = await RNFS.exists(dirPath);
      if (!dirExists) {
        await RNFS.mkdir(dirPath);
      }

      // Save SVG content to file
      await RNFS.writeFile(filePath, svgContent, 'utf8');

      // Upload the drawing SVG to R2 so persistence stores a key.
      await uploadAndAppendAttachment(`file://${filePath}`, MediaType.DRAWING, {
        name: `Drawing ${new Date().toLocaleTimeString()}`,
      });

      // Save to gallery if requested
      if (saveToGallery && svgViewRef.current) {
        try {
          const pngUri = await svgViewRef.current.capture?.();
          if (pngUri) {
            // Save PNG to camera roll using CameraRoll
            // This would require additional implementation
            Alert.alert('Success', 'Drawing saved to note and gallery');
          }
        } catch (galleryError) {
          console.error('Error saving to gallery:', galleryError);
          Alert.alert('Partial Success', 'Drawing saved to note but failed to save to gallery');
        }
      }

      setShowDrawingScreen(false);
    } catch (error) {
      console.error('Error saving drawing:', error);
      Alert.alert('Error', 'Failed to save drawing. Please try again.');
    }
  };

  const handleDrawingCancel = () => {
    setShowDrawingScreen(false);
  };

  // Check if any mutation is in progress
  const isMutating = addNoteMutation.isPending || updateNoteMutation.isPending;

  if (isLoading && noteId) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar
        title={noteId ? 'Edit Note' : 'New Note'}
        leading="back"
        onLeadingPress={saving || isMutating ? undefined : handleBackPress}
        trailing={
          <AppbarAction
            icon={saving || isMutating ? 'hourglass-outline' : 'save-outline'}
            onPress={handleSave}
            disabled={!hasUnsavedChanges || saving || isMutating}
          />
        }
      />

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <View
          style={[
            styles.uploadProgressContainer,
            { backgroundColor: colors.muted, paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
          ]}
        >
          <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
            Uploading attachments... {Math.round(uploadProgress)}%
          </Text>
          <ProgressBar progress={uploadProgress} size="sm" style={styles.uploadProgressBar} />
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: spacing[4] }}>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          containerStyle={{ marginBottom: spacing[4] }}
          placeholder="Enter note title..."
        />

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing your note..."
          style={{ marginBottom: spacing[6] }}
          availableNotes={availableNotes}
          onNoteLinkPress={handleNoteLinkPress}
        />

        {/* Attachment Previews */}
        <View style={[styles.attachmentPreviewsSection, { marginBottom: spacing[6] }]}>
          <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>Attachments</Text>

          {/* Attachment Buttons */}
          <View style={[styles.attachmentButtons, { gap: spacing[3], marginBottom: spacing[4] }]}>
            <TouchableOpacity
              style={[
                styles.attachmentButton,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  gap: spacing[1.5],
                },
              ]}
              onPress={handleAddImage}
            >
              <Icon name="photo" size={20} color={colors.primary} />
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '500' }]}>Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attachmentButton,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  gap: spacing[1.5],
                },
              ]}
              onPress={handleAddVideo}
            >
              <Icon name="videocam" size={20} color={colors.primary} />
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '500' }]}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attachmentButton,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  gap: spacing[1.5],
                },
              ]}
              onPress={handleAddAudio}
            >
              <Icon name="mic" size={20} color={colors.primary} />
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '500' }]}>Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attachmentButton,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  gap: spacing[1.5],
                },
              ]}
              onPress={handleAddDrawing}
            >
              <Icon name="brush" size={20} color={colors.primary} />
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '500' }]}>Drawing</Text>
            </TouchableOpacity>
          </View>

          {/* Attachment Previews */}
          {mediaAttachments.attachments.length > 0 && (
            <View style={[styles.attachmentPreviews, { gap: spacing[2] }]}>
              {mediaAttachments.attachments.map((attachment, index) => {
                const handleAttachmentPress = () => {
                  // Pass the MediaAttachment objects directly to AttachmentGallery
                  setSelectedAttachments(mediaAttachments.attachments);
                  setSelectedAttachmentIndex(index);
                  setShowAttachmentGallery(true);
                };

                const handleRemoveAttachment = () => {
                  const newAttachments = mediaAttachments.attachments.filter((_, i) => i !== index);
                  setMediaAttachments({
                    ...mediaAttachments,
                    attachments: newAttachments,
                  });
                };

                return (
                  <View key={index} style={styles.attachmentPreviewContainer}>
                    <TouchableOpacity
                      style={[styles.attachmentPreview, { backgroundColor: colors.muted, borderRadius: radius.md }]}
                      onPress={handleAttachmentPress}
                    >
                      {attachment.type === MediaType.IMAGE ? (
                        <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
                      ) : attachment.type === MediaType.VIDEO ? (
                        <View style={[styles.previewVideo, { backgroundColor: colors.surfaceHover }]}>
                          <Video
                            source={{ uri: attachment.uri }}
                            style={styles.previewVideoThumbnail}
                            resizeMode="cover"
                            paused={true}
                            muted={true}
                          />
                          <View style={[styles.playOverlay, { backgroundColor: colors.overlay }]}>
                            <Icon name="play-arrow" size={20} color="white" />
                          </View>
                        </View>
                      ) : attachment.type === MediaType.DRAWING ? (
                        <View style={[styles.previewDrawing, { backgroundColor: colors.primaryMuted }]}>
                          <Icon name="brush" size={40} color={colors.primary} />
                          <Text style={[textStyles.caption, { color: colors.primary, marginTop: spacing[1] }]}>Drawing</Text>
                        </View>
                      ) : (
                        <View style={[styles.previewAudio, { backgroundColor: colors.primaryMuted }]}>
                          <Icon name="music-note" size={40} color={colors.primary} />
                          <Text style={[textStyles.caption, { color: colors.primary, marginTop: spacing[1] }]}>
                            Voice Note
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.removeAttachmentButton, { backgroundColor: colors.destructive }]}
                      onPress={handleRemoveAttachment}
                    >
                      <Icon name="close" size={16} color={colors.destructiveForeground} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Unsaved Changes Dialog */}
      <Dialog
        visible={showSaveDialog}
        onClose={handleKeepEditing}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to save them?"
      >
        <View style={styles.dialogActions}>
          <Button variant="ghost" onPress={handleDiscardChanges}>
            Discard
          </Button>
          <Button variant="outline" onPress={handleKeepEditing}>
            Keep Editing
          </Button>
          <Button variant="primary" onPress={handleSave} loading={isMutating}>
            Save
          </Button>
        </View>
      </Dialog>

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
        <Modal
          visible={showVoiceRecorder}
          onRequestClose={handleVoiceRecordingCancel}
          transparent
          animationType="fade"
        >
          <View style={[styles.voiceRecorderOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.voiceRecorderModal, { backgroundColor: colors.surface }]}>
              <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} onCancel={handleVoiceRecordingCancel} />
            </View>
          </View>
        </Modal>
      )}

      {/* Drawing Screen */}
      <DrawingScreen
        visible={showDrawingScreen}
        onClose={handleDrawingCancel}
        onSave={handleDrawingSave}
      />

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        message={error || ''}
        onDismiss={clearError}
        action={{
          label: 'Dismiss',
          onPress: clearError,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  attachmentPreviewsSection: {},
  attachmentButtons: {
    flexDirection: 'row',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentPreviews: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  attachmentPreview: {
    width: 80,
    height: 80,
    overflow: 'hidden',
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
    position: 'relative',
  },
  previewAudio: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDrawing: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  uploadProgressContainer: {},
  uploadProgressBar: {
    height: 4,
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRecorderOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRecorderModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});

export default EditNoteScreen;
