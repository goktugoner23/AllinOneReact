import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store';
import { fetchInstagramAnalytics, clearError } from '@features/instagram/store/instagramSlice';
import { formatNumber, getErrorMessage } from '@features/instagram/utils/instagramHelpers';
import { useAppTheme, textStyles, spacing, radius } from '@shared/theme';
import { Button } from '@shared/components/ui';

const InsightsTab: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { data: analytics, loading } = useSelector((state: RootState) => state.instagram.analytics);

  useEffect(() => {
    if (!analytics) {
      dispatch(fetchInstagramAnalytics());
    }
  }, [dispatch, analytics]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchInstagramAnalytics());
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(clearError('analytics'));
    dispatch(fetchInstagramAnalytics());
  }, [dispatch]);

  if (loading.isLoading && !analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.foregroundMuted, marginTop: spacing[3] }]}>
          Loading insights...
        </Text>
      </View>
    );
  }

  if (loading.error && !analytics) {
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

  if (!analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[textStyles.h4, { color: colors.foreground }]}>No Data</Text>
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
          Pull to refresh
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading.isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Account Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
        <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
          Account
        </Text>
        <Text style={[textStyles.h3, { color: colors.primary }]}>@{analytics.account.username}</Text>
        {analytics.account.name && (
          <Text style={[textStyles.body, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
            {analytics.account.name}
          </Text>
        )}

        <View style={[styles.statsRow, { marginTop: spacing[4] }]}>
          <StatItem label="Followers" value={formatNumber(analytics.account.followersCount)} colors={colors} />
          <StatItem label="Following" value={formatNumber(analytics.account.followsCount)} colors={colors} />
          <StatItem label="Posts" value={formatNumber(analytics.account.mediaCount)} colors={colors} />
        </View>
      </View>

      {/* Performance Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
        <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
          Performance
        </Text>
        <View style={styles.statsRow}>
          <StatItem label="Total Posts" value={analytics.summary.totalPosts.toString()} colors={colors} />
          <StatItem
            label="Engagement"
            value={formatNumber(analytics.summary.totalEngagement)}
            colors={colors}
          />
          <StatItem
            label="Avg Rate"
            value={`${analytics.summary.avgEngagementRate.toFixed(1)}%`}
            colors={colors}
            highlight
          />
        </View>
      </View>

      {/* Top Post */}
      {analytics.summary.topPerformingPost && (
        <View style={[styles.card, { backgroundColor: colors.primaryMuted, borderRadius: radius.lg }]}>
          <Text style={[textStyles.label, { color: colors.primary, marginBottom: spacing[2] }]}>Top Post</Text>
          <Text style={[textStyles.body, { color: colors.foreground }]} numberOfLines={2}>
            {analytics.summary.topPerformingPost.caption}
          </Text>
          <View style={[styles.statsRow, { marginTop: spacing[3] }]}>
            <StatItem
              label="Engagement"
              value={`${analytics.summary.topPerformingPost.metrics.engagementRate.toFixed(1)}%`}
              colors={colors}
              highlight
            />
            <StatItem
              label="Interactions"
              value={formatNumber(analytics.summary.topPerformingPost.metrics.totalInteractions)}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* Detailed Metrics */}
      {analytics.summary.detailedMetrics && (
        <>
          {/* Totals */}
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
              Totals
            </Text>
            <MetricRow label="Likes" value={formatNumber(analytics.summary.detailedMetrics.totals.totalLikes)} colors={colors} />
            <MetricRow label="Comments" value={formatNumber(analytics.summary.detailedMetrics.totals.totalComments)} colors={colors} />
            <MetricRow label="Shares" value={formatNumber(analytics.summary.detailedMetrics.totals.totalShares)} colors={colors} />
            <MetricRow label="Reach" value={formatNumber(analytics.summary.detailedMetrics.totals.totalReach)} colors={colors} isLast />
          </View>

          {/* Averages */}
          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
              Averages
            </Text>
            <MetricRow label="Likes" value={formatNumber(analytics.summary.detailedMetrics.averages.avgLikes)} colors={colors} />
            <MetricRow label="Comments" value={formatNumber(analytics.summary.detailedMetrics.averages.avgComments)} colors={colors} />
            <MetricRow label="Engagement" value={`${analytics.summary.detailedMetrics.averages.avgEngagementRate.toFixed(1)}%`} colors={colors} />
            <MetricRow label="Reach" value={formatNumber(analytics.summary.detailedMetrics.averages.avgReach)} colors={colors} isLast />
          </View>
        </>
      )}

      {/* Growth */}
      {analytics.summary.recentGrowth && (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[3] }]}>
            Growth
          </Text>
          <View style={styles.growthRow}>
            <GrowthItem
              label="Engagement"
              value={analytics.summary.recentGrowth.engagement}
              colors={colors}
            />
            <GrowthItem label="Reach" value={analytics.summary.recentGrowth.reach} colors={colors} />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const StatItem: React.FC<{ label: string; value: string; colors: any; highlight?: boolean }> = ({
  label,
  value,
  colors,
  highlight,
}) => (
  <View style={styles.statItem}>
    <Text
      style={[
        textStyles.h4,
        { color: highlight ? colors.primary : colors.foreground, textAlign: 'center' },
      ]}
    >
      {value}
    </Text>
    <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>{label}</Text>
  </View>
);

const MetricRow: React.FC<{ label: string; value: string; colors: any; isLast?: boolean }> = ({
  label,
  value,
  colors,
  isLast,
}) => (
  <View
    style={[
      styles.metricRow,
      {
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
    ]}
  >
    <Text style={[textStyles.body, { color: colors.foregroundMuted }]}>{label}</Text>
    <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>{value}</Text>
  </View>
);

const GrowthItem: React.FC<{ label: string; value: number; colors: any }> = ({ label, value, colors }) => {
  const isPositive = value >= 0;
  return (
    <View style={styles.growthItem}>
      <Text
        style={[
          textStyles.h3,
          { color: isPositive ? colors.success : colors.destructive, textAlign: 'center' },
        ]}
      >
        {isPositive ? '+' : ''}
        {value.toFixed(1)}%
      </Text>
      <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[20],
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
  card: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  growthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  growthItem: {
    alignItems: 'center',
    flex: 1,
  },
});

export default InsightsTab;
