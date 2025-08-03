import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  TextInput,
  Button,
  Appbar,
  Snackbar,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useNotes } from '../store/notesHooks';
import { NoteFormData } from '../types/Note';
import RichTextEditor from '../components/RichTextEditor';
import MediaAttachmentManager from '../components/MediaAttachmentManager';
import { MediaAttachmentsState, MediaAttachment } from '../types/MediaAttachment';

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

  // Find existing note if editing
  const existingNote = notes.find(note => note.id === noteId);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
    }
  }, [existingNote]);

  useEffect(() => {
    const hasChanges = title.trim() !== (existingNote?.title || '') ||
                      content.trim() !== (existingNote?.content || '') ||
                      mediaAttachments.attachments.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [title, content, mediaAttachments.attachments, existingNote]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return;
    }

    setSaving(true);
    try {
      const noteData: NoteFormData = {
        title: title.trim(),
        content: content.trim(),
        imageUris: mediaAttachments.attachments
          .filter(att => att.type === 'IMAGE')
          .map(att => att.uri)
          .join(','),
        videoUris: mediaAttachments.attachments
          .filter(att => att.type === 'VIDEO')
          .map(att => att.uri)
          .join(','),
        voiceNoteUris: mediaAttachments.attachments
          .filter(att => att.type === 'AUDIO')
          .map(att => att.uri)
          .join(','),
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
        <Appbar.BackAction onPress={handleBackPress} />
        <Appbar.Content title={noteId ? 'Edit Note' : 'New Note'} />
        <Appbar.Action
          icon="content-save"
          onPress={handleSave}
          disabled={!hasUnsavedChanges || saving}
        />
      </Appbar.Header>

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

        {/* Media Attachments */}
        <MediaAttachmentManager
          state={mediaAttachments}
          onStateChange={setMediaAttachments}
        />
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
});

export default EditNoteScreen; 