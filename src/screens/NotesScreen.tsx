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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FAB, Searchbar, Card, IconButton, Chip, Portal, Modal } from 'react-native-paper';
import { useNotes } from '../store/notesHooks';
import { Note } from '../types/Note';
import { formatDate } from '../utils/formatters';
import MediaViewer from '../components/MediaViewer';

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
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');
  const [selectedMediaName, setSelectedMediaName] = useState<string>('');

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
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteNote(item)}
              style={styles.deleteButton}
            />
          </View>
          
          <Text style={styles.noteContent} numberOfLines={3}>
            {item.content || 'No content'}
          </Text>
          
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

      {/* Media Viewer Modal */}
      <Portal>
        <Modal
          visible={showMediaViewer}
          onDismiss={() => setShowMediaViewer(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedMediaUri && (
            <MediaViewer
              attachment={{
                id: 'temp',
                uri: selectedMediaUri,
                type: selectedMediaType as any,
                name: selectedMediaName,
              }}
              onClose={() => setShowMediaViewer(false)}
            />
          )}
        </Modal>
      </Portal>
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