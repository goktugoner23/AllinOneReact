import React, { useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, Card, ActivityIndicator, useTheme, Chip, IconButton } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store';
import { fetchInstagramPosts, clearError } from '@features/instagram/store/instagramSlice';
import { InstagramPost } from '@features/instagram/types/Instagram';
import { useNavigation } from '@react-navigation/native';
import {
  formatNumber,
  getMediaTypeIcon,
  formatRelativeTime,
  getErrorMessage,
  formatHashtagForDisplay,
} from '@features/instagram/utils/instagramHelpers';
import InstagramImage from '@features/instagram/components/InstagramImage';

const PostsTab: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const { data: posts, loading } = useSelector((state: RootState) => state.instagram.posts);

  // Load posts on mount
  useEffect(() => {
    if (!posts) {
      dispatch(fetchInstagramPosts(false));
    }
  }, [dispatch, posts]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchInstagramPosts(true));
  }, [dispatch]);

  // Handle retry
  const handleRetry = useCallback(() => {
    dispatch(clearError('posts'));
    dispatch(fetchInstagramPosts(false));
  }, [dispatch]);

  // Render post item
  const handleOpenDetails = useCallback(
    (post: InstagramPost) => {
      navigation.navigate('PostDetail', { post });
    },
    [navigation],
  );

  const renderPostItem = useCallback(
    ({ item }: { item: InstagramPost }) => <PostCard post={item} onPress={() => handleOpenDetails(item)} />,
    [handleOpenDetails],
  );

  // Render loading state
  if (loading.isLoading && !posts) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading Instagram posts...</Text>
      </View>
    );
  }

  // Render error state
  if (loading.error && !posts) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{getErrorMessage(loading.error)}</Text>
        <IconButton icon="refresh" size={24} onPress={handleRetry} style={styles.retryButton} />
        <Text style={[styles.retryText, { color: theme.colors.onBackground }]}>Tap to retry</Text>
      </View>
    );
  }

  // Render empty state
  if (posts && posts.posts.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>No Instagram posts found</Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with sync info */}
      {posts && (
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{posts.count} Posts</Text>
          <Chip mode="outlined" compact style={styles.sourceChip} textStyle={{ fontSize: 12 }}>
            {posts.source}
          </Chip>
        </View>
      )}

      <FlashList
        data={posts?.posts || []}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading.isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        estimatedItemSize={231}
      />
    </View>
  );
};

// Post Card Component
const PostCard: React.FC<{ post: InstagramPost; onPress?: () => void }> = React.memo(({ post, onPress }) => {
  const theme = useTheme();

  return (
    <Card style={[styles.postCard, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <Card.Content>
        {/* Post header */}
        <View style={styles.postHeader}>
          <View style={styles.postInfo}>
            <Text style={[styles.postDate, { color: theme.colors.onSurfaceVariant }]}>
              {post.formattedDate || formatRelativeTime(post.timestamp)}
            </Text>
            <Chip
              mode="outlined"
              compact
              icon={getMediaTypeIcon(post.mediaType)}
              style={styles.mediaTypeChip}
              textStyle={{ fontSize: 10 }}
            >
              {post.mediaType}
            </Chip>
          </View>
          <Text style={[styles.engagementRate, { color: theme.colors.primary }]}>
            {post.metrics.engagementRate.toFixed(1)}%
          </Text>
        </View>

        {post.thumbnailUrl ? (
          <InstagramImage
            instagramUrl={post.thumbnailUrl}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={(url) => console.warn('Failed to load post thumbnail:', url)}
          />
        ) : null}

        <Text style={[styles.postCaption, { color: theme.colors.onSurface }]} numberOfLines={3}>
          {post.caption}
        </Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Ionicons name="heart-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metricText, { color: theme.colors.onSurfaceVariant }]}>
              {formatNumber(post.metrics.likesCount)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="chatbubble-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metricText, { color: theme.colors.onSurfaceVariant }]}>
              {formatNumber(post.metrics.commentsCount)}
            </Text>
          </View>
          {post.metrics.sharesCount && post.metrics.sharesCount > 0 ? (
            <View style={styles.metricItem}>
              <Ionicons name="share-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metricText, { color: theme.colors.onSurfaceVariant }]}>
                {formatNumber(post.metrics.sharesCount)}
              </Text>
            </View>
          ) : null}
          {post.metrics.reachCount && post.metrics.reachCount > 0 ? (
            <View style={styles.metricItem}>
              <Ionicons name="eye-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metricText, { color: theme.colors.onSurfaceVariant }]}>
                {formatNumber(post.metrics.reachCount)}
              </Text>
            </View>
          ) : null}
        </View>

        {post.hashtags.length > 0 ? (
          <View style={styles.hashtagsContainer}>
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <Chip key={index} mode="outlined" compact style={styles.hashtagChip} textStyle={styles.hashtagText}>
                {formatHashtagForDisplay(hashtag)}
              </Chip>
            ))}
            {post.hashtags.length > 3 ? (
              <Text style={[styles.moreHashtags, { color: theme.colors.onSurfaceVariant }]}>
                +{post.hashtags.length - 3} more
              </Text>
            ) : null}
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sourceChip: {
    height: 28,
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginVertical: 8,
  },
  retryText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  postCard: {
    marginBottom: 16,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    marginRight: 8,
  },
  mediaTypeChip: {
    height: 24,
  },
  engagementRate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    marginLeft: 4,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  hashtagChip: {
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  hashtagText: {
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  moreHashtags: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default PostsTab;
