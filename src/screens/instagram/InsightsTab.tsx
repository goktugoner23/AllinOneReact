import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchInstagramAnalytics, clearError } from '../../store/instagramSlice';
import { formatNumber, getErrorMessage } from '../../utils/instagramHelpers';

const InsightsTab: React.FC = () => {
  const theme = useTheme();
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
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading Instagram analytics...
        </Text>
      </View>
    );
  }

  // Render error state
  if (loading.error && !analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {getErrorMessage(loading.error)}
        </Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRetry}
          style={styles.retryButton}
        />
        <Text style={[styles.retryText, { color: theme.colors.onBackground }]}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Render empty state
  if (!analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
          No analytics data available
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
          Pull down to refresh
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading.isLoading}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Account Overview */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Account Overview"
          titleStyle={{ color: theme.colors.onSurface }}
          left={(props) => <IconButton {...props} icon="account-circle" />}
        />
        <Card.Content>
          <View style={styles.accountInfo}>
            <Text style={[styles.username, { color: theme.colors.primary }]}>
              @{analytics.account.username}
            </Text>
            {analytics.account.name && (
              <Text style={[styles.accountName, { color: theme.colors.onSurface }]}>
                {analytics.account.name}
              </Text>
            )}
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {formatNumber(analytics.account.followersCount)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Followers
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {formatNumber(analytics.account.followsCount)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Following
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {formatNumber(analytics.account.mediaCount)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Posts
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Summary Stats */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Performance Summary"
          titleStyle={{ color: theme.colors.onSurface }}
          left={(props) => <IconButton {...props} icon="chart-line" />}
        />
        <Card.Content>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                {analytics.summary.totalPosts}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Posts
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                {formatNumber(analytics.summary.totalEngagement)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Engagement
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.primary }]}>
                {analytics.summary.avgEngagementRate.toFixed(1)}%
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                Avg Engagement Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top Performing Post */}
      {analytics.summary.topPerformingPost && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Top Performing Post"
            titleStyle={{ color: theme.colors.onSurface }}
            left={(props) => <IconButton {...props} icon="trophy" />}
          />
          <Card.Content>
            <Text
              style={[styles.topPostCaption, { color: theme.colors.onSurface }]}
              numberOfLines={3}
            >
              {analytics.summary.topPerformingPost.caption}
            </Text>
            <View style={styles.topPostMetrics}>
              <View style={styles.topPostMetric}>
                <Text style={[styles.topPostNumber, { color: theme.colors.primary }]}>
                  {analytics.summary.topPerformingPost.metrics.engagementRate.toFixed(1)}%
                </Text>
                <Text style={[styles.topPostLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Engagement Rate
                </Text>
              </View>
              <View style={styles.topPostMetric}>
                <Text style={[styles.topPostNumber, { color: theme.colors.primary }]}>
                  {formatNumber(analytics.summary.topPerformingPost.metrics.totalInteractions)}
                </Text>
                <Text style={[styles.topPostLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Interactions
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Detailed Metrics */}
      {analytics.summary.detailedMetrics && (
        <>
          {/* Totals */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title
              title="Total Metrics"
              titleStyle={{ color: theme.colors.onSurface }}
              left={(props) => <IconButton {...props} icon="sigma" />}
            />
            <Card.Content>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalLikes)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Likes
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalComments)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Comments
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalShares)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Shares
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.totals.totalReach)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Reach
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Averages */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title
              title="Average Metrics"
              titleStyle={{ color: theme.colors.onSurface }}
              left={(props) => <IconButton {...props} icon="calculator" />}
            />
            <Card.Content>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgLikes)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Likes
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgComments)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Comments
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {analytics.summary.detailedMetrics.averages.avgEngagementRate.toFixed(1)}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Engagement
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: theme.colors.onSurface }]}>
                    {formatNumber(analytics.summary.detailedMetrics.averages.avgReach)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Reach
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Recent Growth */}
      {analytics.summary.recentGrowth && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Recent Growth"
            titleStyle={{ color: theme.colors.onSurface }}
            left={(props) => <IconButton {...props} icon="trending-up" />}
          />
          <Card.Content>
            <View style={styles.growthRow}>
              <View style={styles.growthItem}>
                <Text style={[
                  styles.growthNumber,
                  { color: analytics.summary.recentGrowth.engagement >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {analytics.summary.recentGrowth.engagement >= 0 ? '+' : ''}
                  {analytics.summary.recentGrowth.engagement.toFixed(1)}%
                </Text>
                <Text style={[styles.growthLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Engagement Growth
                </Text>
              </View>
              <View style={styles.growthItem}>
                <Text style={[
                  styles.growthNumber,
                  { color: analytics.summary.recentGrowth.reach >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {analytics.summary.recentGrowth.reach >= 0 ? '+' : ''}
                  {analytics.summary.recentGrowth.reach.toFixed(1)}%
                </Text>
                <Text style={[styles.growthLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Reach Growth
                </Text>
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
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
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
  accountInfo: {
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  topPostCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  topPostMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  topPostMetric: {
    alignItems: 'center',
  },
  topPostNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topPostLabel: {
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 12,
  },
});

export default InsightsTab;