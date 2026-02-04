import React, { useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';
import { Card, CardContent, Chip, IconButton } from '@shared/components/ui';

const PostsTab: React.FC = () => {
  const colors = useColors();
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading Instagram posts...</Text>
      </View>
    );
  }

  // Render error state
  if (loading.error && !posts) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{getErrorMessage(loading.error)}</Text>
        <IconButton
          icon="refresh-outline"
          size="md"
          onPress={handleRetry}
          style={styles.retryButton}
          color={colors.primary}
        />
        <Text style={[styles.retryText, { color: colors.foreground }]}>Tap to retry</Text>
      </View>
    );
  }

  // Render empty state
  if (posts && posts.posts.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.foreground }]}>No Instagram posts found</Text>
        <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with sync info */}
      {posts && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{posts.count} Posts</Text>
          <Chip
            variant="outlined"
            size="sm"
            style={styles.sourceChip}
          >
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
            colors={[colors.primary]}
            tintColor={colors.primary}
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
  const colors = useColors();

  return (
    <Card style={[styles.postCard, shadow.md]} onPress={onPress}>
      <CardContent>
        {/* Post header */}
        <View style={styles.postHeader}>
          <View style={styles.postInfo}>
            <Text style={[styles.postDate, { color: colors.foregroundMuted }]}>
              {post.formattedDate || formatRelativeTime(post.timestamp)}
            </Text>
            <Chip
              variant="outlined"
              size="sm"
              style={styles.mediaTypeChip}
              leftIcon={<Ionicons name={getMediaTypeIcon(post.mediaType)} size={12} color={colors.mutedForeground} />}
            >
              {post.mediaType}
            </Chip>
          </View>
          <Text style={[styles.engagementRate, { color: colors.primary }]}>
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

        <Text style={[styles.postCaption, { color: colors.foreground }]} numberOfLines={3}>
          {post.caption}
        </Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Ionicons name="heart-outline" size={16} color={colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: colors.foregroundMuted }]}>
              {formatNumber(post.metrics.likesCount)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: colors.foregroundMuted }]}>
              {formatNumber(post.metrics.commentsCount)}
            </Text>
          </View>
          {post.metrics.sharesCount && post.metrics.sharesCount > 0 ? (
            <View style={styles.metricItem}>
              <Ionicons name="share-outline" size={16} color={colors.foregroundMuted} />
              <Text style={[styles.metricText, { color: colors.foregroundMuted }]}>
                {formatNumber(post.metrics.sharesCount)}
              </Text>
            </View>
          ) : null}
          {post.metrics.reachCount && post.metrics.reachCount > 0 ? (
            <View style={styles.metricItem}>
              <Ionicons name="eye-outline" size={16} color={colors.foregroundMuted} />
              <Text style={[styles.metricText, { color: colors.foregroundMuted }]}>
                {formatNumber(post.metrics.reachCount)}
              </Text>
            </View>
          ) : null}
        </View>

        {post.hashtags.length > 0 ? (
          <View style={styles.hashtagsContainer}>
            {post.hashtags.slice(0, 3).map((hashtag, index) => (
              <Chip
                key={index}
                variant="outlined"
                size="sm"
                style={styles.hashtagChip}
              >
                {formatHashtagForDisplay(hashtag)}
              </Chip>
            ))}
            {post.hashtags.length > 3 ? (
              <Text style={[styles.moreHashtags, { color: colors.foregroundSubtle }]}>
                +{post.hashtags.length - 3} more
              </Text>
            ) : null}
          </View>
        ) : null}
      </CardContent>
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
    padding: spacing[5],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...textStyles.h4,
  },
  sourceChip: {
    height: 28,
  },
  listContainer: {
    padding: spacing[4],
  },
  loadingText: {
    marginTop: spacing[4],
    ...textStyles.body,
  },
  errorText: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    marginVertical: spacing[2],
  },
  retryText: {
    ...textStyles.bodySmall,
  },
  emptyText: {
    ...textStyles.h4,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    ...textStyles.bodySmall,
  },
  postCard: {
    marginBottom: spacing[4],
    borderRadius: radius.lg,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  postInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postDate: {
    ...textStyles.caption,
    marginRight: spacing[2],
  },
  mediaTypeChip: {
    height: 24,
  },
  engagementRate: {
    ...textStyles.label,
    fontWeight: '700',
  },
  postCaption: {
    ...textStyles.bodySmall,
    marginBottom: spacing[3],
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[3],
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[4],
    marginBottom: spacing[1],
  },
  metricText: {
    ...textStyles.caption,
    marginLeft: spacing[1],
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  hashtagChip: {
    borderRadius: radius.full,
    marginRight: spacing[1.5],
    marginBottom: spacing[1.5],
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[2],
  },
  hashtagText: {
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  moreHashtags: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
});

export default PostsTab;
