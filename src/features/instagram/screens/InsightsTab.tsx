import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store';
import { fetchInstagramAnalytics, clearError } from '@features/instagram/store/instagramSlice';
import { formatNumber, getErrorMessage } from '@features/instagram/utils/instagramHelpers';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

const InsightsTab: React.FC = () => {
  const colors = useColors();
  const dispatch = useDispatch<AppDispatch>();

  const { data: analytics, loading } = useSelector((state: RootState) => state.instagram.analytics);

  // Load analytics on mount
  useEffect(() => {
    if (!analytics) {
      dispatch(fetchInstagramAnalytics());
    }
  }, [dispatch, analytics]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchInstagramAnalytics());
  }, [dispatch]);

  // Handle retry
  const handleRetry = useCallback(() => {
    dispatch(clearError('analytics'));
    dispatch(fetchInstagramAnalytics());
  }, [dispatch]);

  // Render loading state
  if (loading.isLoading && !analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>Loading Instagram analytics...</Text>
      </View>
    );
  }

  // Render error state
  if (loading.error && !analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{getErrorMessage(loading.error)}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRetry}
          style={styles.retryButton}
          iconColor={colors.primary}
        />
        <Text style={[styles.retryText, { color: colors.foreground }]}>Tap to retry</Text>
      </View>
    );
  }

  // Render empty state
  if (!analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.foreground }]}>No analytics data available</Text>
        <Text style={[styles.emptySubtext, { color: colors.foregroundMuted }]}>Pull down to refresh</Text>
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
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Account Overview */}
      <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
        <Card.Title
          title="Account Overview"
          titleStyle={[textStyles.h4, { color: colors.foreground }]}
          left={(props) => <IconButton {...props} icon="account-circle" iconColor={colors.primary} />}
        />
        <Card.Content>
          <View style={styles.accountInfo}>
            <Text style={[styles.username, { color: colors.primary }]}>@{analytics.account.username}</Text>
            {analytics.account.name && (
              <Text style={[styles.accountName, { color: colors.foreground }]}>{analytics.account.name}</Text>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>
                {formatNumber(analytics.account.followersCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>
                {formatNumber(analytics.account.followsCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.foreground }]}>
                {formatNumber(analytics.account.mediaCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>Posts</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Summary Stats */}
      <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
        <Card.Title
          title="Performance Summary"
          titleStyle={[textStyles.h4, { color: colors.foreground }]}
          left={(props) => <IconButton {...props} icon="chart-line" iconColor={colors.primary} />}
        />
        <Card.Content>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.primary }]}>{analytics.summary.totalPosts}</Text>
              <Text style={[styles.summaryLabel, { color: colors.foregroundMuted }]}>Total Posts</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.primary }]}>
                {formatNumber(analytics.summary.totalEngagement)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.foregroundMuted }]}>Total Engagement</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.primary }]}>
                {analytics.summary.avgEngagementRate.toFixed(1)}%
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.foregroundMuted }]}>Avg Engagement Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top Performing Post */}
      {analytics.summary.topPerformingPost && (
        <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
          <Card.Title
            title="Top Performing Post"
            titleStyle={[textStyles.h4, { color: colors.foreground }]}
            left={(props) => <IconButton {...props} icon="trophy" iconColor={colors.warning} />}
          />
          <Card.Content>
            <Text style={[styles.topPostCaption, { color: colors.foreground }]} numberOfLines={3}>
              {analytics.summary.topPerformingPost.caption}
            </Text>
            <View style={styles.topPostMetrics}>
              <View style={styles.topPostMetric}>
                <Text style={[styles.topPostNumber, { color: colors.primary }]}>
                  {analytics.summary.topPerformingPost.metrics.engagementRate.toFixed(1)}%
                </Text>
                <Text style={[styles.topPostLabel, { color: colors.foregroundMuted }]}>Engagement Rate</Text>
              </View>
              <View style={styles.topPostMetric}>
                <Text style={[styles.topPostNumber, { color: colors.primary }]}>
                  {formatNumber(analytics.summary.topPerformingPost.metrics.totalInteractions)}
                </Text>
                <Text style={[styles.topPostLabel, { color: colors.foregroundMuted }]}>Total Interactions</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Detailed Metrics */}
      {analytics.summary.detailedMetrics && (
        <>
          {/* Totals */}
          <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
            <Card.Title
              title="Total Metrics"
              titleStyle={[textStyles.h4, { color: colors.foreground }]}
              left={(props) => <IconButton {...props} icon="sigma" iconColor={colors.primary} />}
            />
            <Card.Content>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalLikes)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Likes</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalComments)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Comments</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalShares)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Shares</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalReach)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Reach</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Averages */}
          <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
            <Card.Title
              title="Average Metrics"
              titleStyle={[textStyles.h4, { color: colors.foreground }]}
              left={(props) => <IconButton {...props} icon="calculator" iconColor={colors.primary} />}
            />
            <Card.Content>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgLikes)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Avg Likes</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgComments)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Avg Comments</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {analytics.summary.detailedMetrics.averages.avgEngagementRate.toFixed(1)}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Avg Engagement</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: colors.foreground }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgReach)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.foregroundMuted }]}>Avg Reach</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Recent Growth */}
      {analytics.summary.recentGrowth && (
        <Card style={[styles.card, { backgroundColor: colors.surface }, shadow.md]}>
          <Card.Title
            title="Recent Growth"
            titleStyle={[textStyles.h4, { color: colors.foreground }]}
            left={(props) => <IconButton {...props} icon="trending-up" iconColor={colors.success} />}
          />
          <Card.Content>
            <View style={styles.growthRow}>
              <View style={styles.growthItem}>
                <Text
                  style={[
                    styles.growthNumber,
                    { color: analytics.summary.recentGrowth.engagement >= 0 ? colors.success : colors.destructive },
                  ]}
                >
                  {analytics.summary.recentGrowth.engagement >= 0 ? '+' : ''}
                  {analytics.summary.recentGrowth.engagement.toFixed(1)}%
                </Text>
                <Text style={[styles.growthLabel, { color: colors.foregroundMuted }]}>Engagement Growth</Text>
              </View>
              <View style={styles.growthItem}>
                <Text
                  style={[
                    styles.growthNumber,
                    { color: analytics.summary.recentGrowth.reach >= 0 ? colors.success : colors.destructive },
                  ]}
                >
                  {analytics.summary.recentGrowth.reach >= 0 ? '+' : ''}
                  {analytics.summary.recentGrowth.reach.toFixed(1)}%
                </Text>
                <Text style={[styles.growthLabel, { color: colors.foregroundMuted }]}>Reach Growth</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

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
  card: {
    margin: spacing[4],
    marginBottom: spacing[2],
    borderRadius: radius.lg,
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
  accountInfo: {
    marginBottom: spacing[4],
  },
  username: {
    ...textStyles.h4,
    marginBottom: spacing[1],
  },
  accountName: {
    ...textStyles.body,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...textStyles.h4,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...textStyles.caption,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    ...textStyles.h4,
    marginBottom: spacing[1],
  },
  summaryLabel: {
    ...textStyles.caption,
    textAlign: 'center',
  },
  topPostCaption: {
    ...textStyles.bodySmall,
    marginBottom: spacing[3],
  },
  topPostMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  topPostMetric: {
    alignItems: 'center',
  },
  topPostNumber: {
    ...textStyles.label,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  topPostLabel: {
    ...textStyles.caption,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing[4],
  },
  metricNumber: {
    ...textStyles.label,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  metricLabel: {
    ...textStyles.caption,
    textAlign: 'center',
  },
  growthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  growthItem: {
    alignItems: 'center',
  },
  growthNumber: {
    ...textStyles.h4,
    marginBottom: spacing[1],
  },
  growthLabel: {
    ...textStyles.caption,
  },
});

export default InsightsTab;
