import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { Appbar, Text, useTheme, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInstagramAllData } from '@shared/hooks';
import {
  Card,
  CardContent,
  Avatar,
  Button,
  Badge,
  Skeleton,
  SkeletonCard,
  Tabs,
  LinearProgressBar,
} from '@shared/components/ui';
import {
  InstagramProfilePictureResponse,
  InstagramStoryItem,
  InstagramUserPost,
} from '@features/instagram/types/Instagram';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import * as CameraRollModule from '@react-native-camera-roll/camera-roll';
import { cacheMedia } from '@shared/services/mediaCache';
import Video from 'react-native-video';
import InstagramImage from '@features/instagram/components/InstagramImage';

type RouteParams = { username: string };

export default function ProfileDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { username } = (route.params || {}) as RouteParams;

  // TanStack Query for data fetching
  const { data: allData, isLoading, isFetching, error, refetch } = useInstagramAllData(username);

  // Derived data from query
  const profile: InstagramProfilePictureResponse | null = useMemo(() => {
    if (!allData?.success || !allData.data.profile) return null;
    return {
      success: allData.status.profile,
      data: allData.data.profile,
    };
  }, [allData]);

  const stories: InstagramStoryItem[] = useMemo(() => {
    if (!allData?.data?.stories) return [];
    return [...allData.data.stories].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
  }, [allData]);

  const posts: InstagramUserPost[] = useMemo(() => {
    return allData?.data?.posts || [];
  }, [allData]);

  // Local UI state
  const [activeTab, setActiveTab] = useState<'stories' | 'posts'>('stories');
  const [layout, setLayout] = useState<'timeline' | 'grid'>('grid');
  const [preview, setPreview] = useState<{ item: InstagramStoryItem; localUri?: string } | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewerWidth, setViewerWidth] = useState(0);
  const previewListRef = useRef<FlatList<InstagramStoryItem>>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [pfpVisible, setPfpVisible] = useState(false);
  const [bulkVisible, setBulkVisible] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  // Derive error message
  const errorMessage = useMemo(() => {
    if (!error) return null;
    const is404Error =
      (error as any)?.response?.status === 404 ||
      (error as any)?.code === 'ERR_BAD_REQUEST' ||
      (error as Error)?.message?.includes('404') ||
      (error as Error)?.message?.includes('Request failed');
    return is404Error ? 'User not found or not accessible' : 'Failed to load profile data';
  }, [error]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Scroll to the correct story index when the modal becomes visible
  useEffect(() => {
    if (preview && previewListRef.current && viewerWidth > 0) {
      const timer = setTimeout(() => {
        try {
          previewListRef.current?.scrollToIndex({
            index: previewIndex,
            animated: false,
          });
        } catch (scrollError) {
          const offset = previewIndex * viewerWidth;
          previewListRef.current?.scrollToOffset({
            offset,
            animated: false,
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [preview, previewIndex, viewerWidth]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleOpenStory = useCallback(
    async (item: InstagramStoryItem) => {
      try {
        const local = await cacheMedia(item.mediaUrl, item.mediaType === 'VIDEO' ? '.mp4' : '.jpg');
        const idx = stories.findIndex((s) => s.id === item.id);
        if (idx >= 0) {
          setPreviewIndex(idx);
          setPreview({ item, localUri: local });
        }
      } catch (_) {
        const idx = stories.findIndex((s) => s.id === item.id);
        if (idx >= 0) {
          setPreviewIndex(idx);
          setPreview({ item });
        }
      }
    },
    [stories],
  );

  const saveStoryToGallery = useCallback(async (item: InstagramStoryItem) => {
    try {
      const isVideo = item.mediaType === 'VIDEO';
      const local = await cacheMedia(item.mediaUrl, isVideo ? '.mp4' : '.jpg');
      const fileUri = local.startsWith('file://') ? local : `file://${local}`;
      const albumName = 'AllInOne Instagram';

      if (Platform.OS === 'android') {
        try {
          if (Platform.Version >= 33) {
            const result = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]);
            const imagesGranted =
              result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
            const videosGranted =
              result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED;
            if (!(imagesGranted && videosGranted)) {
              throw new Error('Permission denied');
            }
          } else {
            const writeGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            );
            if (writeGranted !== PermissionsAndroid.RESULTS.GRANTED) {
              throw new Error('Permission denied');
            }
          }
        } catch (_) {}
      }

      const CameraRollAny: any =
        (CameraRollModule as any)?.default || (CameraRollModule as any)?.CameraRoll || (CameraRollModule as any);
      if (CameraRollAny && typeof CameraRollAny.save === 'function') {
        await CameraRollAny.save(fileUri, { type: isVideo ? 'video' : 'photo', album: albumName });
      } else {
        if (Platform.OS === 'android') {
          const baseDir = RNFS.PicturesDirectoryPath || RNFS.DownloadDirectoryPath;
          const targetDir = `${baseDir}/AllInOne/Instagram`;
          await RNFS.mkdir(targetDir);
          const dest = `${targetDir}/ig_story_${Date.now()}${isVideo ? '.mp4' : '.jpg'}`;
          const pathNoScheme = fileUri.replace('file://', '');
          await RNFS.copyFile(pathNoScheme, dest);
          if ((RNFS as any).scanFile) {
            await (RNFS as any).scanFile([{ path: dest, mime: isVideo ? 'video/mp4' : 'image/jpeg' }]);
          }
        } else {
          await Share.open({ url: fileUri, type: isVideo ? 'video/mp4' : 'image/jpeg', saveToFiles: true });
        }
      }
      return fileUri;
    } catch (e) {
      throw e;
    }
  }, []);

  const handleDownload = useCallback(
    (item: InstagramStoryItem) => {
      Alert.alert('Save to Gallery', 'Do you want to save this story to your device gallery?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              await saveStoryToGallery(item);
              Alert.alert('Saved', 'Story saved to your device gallery.');
            } catch (err: any) {
              const msg = typeof err?.message === 'string' ? err.message : '';
              Alert.alert('Save failed', `Could not save the story to gallery.${msg ? `\n\n${msg}` : ''}`);
            }
          },
        },
      ]);
    },
    [saveStoryToGallery],
  );

  const handleDownloadAll = useCallback(() => {
    if (!stories.length || downloadingAll) return;
    Alert.alert('Download All Stories', `Save all ${stories.length} stories to your gallery?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Download',
        onPress: async () => {
          try {
            setDownloadingAll(true);
            setBulkVisible(true);
            setBulkTotal(stories.length);
            setBulkDone(0);
            let success = 0;
            for (const s of stories) {
              try {
                await saveStoryToGallery(s);
                success += 1;
                setBulkDone((d) => d + 1);
              } catch (_) {}
            }
            setBulkVisible(false);
            Alert.alert('Completed', `${success}/${stories.length} saved to gallery.`);
          } catch (_) {
            setBulkVisible(false);
            Alert.alert('Download failed', 'Could not save all stories.');
          } finally {
            setDownloadingAll(false);
          }
        },
      },
    ]);
  }, [stories, downloadingAll, saveStoryToGallery]);

  const handleDownloadProfilePicture = useCallback(async () => {
    try {
      if (!profile?.data?.imageUrl) return;
      const tempItem: InstagramStoryItem = {
        id: `pfp_${username}`,
        mediaType: 'IMAGE',
        mediaUrl: profile.data.imageUrl,
      };
      await saveStoryToGallery(tempItem);
      Alert.alert('Saved', 'Profile picture saved to your device gallery.');
    } catch (_) {
      Alert.alert('Save failed', 'Could not save the profile picture.');
    }
  }, [profile?.data?.imageUrl, username, saveStoryToGallery]);

  const handleOpenProfilePicture = useCallback(() => {
    if (profile?.data?.imageUrl) {
      setPfpVisible(true);
    }
  }, [profile?.data?.imageUrl]);

  // Tab configuration
  const tabs = useMemo(
    () => [
      { key: 'stories', label: 'Stories', badge: stories.length > 0 ? stories.length : undefined },
      { key: 'posts', label: 'Posts', badge: posts.length > 0 ? posts.length : undefined },
    ],
    [stories.length, posts.length],
  );

  // Memoized renderers
  const renderGridItem = useCallback(
    ({ item }: { item: InstagramStoryItem }) => (
      <TouchableOpacity style={styles.gridItem} onPress={() => handleOpenStory(item)}>
        <View style={styles.thumbWrapper} pointerEvents="none">
          {item.mediaType === 'VIDEO' ? (
            <Video source={{ uri: item.mediaUrl }} style={styles.gridThumb} resizeMode="cover" muted paused />
          ) : (
            <InstagramImage
              instagramUrl={item.mediaUrl}
              style={styles.gridThumb}
              onError={(url) => console.warn('Failed to load grid story image:', url)}
            />
          )}
          {item.mediaType === 'VIDEO' && (
            <View style={styles.playBadge}>
              <Text style={styles.playBadgeText}>Play</Text>
            </View>
          )}
        </View>
        <Button size="sm" variant="ghost" onPress={() => handleDownload(item)}>
          Save
        </Button>
      </TouchableOpacity>
    ),
    [handleOpenStory, handleDownload],
  );

  const renderRowItem = useCallback(
    ({ item }: { item: InstagramStoryItem }) => (
      <FeedStoryCard
        item={item}
        onOpen={() => handleOpenStory(item)}
        onDownload={() => handleDownload(item)}
        avatarUrl={profile?.data?.imageUrl}
        username={username}
      />
    ),
    [handleOpenStory, handleDownload, profile?.data?.imageUrl, username],
  );

  const renderPostGridItem = useCallback(({ item }: { item: InstagramUserPost }) => {
    const imageUrl = item.thumbnailUrl || item.mediaUrl || (item as any).thumbnail_url || (item as any).media_url;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          Linking.openURL(item.permalink);
        }}
      >
        <View style={styles.thumbWrapper} pointerEvents="none">
          {imageUrl ? (
            item.mediaType === 'VIDEO' ? (
              <Video source={{ uri: imageUrl }} style={styles.gridThumb} resizeMode="cover" muted paused />
            ) : (
              <InstagramImage instagramUrl={imageUrl} style={styles.gridThumb} />
            )
          ) : (
            <View
              style={[styles.gridThumb, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={{ fontSize: 10, color: '#666' }}>No Image</Text>
            </View>
          )}
          {item.mediaType === 'VIDEO' && (
            <View style={styles.playBadge}>
              <Text style={styles.playBadgeText}>Play</Text>
            </View>
          )}
          {item.mediaType === 'CAROUSEL_ALBUM' && (
            <View style={styles.carouselBadge}>
              <Text style={styles.playBadgeText}>Album</Text>
            </View>
          )}
        </View>
        <View style={styles.postStats}>
          {item.likesCount !== undefined && (
            <Badge variant="default" size="sm">
              {item.likesCount} likes
            </Badge>
          )}
          {item.commentsCount !== undefined && (
            <Badge variant="default" size="sm">
              {item.commentsCount} comments
            </Badge>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderPostRowItem = useCallback(
    ({ item }: { item: InstagramUserPost }) => (
      <FeedPostCard item={item} avatarUrl={profile?.data?.imageUrl} username={username} />
    ),
    [profile?.data?.imageUrl, username],
  );

  // Skeleton loading state
  const renderLoadingState = () => (
    <View style={styles.center}>
      <SkeletonCard />
      <View style={{ marginTop: 16 }}>
        <Skeleton width="100%" height={200} variant="rectangular" />
      </View>
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
        <Skeleton width={100} height={100} variant="rectangular" />
        <Skeleton width={100} height={100} variant="rectangular" />
        <Skeleton width={100} height={100} variant="rectangular" />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="small" elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`@${username}`} />
      </Appbar.Header>

      <LinearProgressBar visible={isLoading || isFetching} />

      {isLoading && stories.length === 0 ? (
        renderLoadingState()
      ) : errorMessage ? (
        <View style={[styles.center, { padding: 24 }]}>
          <Card variant="outlined" padding="lg">
            <CardContent>
              <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
                {errorMessage}
              </Text>
              <Button variant="primary" onPress={handleRefresh}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </View>
      ) : (
        <>
          {/* Tab Bar using reusable Tabs component */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as 'stories' | 'posts')}
            variant="underlined"
            fullWidth
          />

          {/* Profile Header */}
          <Card variant="filled" padding="md" style={styles.headerBox}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleOpenProfilePicture} activeOpacity={0.7}>
                <Avatar
                  source={profile?.data?.imageUrl ? { uri: profile.data.imageUrl } : undefined}
                  name={username}
                  size="xl"
                />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text variant="titleMedium">@{username}</Text>
                {!!profile?.data?.fullName && (
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {profile.data.fullName}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Badge variant={activeTab === 'stories' ? 'info' : 'default'} size="sm">
                    {stories.length} stories
                  </Badge>
                  <Badge variant={activeTab === 'posts' ? 'info' : 'default'} size="sm">
                    {posts.length} posts
                  </Badge>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.layoutButtons}>
                <Button variant={layout === 'grid' ? 'primary' : 'ghost'} size="sm" onPress={() => setLayout('grid')}>
                  Grid
                </Button>
                <Button
                  variant={layout === 'timeline' ? 'primary' : 'ghost'}
                  size="sm"
                  onPress={() => setLayout('timeline')}
                >
                  List
                </Button>
              </View>
              <Button
                variant="primary"
                size="sm"
                loading={downloadingAll}
                disabled={downloadingAll || stories.length === 0}
                onPress={handleDownloadAll}
              >
                Download All
              </Button>
            </View>
          </Card>

          {/* Content Area - Stories or Posts */}
          {activeTab === 'stories' ? (
            layout === 'grid' ? (
              <FlatList
                key="grid-stories"
                data={stories}
                keyExtractor={(i) => i.id}
                numColumns={3}
                contentContainerStyle={{ padding: 8 }}
                columnWrapperStyle={{ gap: 8 }}
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
                removeClippedSubviews
                windowSize={5}
                maxToRenderPerBatch={9}
                initialNumToRender={12}
                renderItem={renderGridItem}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Text style={{ opacity: 0.6 }}>No stories available</Text>
                  </View>
                )}
              />
            ) : (
              <FlatList
                key="timeline-stories"
                data={stories}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ padding: 12 }}
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
                removeClippedSubviews
                windowSize={7}
                maxToRenderPerBatch={7}
                initialNumToRender={10}
                renderItem={renderRowItem}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Text style={{ opacity: 0.6 }}>No stories available</Text>
                  </View>
                )}
              />
            )
          ) : layout === 'grid' ? (
            <FlatList
              key="grid-posts"
              data={posts}
              keyExtractor={(i) => i.id}
              numColumns={3}
              contentContainerStyle={{ padding: 8 }}
              columnWrapperStyle={{ gap: 8 }}
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
              removeClippedSubviews
              windowSize={5}
              maxToRenderPerBatch={9}
              initialNumToRender={12}
              renderItem={renderPostGridItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={{ opacity: 0.6 }}>No posts available</Text>
                </View>
              )}
            />
          ) : (
            <FlatList
              key="timeline-posts"
              data={posts}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />}
              removeClippedSubviews
              windowSize={7}
              maxToRenderPerBatch={7}
              initialNumToRender={10}
              renderItem={renderPostRowItem}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={{ opacity: 0.6 }}>No posts available</Text>
                </View>
              )}
            />
          )}

          {/* Story Preview Modal */}
          <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
            <View style={styles.modalBackdrop}>
              <View
                style={[styles.viewer, { backgroundColor: theme.colors.surface }]}
                onLayout={(e) => setViewerWidth(e.nativeEvent.layout.width)}
              >
                {viewerWidth > 0 && (
                  <FlatList
                    ref={previewListRef}
                    data={stories}
                    horizontal
                    key={String(viewerWidth)}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    decelerationRate="fast"
                    keyExtractor={(i) => i.id}
                    getItemLayout={(data, index) => ({ length: viewerWidth, offset: viewerWidth * index, index })}
                    snapToInterval={viewerWidth}
                    onMomentumScrollEnd={(e) => {
                      const page = viewerWidth || 1;
                      const i = Math.round((e.nativeEvent.contentOffset.x || 0) / page);
                      if (!Number.isNaN(i)) setPreviewIndex(i);
                    }}
                    renderItem={({ item }) => {
                      const isVideo = item.mediaType === 'VIDEO';
                      const uri = item.mediaUrl;
                      const width = viewerWidth || 1;
                      return (
                        <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                          {isVideo ? (
                            <Video source={{ uri }} style={styles.player} controls resizeMode="contain" paused={true} />
                          ) : (
                            <InstagramImage instagramUrl={uri} style={styles.player} resizeMode="contain" />
                          )}
                        </View>
                      );
                    }}
                  />
                )}
                <View style={styles.viewerActions}>
                  <Button variant="primary" onPress={() => handleDownload(stories[previewIndex])}>
                    Download
                  </Button>
                  <Button variant="ghost" onPress={() => setPreview(null)}>
                    Close
                  </Button>
                </View>
              </View>
            </View>
          </Modal>

          {/* Bulk Download Progress Modal */}
          <Modal visible={bulkVisible} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={styles.modalBackdrop}>
              <Card variant="elevated" padding="lg" style={styles.bulkModal}>
                <CardContent>
                  <Text variant="titleMedium" style={{ marginBottom: 12, textAlign: 'center' }}>
                    Saving stories...
                  </Text>
                  <ProgressBar
                    progress={bulkTotal ? bulkDone / bulkTotal : 0}
                    color={theme.colors.primary}
                    style={{ height: 8, borderRadius: 4 }}
                  />
                  <Text style={{ marginTop: 8, textAlign: 'center' }}>
                    {bulkDone}/{bulkTotal}
                  </Text>
                </CardContent>
              </Card>
            </View>
          </Modal>

          {/* Profile Picture Modal */}
          <Modal visible={pfpVisible} transparent animationType="fade" onRequestClose={() => setPfpVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]}>
                {profile?.data?.imageUrl && (
                  <InstagramImage instagramUrl={profile.data.imageUrl} style={styles.player} resizeMode="contain" />
                )}
                <View style={styles.viewerActions}>
                  <Button variant="primary" onPress={handleDownloadProfilePicture}>
                    Download
                  </Button>
                  <Button variant="ghost" onPress={() => setPfpVisible(false)}>
                    Close
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

// Feed Story Card Component
function FeedStoryCard({
  item,
  onOpen,
  onDownload,
  avatarUrl,
  username,
}: {
  item: InstagramStoryItem;
  onOpen: () => void;
  onDownload: () => void;
  avatarUrl?: string;
  username: string;
}) {
  const theme = useTheme();
  const isVideo = item.mediaType === 'VIDEO';

  return (
    <Card variant="elevated" padding="none" style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <Avatar source={avatarUrl ? { uri: avatarUrl } : undefined} name={username} size="md" />
        <Text variant="titleSmall" style={{ marginLeft: 8 }}>
          @{username}
        </Text>
        <View style={{ marginLeft: 'auto' }}>
          <Button size="sm" variant="ghost" onPress={onDownload}>
            Save
          </Button>
        </View>
      </View>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.8}>
        <View pointerEvents="none">
          {isVideo ? (
            <Video source={{ uri: item.mediaUrl }} style={styles.feedMedia} resizeMode="cover" paused muted />
          ) : (
            <InstagramImage instagramUrl={item.mediaUrl} style={styles.feedMedia} resizeMode="cover" />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.feedFooter}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Badge variant={isVideo ? 'info' : 'default'} size="sm">
            {item.mediaType}
          </Badge>
        </View>
        {!!item.timestamp && (
          <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 4 }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    </Card>
  );
}

// Feed Post Card Component
function FeedPostCard({
  item,
  avatarUrl,
  username,
}: {
  item: InstagramUserPost;
  avatarUrl?: string;
  username: string;
}) {
  const theme = useTheme();
  const isVideo = item.mediaType === 'VIDEO';
  const imageUrl = item.thumbnailUrl || item.mediaUrl || (item as any).thumbnail_url || (item as any).media_url;

  return (
    <Card variant="elevated" padding="none" style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <Avatar source={avatarUrl ? { uri: avatarUrl } : undefined} name={username} size="md" />
        <Text variant="titleSmall" style={{ marginLeft: 8 }}>
          @{username}
        </Text>
        <View style={{ marginLeft: 'auto' }}>
          <Button size="sm" variant="ghost" onPress={() => Linking.openURL(item.permalink)}>
            View
          </Button>
        </View>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(item.permalink)} activeOpacity={0.8}>
        <View pointerEvents="none">
          {isVideo ? (
            <Video source={{ uri: imageUrl }} style={styles.feedMedia} resizeMode="cover" paused muted />
          ) : (
            <InstagramImage instagramUrl={imageUrl} style={styles.feedMedia} resizeMode="cover" />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.feedFooter}>
        {item.caption && (
          <Text variant="bodyMedium" numberOfLines={3} style={{ marginBottom: 8 }}>
            {item.caption}
          </Text>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {item.likesCount !== undefined && (
            <Badge variant="default" size="sm">
              {item.likesCount} likes
            </Badge>
          )}
          {item.commentsCount !== undefined && (
            <Badge variant="default" size="sm">
              {item.commentsCount} comments
            </Badge>
          )}
          {item.videoViewsCount !== undefined && (
            <Badge variant="info" size="sm">
              {item.videoViewsCount} views
            </Badge>
          )}
        </View>
        {!!item.timestamp && (
          <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 8 }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  headerBox: { margin: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { gap: 2 },
  layoutButtons: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, marginBottom: 8 },
  gridThumb: { width: '100%', height: '75%', borderRadius: 8 },
  thumbWrapper: { width: '100%', height: '75%', borderRadius: 8, overflow: 'hidden' },
  playBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playBadgeText: { color: '#fff', fontSize: 10 },
  carouselBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postStats: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  viewer: { width: '90%', height: '70%', borderRadius: 12, overflow: 'hidden', padding: 8 },
  bulkModal: { width: '80%' },
  player: { width: '100%', height: '85%', borderRadius: 8, backgroundColor: 'black' },
  viewerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8 },
  feedCard: { marginBottom: 16, overflow: 'hidden' },
  feedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  feedMedia: { width: '100%', height: 380, backgroundColor: '#000' },
  feedFooter: { paddingHorizontal: 12, paddingVertical: 10 },
});
