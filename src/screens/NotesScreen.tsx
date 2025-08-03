import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { Video } from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { FAB, Searchbar, Card, IconButton, Chip, Portal, Modal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotes } from '../store/notesHooks';
import { Note } from '../types/Note';
import { formatDate, stripHtmlTags } from '../utils/formatters';
import AttachmentGallery from '../components/AttachmentGallery';

const NotesScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    notes,
    loading,
    error,
    searchQuery,
    loadNotes,
    deleteNote,
    setSearch,
    clearError,
  } = useNotes();

  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{ uri: string; type: 'image' | 'video' | 'audio'; name?: string }>>([]);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNote(note.id),
        },
      ]
    );
  };

  const handleShareNote = async (note: Note) => {
    try {
      const cleanContent = stripHtmlTags(note.content);
      const shareContent = `Title: ${note.title}\n\nContent: ${cleanContent}`;
      
      await Share.share({
        message: shareContent,
        title: note.title,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
      Alert.alert('Error', 'Failed to share note');
    }
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('EditNote' as never, { noteId: note.id } as never);
  };

  const handleCreateNote = () => {
    navigation.navigate('EditNote' as never, { noteId: null } as never);
  };

  const renderNoteCard = ({ item }: { item: Note }) => {
    const hasAttachments = item.imageUris || item.videoUris || item.voiceNoteUris;
    const attachmentCount = [
      item.imageUris?.split(',').filter(Boolean).length || 0,
      item.videoUris?.split(',').filter(Boolean).length || 0,
      item.voiceNoteUris?.split(',').filter(Boolean).length || 0,
    ].reduce((sum, count) => sum + count, 0);

    // Get attachment previews
    const imageUris = item.imageUris?.split(',').filter(Boolean) || [];
    const videoUris = item.videoUris?.split(',').filter(Boolean) || [];
    const voiceUris = item.voiceNoteUris?.split(',').filter(Boolean) || [];
    const allAttachments = [...imageUris, ...videoUris, ...voiceUris];

    const handleAttachmentPress = (uri: string, type: 'image' | 'video' | 'audio') => {
      // Find the index of the clicked attachment
      const clickedIndex = allAttachments.findIndex(att => att === uri);
      
      // Create attachments array for the gallery
      const attachments = allAttachments.map(att => {
        const isImage = imageUris.includes(att);
        const isVideo = videoUris.includes(att);
        const isAudio = voiceUris.includes(att);
        
        return {
          uri: att,
          type: (isImage ? 'image' : isVideo ? 'video' : 'audio') as 'image' | 'video' | 'audio',
          name: `${isImage ? 'Image' : isVideo ? 'Video' : 'Audio'} attachment`
        };
      });
      
      setSelectedAttachments(attachments);
      setSelectedAttachmentIndex(clickedIndex);
      setShowAttachmentGallery(true);
    };

    return (
      <Card
        style={styles.noteCard}
        onPress={() => handleNotePress(item)}
      >
        <Card.Content>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle} numberOfLines={2}>
              {item.title || 'Untitled Note'}
            </Text>
            <View style={styles.noteActions}>
              <IconButton
                icon="share"
                size={20}
                onPress={() => handleShareNote(item)}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteNote(item)}
                style={styles.deleteButton}
              />
            </View>
          </View>
          
          <Text style={styles.noteContent} numberOfLines={3}>
            {stripHtmlTags(item.content) || 'No content'}
          </Text>
          
          {/* Attachment Previews */}
          {allAttachments.length > 0 && (
            <View style={styles.attachmentPreviews}>
              {allAttachments.slice(0, 3).map((uri, index) => {
                const isImage = imageUris.includes(uri);
                const isVideo = videoUris.includes(uri);
                const isAudio = voiceUris.includes(uri);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentPreview}
                    onPress={() => handleAttachmentPress(
                      uri, 
                      isImage ? 'image' : isVideo ? 'video' : 'audio'
                    )}
                  >
                    {isImage ? (
                      <Image source={{ uri }} style={styles.previewImage} />
                    ) : isVideo ? (
                      <View style={styles.previewVideo}>
                        <Video
                          source={{ uri }}
                          style={styles.previewVideoThumbnail}
                          resizeMode="cover"
                          paused={true}
                          muted={true}
                        />
                        <View style={styles.playOverlay}>
                          <Icon name="play-arrow" size={16} color="white" />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.previewAudio}>
                        <Icon name="music-note" size={20} color="#666" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {allAttachments.length > 3 && (
                <View style={styles.moreAttachments}>
                  <Text style={styles.moreAttachmentsText}>+{allAttachments.length - 3}</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.noteFooter}>
            <Text style={styles.noteDate}>
              {formatDate(item.lastEdited)}
            </Text>
            
            {hasAttachments && (
              <Chip
                icon="attachment"
                mode="outlined"
                compact
                style={styles.attachmentChip}
              >
                {attachmentCount}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Notes Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first note to get started
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateNote}
      >
        <Text style={styles.createButtonText}>Create Note</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showSearch && (
        <Searchbar
          placeholder="Search notes..."
          onChangeText={setSearch}
          value={searchQuery}
          style={styles.searchBar}
          onIconPress={() => setShowSearch(false)}
          icon={showSearch ? 'close' : 'magnify'}
        />
      )}

      <FlatList
        data={notes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabContainer}>
        <FAB
          icon="magnify"
          style={[styles.fab, styles.searchFab]}
          onPress={() => setShowSearch(!showSearch)}
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreateNote}
        />
      </View>

      {/* Attachment Gallery */}
      {showAttachmentGallery && (
        <AttachmentGallery
          attachments={selectedAttachments}
          initialIndex={selectedAttachmentIndex}
          onClose={() => setShowAttachmentGallery(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for FABs
  },
  noteCard: {
    marginBottom: 12,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  attachmentChip: {
    height: 24,
  },
  attachmentPreviews: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  attachmentPreview: {
    width: 60,
    height: 60,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  previewAudio: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
  },
  moreAttachments: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttachmentsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    marginLeft: 8,
  },
  searchFab: {
    backgroundColor: '#666',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotesScreen; 