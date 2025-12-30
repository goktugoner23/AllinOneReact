import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert, Image, Share } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Searchbar, Chip } from 'react-native-paper';
import { AddFab } from '@shared/components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNotes, useDeleteNote } from '@shared/hooks';
import { Note } from '@features/notes/types/Note';
import { formatDate, stripHtmlTags } from '@shared/utils/formatters';
import AttachmentGallery from '@features/notes/components/AttachmentGallery';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import { NavigationProps, NotesStackParamList } from '@shared/types/navigation';
import { Video } from 'react-native-video';
import { Card, CardContent, IconButton, Button, Skeleton, SkeletonCard, EmptyState } from '@shared/components/ui';
import { useAppTheme } from '@shared/theme';

const NotesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps<NotesStackParamList>>();
  const { colors, spacing, textStyles, radius } = useAppTheme();

  // TanStack Query hooks
  const { data: notes = [], isLoading, error, refetch } = useNotes();
  const deleteNoteMutation = useDeleteNote();

  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<MediaAttachment[]>([]);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.content?.toLowerCase().includes(query),
    );
  }, [notes, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert('Delete Note', `Are you sure you want to delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNoteMutation.mutate(note.id),
      },
    ]);
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
    navigation.navigate({ name: 'EditNote', params: { noteId: String(note.id) } });
  };

  const handleCreateNote = () => {
    navigation.navigate({ name: 'EditNote', params: {} });
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

    const handleAttachmentPress = (uri: string) => {
      // Find the index of the clicked attachment
      const clickedIndex = allAttachments.findIndex((att) => att === uri);

      // Create attachments array for the gallery
      const attachments: MediaAttachment[] = allAttachments.map((att, idx) => {
        const isImage = imageUris.includes(att);
        const isVideo = videoUris.includes(att);
        const isAudio = voiceUris.includes(att);

        return {
          id: `${item.id}_${idx}`,
          uri: att,
          type: isImage ? MediaType.IMAGE : isVideo ? MediaType.VIDEO : MediaType.AUDIO,
          name: `${isImage ? 'Image' : isVideo ? 'Video' : 'Audio'} attachment`,
        };
      });

      setSelectedAttachments(attachments);
      setSelectedAttachmentIndex(clickedIndex);
      setShowAttachmentGallery(true);
    };

    return (
      <Card
        style={[styles.noteCard, { backgroundColor: colors.card }]}
        onPress={() => handleNotePress(item)}
        variant="elevated"
        padding="md"
      >
        <View style={styles.noteHeader}>
          <Text style={[textStyles.h4, { color: colors.foreground, flex: 1, marginRight: spacing[2] }]} numberOfLines={2}>
            {item.title || 'Untitled Note'}
          </Text>
          <View style={styles.noteActions}>
            <IconButton icon="share-social-outline" size="sm" variant="ghost" onPress={() => handleShareNote(item)} />
            <IconButton
              icon="trash-outline"
              size="sm"
              variant="ghost"
              color={colors.destructive}
              onPress={() => handleDeleteNote(item)}
              loading={deleteNoteMutation.isPending}
            />
          </View>
        </View>

        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[3] }]} numberOfLines={3}>
          {stripHtmlTags(item.content) || 'No content'}
        </Text>

        {/* Attachment Previews */}
        {allAttachments.length > 0 && (
          <View style={[styles.attachmentPreviews, { gap: spacing[2], marginBottom: spacing[3] }]}>
            {allAttachments.slice(0, 3).map((uri, index) => {
              const isImage = imageUris.includes(uri);
              const isVideo = videoUris.includes(uri);
              const isAudio = voiceUris.includes(uri);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.attachmentPreview, { backgroundColor: colors.muted, borderRadius: radius.md }]}
                  onPress={() => handleAttachmentPress(uri)}
                >
                  {isImage ? (
                    <Image source={{ uri }} style={styles.previewImage} />
                  ) : isVideo ? (
                    <View style={[styles.previewVideo, { backgroundColor: colors.surfaceHover }]}>
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
                    <View style={[styles.previewAudio, { backgroundColor: colors.primaryMuted }]}>
                      <Icon name="music-note" size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            {allAttachments.length > 3 && (
              <View style={[styles.moreAttachments, { backgroundColor: colors.muted, borderRadius: radius.md }]}>
                <Text style={[textStyles.labelSmall, { color: colors.foregroundMuted }]}>+{allAttachments.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.noteFooter}>
          <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>{formatDate(item.lastEdited)}</Text>

          {hasAttachments && (
            <Chip icon="attachment" mode="outlined" compact style={styles.attachmentChip}>
              {attachmentCount}
            </Chip>
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="document-text-outline"
      title="No Notes Yet"
      description="Create your first note to get started"
      actionLabel="Create Note"
      onAction={handleCreateNote}
      style={styles.emptyState}
    />
  );

  const renderLoadingState = () => (
    <View style={[styles.loadingContainer, { padding: spacing[4], gap: spacing[3] }]}>
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  if (isLoading && !refreshing) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{renderLoadingState()}</View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showSearch && (
        <Searchbar
          placeholder="Search notes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { margin: spacing[4], backgroundColor: colors.surface }]}
          onIconPress={() => setShowSearch(false)}
          icon={showSearch ? 'close' : 'magnify'}
        />
      )}

      <FlashList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={180}
      />

      <View style={[styles.fabContainer, { bottom: spacing[4], right: spacing[4] }]}>
        <AddFab iconName="magnify" style={{ marginLeft: spacing[2] }} onPress={() => setShowSearch(!showSearch)} />
        <AddFab style={{ marginLeft: spacing[2] }} onPress={handleCreateNote} />
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
  },
  searchBar: {
    elevation: 2,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentChip: {
    height: 24,
  },
  attachmentPreviews: {
    flexDirection: 'row',
  },
  attachmentPreview: {
    width: 60,
    height: 60,
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
  },
  moreAttachments: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NotesScreen;
