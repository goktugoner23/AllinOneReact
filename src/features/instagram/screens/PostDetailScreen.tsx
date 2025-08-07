import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, Image } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { InstagramPost } from '@features/instagram/types/Instagram';
import { Text, Card, IconButton, useTheme, Chip, Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Params = {
  PostDetail: { post: InstagramPost };
};

const PostDetailScreen: React.FC = () => {
  const theme = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={post.username || 'Instagram Post'}
          subtitle={formattedDate}
          left={(props) => <Ionicons {...props} name="logo-instagram" size={24} color={theme.colors.primary} />}
          right={(props) => (
            <IconButton {...props} icon="open-in-new" onPress={() => Linking.openURL(post.permalink)} />
          )}
        />
        <Card.Content>
          {post.mediaUrl || post.thumbnailUrl ? (
            <Image
              source={{ uri: post.mediaUrl || post.thumbnailUrl! }}
              style={styles.media}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.rowBetween}>
            <Chip mode="outlined" icon="tag-outline" style={styles.typeChip}>{post.mediaType}</Chip>
            <Text style={[styles.engagement, { color: theme.colors.primary }]}>
              {(post.metrics.engagementRate).toFixed(1)}%
            </Text>
          </View>

          <Text style={[styles.caption, { color: theme.colors.onSurface }]}>{post.caption}</Text>

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
                <Chip key={i} mode="outlined" compact style={styles.hashtag}>#{h}</Chip>
              ))}
            </View>
          )}

          <Button
            mode="contained"
            style={styles.backBtn}
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          >
            Back
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const Metric: React.FC<{ icon: string; label: string; value?: number }> = ({ icon, label, value }) => {
  const theme = useTheme();
  if (value == null) return null;
  return (
    <View style={styles.metricItem}>
      <Ionicons name={icon} size={18} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.metricText, { color: theme.colors.onSurfaceVariant }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  media: { width: '100%', height: 260, borderRadius: 8, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeChip: { height: 26 },
  engagement: { fontSize: 18, fontWeight: 'bold' },
  caption: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  metricItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 },
  metricText: { marginLeft: 6, marginRight: 4, fontSize: 14 },
  metricLabel: { fontSize: 12 },
  hashtags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  hashtag: { marginRight: 6, marginBottom: 6, height: 26 },
  backBtn: { marginTop: 16 },
});

export default PostDetailScreen;


