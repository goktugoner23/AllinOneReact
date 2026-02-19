import React, { useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store';
import { fetchInstagramPosts, clearError } from '@features/instagram/store/instagramSlice';
import { InstagramPost } from '@features/instagram/types/Instagram';
import { useNavigation } from '@react-navigation/native';
import { formatNumber, formatRelativeTime, getErrorMessage, formatHashtagForDisplay } from '@features/instagram/utils/instagramHelpers';
import InstagramImage from '@features/instagram/components/InstagramImage';
import { useAppTheme, textStyles, spacing, radius, shadow } from '@shared/theme';
import { Button } from '@shared/components/ui';

const PostsTab: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const { data: posts, loading } = useSelector((state: RootState) => state.instagram.posts);

  useEffect(() => {
    if (!posts) {
      dispatch(fetchInstagramPosts(false));
    }
  }, [dispatch, posts]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchInstagramPosts(true));
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(clearError('posts'));
    dispatch(fetchInstagramPosts(false));
  }, [dispatch]);

  const handleOpenDetails = useCallback(
    (post: InstagramPost) => {
      navigation.navigate('PostDetail', { post });
    },
    [navigation],
  );

  const renderPostItem = useCallback(
    ({ item, index }: { item: InstagramPost; index: number }) => {
      const isFirst = index === 0;
      const isLast = posts ? index === posts.posts.length - 1 : false;
      return <PostCard post={item} onPress={() => handleOpenDetails(item)} colors={colors} isFirst={isFirst} isLast={isLast} />;
    },
    [handleOpenDetails, colors, posts],
  );

  if (loading.isLoading && !posts) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.foregroundMuted, marginTop: spacing[3] }]}>
          Loading posts...
        </Text>
      </View>
    );
  }

  if (loading.error && !posts) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.errorBox, { backgroundColor: colors.destructiveMuted, borderRadius: radius.lg }]}>
          <Text style={[textStyles.body, { color: colors.destructive, textAlign: 'center' }]}>
            {getErrorMessage(loading.error)}
          </Text>
          <Button variant="outline" onPress={handleRetry} style={{ marginTop: spacing[4] }}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  if (posts && posts.posts.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[textStyles.h4, { color: colors.foreground }]}>No Posts</Text>
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
          Pull to refresh
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {posts && (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[textStyles.h2, { color: colors.foreground }]}>{posts.count}</Text>
          <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginLeft: spacing[2] }]}>
            Posts
          </Text>
          <View style={styles.headerSpacer} />
          <View style={[styles.sourceTag, { backgroundColor: colors.primaryMuted, borderRadius: radius.full }]}>
            <Text style={[textStyles.caption, { color: colors.primary, fontWeight: '500' }]}>
              {posts.source}
            </Text>
          </View>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        estimatedItemSize={320}
      />
    </View>
  );
};

interface PostCardProps {
  post: InstagramPost;
  onPress?: () => void;
  colors: any;
  isFirst: boolean;
  isLast: boolean;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ post, onPress, colors, isFirst, isLast }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.postCard,
        {
          backgroundColor: colors.card,
          marginHorizontal: spacing[4],
          borderTopLeftRadius: isFirst ? radius.lg : 0,
          borderTopRightRadius: isFirst ? radius.lg : 0,
          borderBottomLeftRadius: isLast ? radius.lg : 0,
          borderBottomRightRadius: isLast ? radius.lg : 0,
          borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
            {post.formattedDate || formatRelativeTime(post.timestamp)}
          </Text>
          <View style={[styles.mediaTypeBadge, { backgroundColor: colors.muted, borderRadius: radius.sm }]}>
            <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
              {post.mediaType}
            </Text>
          </View>
        </View>
        <View style={[styles.engagementBadge, { backgroundColor: colors.primaryMuted, borderRadius: radius.full }]}>
          <Text style={[textStyles.caption, { color: colors.primary, fontWeight: '600' }]}>
            {post.metrics.engagementRate.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Thumbnail */}
      {post.thumbnailUrl && (
        <View style={[styles.thumbnailContainer, { borderRadius: radius.md, overflow: 'hidden' }]}>
          <InstagramImage
            instagramUrl={post.thumbnailUrl}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={(url) => console.warn('Failed to load:', url)}
          />
        </View>
      )}

      {/* Caption */}
      <Text style={[textStyles.body, { color: colors.foreground }]} numberOfLines={2}>
        {post.caption || '—'}
      </Text>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <MetricItem icon="♥" value={post.metrics.likesCount} colors={colors} />
        <MetricItem icon="💬" value={post.metrics.commentsCount} colors={colors} />
        {post.metrics.sharesCount != null && post.metrics.sharesCount > 0 && (
          <MetricItem icon="↗" value={post.metrics.sharesCount} colors={colors} />
        )}
        {post.metrics.reachCount != null && post.metrics.reachCount > 0 && (
          <MetricItem icon="👁" value={post.metrics.reachCount} colors={colors} />
        )}
      </View>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <View style={styles.hashtagRow}>
          {post.hashtags.slice(0, 4).map((tag, i) => (
            <View key={i} style={[styles.hashtagChip, { backgroundColor: colors.muted, borderRadius: radius.full }]}>
              <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
                {formatHashtagForDisplay(tag)}
              </Text>
            </View>
          ))}
          {post.hashtags.length > 4 && (
            <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
              +{post.hashtags.length - 4}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const MetricItem: React.FC<{ icon: string; value: number; colors: any }> = ({ icon, value, colors }) => (
  <View style={styles.metricItem}>
    <Text style={{ fontSize: 14 }}>{icon}</Text>
    <Text style={[textStyles.bodySmall, { color: colors.foreground, fontWeight: '600', marginLeft: 4 }]}>
      {formatNumber(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorBox: {
    padding: spacing[6],
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    flex: 1,
  },
  sourceTag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  listContainer: {
    paddingVertical: spacing[4],
    paddingBottom: spacing[20],
  },
  postCard: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  mediaTypeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  engagementBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  thumbnailContainer: {
    marginBottom: spacing[3],
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[3],
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[3],
    gap: spacing[2],
    alignItems: 'center',
  },
  hashtagChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
});

export default PostsTab;
