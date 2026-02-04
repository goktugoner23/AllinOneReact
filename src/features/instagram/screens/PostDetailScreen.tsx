import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, Text } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { InstagramPost } from '@features/instagram/types/Instagram';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatHashtagForDisplay } from '@features/instagram/utils/instagramHelpers';
import InstagramImage from '@features/instagram/components/InstagramImage';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';
import { Card, CardContent, IconButton, Chip, Button } from '@shared/components/ui';

type Params = {
  PostDetail: { post: InstagramPost };
};

const PostDetailScreen: React.FC = () => {
  const colors = useColors();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, 'PostDetail'>>();
  const post = route.params?.post;

  const formattedDate = useMemo(() => {
    try {
      return new Date(post.timestamp).toLocaleString();
    } catch {
      return post.formattedDate || '';
    }
  }, [post]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={[styles.card, shadow.md]}>
        <CardContent>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="logo-instagram" size={24} color={colors.primary} />
              <View style={styles.headerTitles}>
                <Text style={[textStyles.h4, { color: colors.foreground }]}>{post.username || 'Instagram Post'}</Text>
                <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>{formattedDate}</Text>
              </View>
            </View>
            <IconButton
              icon="open-outline"
              size="md"
              variant="ghost"
              color={colors.foregroundMuted}
              onPress={() => Linking.openURL(post.permalink)}
            />
          </View>

          {post.mediaUrl || post.thumbnailUrl ? (
            <InstagramImage
              instagramUrl={post.mediaUrl || post.thumbnailUrl!}
              style={styles.media}
              resizeMode="cover"
              onError={(url) => console.warn('Failed to load post media:', url)}
              onPress={() => post.permalink && Linking.openURL(post.permalink)}
            />
          ) : null}

          <View style={styles.rowBetween}>
            <Chip
              variant="outlined"
              size="sm"
              leftIcon={<Ionicons name="pricetag-outline" size={12} color={colors.mutedForeground} />}
              style={styles.typeChip}
            >
              {post.mediaType}
            </Chip>
            <Text style={[styles.engagement, { color: colors.primary }]}>
              {post.metrics.engagementRate.toFixed(1)}%
            </Text>
          </View>

          <Text style={[styles.caption, { color: colors.foreground }]}>{post.caption}</Text>

          <View style={styles.metricsRow}>
            <Metric icon="heart-outline" label="Likes" value={post.metrics.likesCount} />
            <Metric icon="chatbubble-outline" label="Comments" value={post.metrics.commentsCount} />
            {post.metrics.savesCount != null && (
              <Metric icon="bookmark-outline" label="Saves" value={post.metrics.savesCount} />
            )}
            {post.metrics.sharesCount != null && (
              <Metric icon="share-outline" label="Shares" value={post.metrics.sharesCount} />
            )}
          </View>

          {(post.hashtags?.length ?? 0) > 0 && (
            <View style={styles.hashtags}>
              {post.hashtags.slice(0, 10).map((h, i) => (
                <Chip
                  key={i}
                  variant="outlined"
                  size="sm"
                  style={styles.hashtag}
                >
                  {formatHashtagForDisplay(h)}
                </Chip>
              ))}
            </View>
          )}

          <Button
            variant="primary"
            style={styles.backBtn}
            leftIcon={<Ionicons name="arrow-back" size={18} color={colors.primaryForeground} />}
            onPress={() => navigation.goBack()}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const Metric: React.FC<{ icon: string; label: string; value?: number }> = ({ icon, label, value }) => {
  const colors = useColors();
  if (value == null) return null;
  return (
    <View style={styles.metricItem}>
      <Ionicons name={icon} size={18} color={colors.foregroundMuted} />
      <Text style={[styles.metricText, { color: colors.foregroundMuted }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.foregroundSubtle }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[4] },
  card: { marginBottom: spacing[4], borderRadius: radius.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  headerTitles: { flex: 1 },
  media: { width: '100%', height: 260, borderRadius: radius.md, marginBottom: spacing[3] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  typeChip: {},
  engagement: { ...textStyles.h4 },
  caption: { ...textStyles.bodySmall, marginTop: spacing[2] },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing[3] },
  metricItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing[4], marginBottom: spacing[1.5] },
  metricText: { marginLeft: spacing[1.5], marginRight: spacing[1], ...textStyles.bodySmall },
  metricLabel: { ...textStyles.caption },
  hashtags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing[2], gap: spacing[1.5] },
  hashtag: {},
  hashtagText: {
    fontSize: 11,
    lineHeight: 14,
  },
  backBtn: { marginTop: spacing[4], borderRadius: radius.md },
});

export default PostDetailScreen;
