import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, Text, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { InstagramPost } from '@features/instagram/types/Instagram';
import { formatHashtagForDisplay, formatNumber } from '@features/instagram/utils/instagramHelpers';
import InstagramImage from '@features/instagram/components/InstagramImage';
import { useAppTheme, textStyles, spacing, radius } from '@shared/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Params = {
  PostDetail: { post: InstagramPost };
};

const PostDetailScreen: React.FC = () => {
  const { colors } = useAppTheme();
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
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.muted, borderRadius: radius.md }]}
        >
          <Icon name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL(post.permalink)}
          style={[styles.openButton, { backgroundColor: colors.primary, borderRadius: radius.md }]}
        >
          <Icon name="open-in-new" size={18} color={colors.primaryForeground} />
          <Text style={[textStyles.button, { color: colors.primaryForeground, marginLeft: spacing[1] }]}>
            Open
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Post Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
            Post Info
          </Text>

          <InfoRow label="User" value={post.username || '—'} colors={colors} highlight />
          <InfoRow label="Date" value={formattedDate} colors={colors} />
          <InfoRow label="Type" value={post.mediaType} colors={colors} />
          <InfoRow
            label="Engagement"
            value={`${post.metrics.engagementRate.toFixed(2)}%`}
            colors={colors}
            highlight
            isLast
          />
        </View>

        {/* Media */}
        {(post.mediaUrl || post.thumbnailUrl) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, padding: 0 }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => post.permalink && Linking.openURL(post.permalink)}>
              <InstagramImage
                instagramUrl={post.mediaUrl || post.thumbnailUrl!}
                style={styles.media}
                resizeMode="cover"
                onError={(url) => console.warn('Failed to load:', url)}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Caption */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
            Caption
          </Text>
          <Text style={[textStyles.body, { color: colors.foreground, lineHeight: 24 }]}>
            {post.caption || '—'}
          </Text>
        </View>

        {/* Metrics */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
            Metrics
          </Text>
          <View style={styles.metricsGrid}>
            <MetricCell label="Likes" value={post.metrics.likesCount} colors={colors} />
            <MetricCell label="Comments" value={post.metrics.commentsCount} colors={colors} />
            {post.metrics.savesCount != null && (
              <MetricCell label="Saves" value={post.metrics.savesCount} colors={colors} />
            )}
            {post.metrics.sharesCount != null && (
              <MetricCell label="Shares" value={post.metrics.sharesCount} colors={colors} />
            )}
            {post.metrics.reachCount != null && (
              <MetricCell label="Reach" value={post.metrics.reachCount} colors={colors} />
            )}
            {post.metrics.impressionsCount != null && (
              <MetricCell label="Impressions" value={post.metrics.impressionsCount} colors={colors} />
            )}
          </View>
        </View>

        {/* Hashtags */}
        {(post.hashtags?.length ?? 0) > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing[8] }]}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
              Hashtags ({post.hashtags.length})
            </Text>
            <View style={styles.hashtagsGrid}>
              {post.hashtags.map((h, i) => (
                <View
                  key={i}
                  style={[styles.hashtagChip, { backgroundColor: colors.muted, borderRadius: radius.full }]}
                >
                  <Text style={[textStyles.bodySmall, { color: colors.foreground }]}>
                    {formatHashtagForDisplay(h)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
  isLast?: boolean;
}> = ({ label, value, colors, highlight, isLast }) => (
  <View
    style={[
      styles.infoRow,
      {
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
    ]}
  >
    <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>{label}</Text>
    <Text
      style={[
        textStyles.body,
        { color: highlight ? colors.primary : colors.foreground, fontWeight: '600' },
      ]}
    >
      {value}
    </Text>
  </View>
);

const MetricCell: React.FC<{ label: string; value?: number; colors: any }> = ({ label, value, colors }) => {
  if (value == null) return null;
  return (
    <View style={styles.metricCell}>
      <Text style={[textStyles.h4, { color: colors.foreground }]}>{formatNumber(value)}</Text>
      <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  content: {
    padding: spacing[4],
  },
  card: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  media: {
    width: '100%',
    height: 300,
    borderRadius: radius.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCell: {
    width: '50%',
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  hashtagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  hashtagChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
});

export default PostDetailScreen;
