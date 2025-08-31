import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Modal, Platform, Alert, RefreshControl } from 'react-native';
import { Appbar, Avatar, Button, Text, useTheme, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import instagramApiService from '@features/instagram/services/InstagramApiService';
import { InstagramProfilePictureResponse, InstagramStoriesResponse, InstagramStoryItem } from '@features/instagram/types/Instagram';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import * as CameraRollModule from '@react-native-camera-roll/camera-roll';
import { PermissionsAndroid } from 'react-native';
import { cacheMedia } from '@shared/services/mediaCache';
import Video from 'react-native-video';
import { StorageService, STORAGE_KEYS } from '@shared/services/storage/asyncStorage';
import InstagramImage from '@features/instagram/components/InstagramImage';

// Simple cache to avoid re-fetching on each open
const profileStoriesCache = new Map<string, { profile: InstagramProfilePictureResponse | null; stories: InstagramStoryItem[]; timestamp: number }>();

type RouteParams = { username: string };

export default function ProfileDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { username } = (route.params || {}) as RouteParams;

  const [profile, setProfile] = useState<InstagramProfilePictureResponse | null>(null);
  const [stories, setStories] = useState<InstagramStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'timeline' | 'grid'>('grid');
  const [preview, setPreview] = useState<{ item: InstagramStoryItem; localUri?: string } | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewerWidth, setViewerWidth] = useState(0);
  const previewListRef = useRef<FlatList<InstagramStoryItem>>(null);
  const dragStartRef = useRef<{ startOffset: number; startIndex: number }>({ startOffset: 0, startIndex: 0 });
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pfpVisible, setPfpVisible] = useState(false);
  const [bulkVisible, setBulkVisible] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const cached = profileStoriesCache.get(username) || (await StorageService.getItem<{ profile: InstagramProfilePictureResponse | null; stories: InstagramStoryItem[]; timestamp: number }>(`${STORAGE_KEYS.CACHED_DATA}:ig_stories:${username}`));
        if (cached) {
          setProfile(cached.profile);
          setStories(cached.stories);
          setLoading(false);
          return;
        }
        const [p, s] = await Promise.all([
          instagramApiService.getProfilePicture(username),
          instagramApiService.getStories(username),
        ]);
        const storiesSorted = (s?.data || []).slice().sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        setProfile(p);
        setStories(storiesSorted);
        const toCache = { profile: p, stories: storiesSorted, timestamp: Date.now() };
        profileStoriesCache.set(username, toCache);
        await StorageService.setItem(`${STORAGE_KEYS.CACHED_DATA}:ig_stories:${username}`, toCache);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load profile/stories', e);
        
        // Check for 404 error from Axios
        const is404Error = (e as any)?.response?.status === 404 || 
                          (e as any)?.code === 'ERR_BAD_REQUEST' ||
                          (e as Error)?.message?.includes('404') ||
                          (e as Error)?.message?.includes('Request failed');
        
        if (is404Error) {
          setError('User not found or not accessible');
          setProfile(null);
          setStories([]);
        } else {
          setError('Failed to load profile/stories');
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [username]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return Promise.resolve();
    setRefreshing(true);
    try {
      const [p, s] = await Promise.all([
        instagramApiService.getProfilePicture(username),
        instagramApiService.getStories(username),
      ]);
      const storiesSorted = (s?.data || []).slice().sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
      setProfile(p);
      setStories(storiesSorted);
      const toCache = { profile: p, stories: storiesSorted, timestamp: Date.now() };
      profileStoriesCache.set(username, toCache);
      await StorageService.setItem(`${STORAGE_KEYS.CACHED_DATA}:ig_stories:${username}`, toCache);
      setError(null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh profile/stories', e);
      
      // Check for 404 error from Axios
      const is404Error = (e as any)?.response?.status === 404 || 
                        (e as any)?.code === 'ERR_BAD_REQUEST' ||
                        (e as Error)?.message?.includes('404') ||
                        (e as Error)?.message?.includes('Request failed');
      
      if (is404Error) {
        setError('User not found or not accessible');
        setProfile(null);
        setStories([]);
      } else {
        setError('Failed to refresh');
      }
    } finally {
      setRefreshing(false);
    }
  }, [username, refreshing]);

  const handleOpenStory = useCallback(async (item: InstagramStoryItem) => {
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
    return Promise.resolve();
  }, [stories]);

  // Scroll to the correct story index when the modal becomes visible
  useEffect(() => {
    if (preview && previewListRef.current && viewerWidth > 0) {
      // Use setTimeout to ensure the modal is fully rendered before scrolling
      const timer = setTimeout(() => {
        try {
          previewListRef.current?.scrollToIndex({
            index: previewIndex,
            animated: false,
          });
        } catch (error) {
          // Fallback: scroll to offset if scrollToIndex fails
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

  const saveStoryToGallery = useCallback(async (item: InstagramStoryItem) => {
    try {
      const isVideo = item.mediaType === 'VIDEO';
      const local = await cacheMedia(item.mediaUrl, isVideo ? '.mp4' : '.jpg');
      const fileUri = local.startsWith('file://') ? local : `file://${local}`;
      const albumName = 'AllInOne Instagram';

      if (Platform.OS === 'android') {
        // Request permission for Android 13- (WRITE) and 13+ (READ_MEDIA_*)
        try {
          if (Platform.Version >= 33) {
            const result = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]);
            const imagesGranted = result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
            const videosGranted = result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] === PermissionsAndroid.RESULTS.GRANTED;
            if (!(imagesGranted && videosGranted)) {
              throw new Error('Permission denied');
            }
          } else {
            const writeGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
            if (writeGranted !== PermissionsAndroid.RESULTS.GRANTED) {
              throw new Error('Permission denied');
            }
          }
        } catch (_) {}
      }

      const CameraRollAny: any = (CameraRollModule as any)?.default || (CameraRollModule as any)?.CameraRoll || (CameraRollModule as any);
      if (CameraRollAny && typeof CameraRollAny.save === 'function') {
        await CameraRollAny.save(fileUri, { type: isVideo ? 'video' : 'photo', album: albumName });
      } else {
        // Fallback: copy to Pictures and scan (Android), Files share on iOS
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
      // Re-throw the error to maintain the same behavior
      throw e;
    }
  }, []);

  const handleDownload = useCallback((item: InstagramStoryItem) => {
    Alert.alert(
      'Save to Gallery',
      'Do you want to save this story to your device gallery?',
      [
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
          }
        }
      ]
    );
  }, [saveStoryToGallery]);

  const handleDownloadAll = useCallback(() => {
    if (!stories.length || downloadingAll) return;
    Alert.alert(
      'Download All Stories',
      `Save all ${stories.length} stories to your gallery?`,
      [
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
          }
        }
      ]
    );
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

  // Memoized renderers to reduce re-renders for large lists
  const renderGridItem = useCallback(({ item }: { item: InstagramStoryItem }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => handleOpenStory(item)}>
      <View style={styles.thumbWrapper} pointerEvents="none">
        {item.mediaType === 'VIDEO' ? (
          <Video
            source={{ uri: item.mediaUrl }}
            style={styles.gridThumb}
            resizeMode="cover"
            muted
            paused
          />
        ) : (
          <InstagramImage 
            instagramUrl={item.mediaUrl} 
            style={styles.gridThumb}
            onError={(url) => console.warn('Failed to load grid story image:', url)}
          />
        )}
        {item.mediaType === 'VIDEO' && (
          <View style={styles.playBadge}>
            <Text style={styles.playBadgeText}>▶</Text>
          </View>
        )}
      </View>
      <Button compact onPress={() => handleDownload(item)} style={styles.downloadBtn} icon="download">Save</Button>
    </TouchableOpacity>
  ), [handleOpenStory, handleDownload]);

  const renderRowItem = useCallback(({ item }: { item: InstagramStoryItem }) => (
    <FeedStoryCard item={item} onOpen={() => handleOpenStory(item)} onDownload={() => handleDownload(item)} avatarUrl={profile?.data?.imageUrl} username={username} />
  ), [handleOpenStory, handleDownload, profile?.data?.imageUrl, username]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="small" elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`@${username}`} />
      </Appbar.Header>

      <View style={styles.headerBox}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleOpenProfilePicture} activeOpacity={0.7}>
            {profile?.data?.imageUrl ? (
              <Avatar.Image size={56} source={{ uri: profile.data.imageUrl }} />
            ) : (
              <Avatar.Icon size={56} icon="account" />
            )}
          </TouchableOpacity>
          <View style={styles.headerText}> 
            <Text variant="titleMedium">@{username}</Text>
            {!!profile?.data?.fullName && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{profile.data.fullName}</Text>}
            <Text variant="bodySmall" style={{ opacity: 0.6 }}>{stories.length} stories</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.segmentWrap, { backgroundColor: theme.colors.primary }]}>
            <Button
              mode="contained"
              icon="view-grid-outline"
              onPress={() => setLayout('grid')}
              style={[styles.segmentBtn, layout === 'grid' && styles.segmentActive]}
              textColor="#FFFFFF"
            >
              Grid
            </Button>
            <Button
              mode="contained"
              icon="view-agenda-outline"
              onPress={() => setLayout('timeline')}
              style={[styles.segmentBtn, layout === 'timeline' && styles.segmentActive]}
              textColor="#FFFFFF"
            >
              List
            </Button>
          </View>
          <Button
            mode="contained"
            icon={downloadingAll ? 'progress-download' : 'download'}
            onPress={handleDownloadAll}
            disabled={downloadingAll || stories.length === 0}
            style={{ marginLeft: 8, backgroundColor: theme.colors.primary }}
            textColor="#FFFFFF"
          >
            Download All
          </Button>
        </View>
      </View>

      {error ? (
        <View style={[styles.center, { padding: 24 }]}> 
          <Text>{error}</Text>
        </View>
      ) : layout === 'grid' ? (
        <FlatList
          key="grid"
          data={stories}
          keyExtractor={(i) => i.id}
          numColumns={3}
          contentContainerStyle={{ padding: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          removeClippedSubviews
          windowSize={5}
          maxToRenderPerBatch={9}
          initialNumToRender={12}
          renderItem={renderGridItem}
        />
      ) : (
        <FlatList
          key="timeline"
          data={stories}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={7}
          initialNumToRender={10}
          renderItem={renderRowItem}
        />
      )}

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]} onLayout={(e) => setViewerWidth(e.nativeEvent.layout.width)}>
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
                onScrollBeginDrag={undefined}
                onScrollEndDrag={undefined}
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
                        <Video
                          source={{ uri }}
                          style={styles.player}
                          controls
                          resizeMode="contain"
                          paused={true}
                        />
                      ) : (
                        <InstagramImage 
                          instagramUrl={uri} 
                          style={styles.player} 
                          resizeMode="contain"
                          onError={(url) => console.warn('Failed to load preview image:', url)}
                        />
                      )}
                    </View>
                  );
                }}
              />
            )}
            <View style={styles.viewerActions}>
              <Button mode="contained" onPress={() => handleDownload(stories[previewIndex])} icon="download">Download</Button>
              <Button onPress={() => setPreview(null)}>Close</Button>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={bulkVisible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]}> 
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Saving stories...</Text>
            <ProgressBar progress={bulkTotal ? bulkDone / bulkTotal : 0} color={theme.colors.primary} style={{ height: 8, borderRadius: 4 }} />
            <Text style={{ marginTop: 8 }}>{bulkDone}/{bulkTotal}</Text>
          </View>
        </View>
      </Modal>
      <Modal visible={pfpVisible} transparent animationType="fade" onRequestClose={() => setPfpVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]}> 
            {profile?.data?.imageUrl && (
              <InstagramImage 
                instagramUrl={profile.data.imageUrl} 
                style={styles.player} 
                resizeMode="contain"
                onError={(url) => console.warn('Failed to load profile picture:', url)}
              />
            )}
            <View style={styles.viewerActions}>
              <Button mode="contained" onPress={handleDownloadProfilePicture} icon="download">Download</Button>
              <Button onPress={() => setPfpVisible(false)}>Close</Button>
            </View>
          </View>
        </View>
      </Modal>
      
    </View>
  );
}

function CardRow({ item, onOpen, onDownload }: { item: InstagramStoryItem; onOpen: () => void; onDownload: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onOpen}>
      <View style={[styles.rowCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.rowThumbWrapper} pointerEvents="none">
          {item.mediaType === 'VIDEO' ? (
            <Video
              source={{ uri: item.mediaUrl }}
              style={styles.rowThumb}
              resizeMode="cover"
              muted
              paused
            />
          ) : (
            <InstagramImage 
              instagramUrl={item.mediaUrl} 
              style={styles.rowThumb}
              onError={(url) => console.warn('Failed to load row story image:', url)}
            />
          )}
          {item.mediaType === 'VIDEO' && (
            <View style={styles.playBadgeSmall}>
              <Text style={styles.playBadgeText}>▶</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{item.mediaType}</Text>
          {!!item.timestamp && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{new Date(item.timestamp).toLocaleString()}</Text>}
        </View>
        <Button compact onPress={onDownload} icon="download">Save</Button>
      </View>
    </TouchableOpacity>
  );
}

function FeedStoryCard({ item, onOpen, onDownload, avatarUrl, username }: { item: InstagramStoryItem; onOpen: () => void; onDownload: () => void; avatarUrl?: string; username: string }) {
  const theme = useTheme();
  const isVideo = item.mediaType === 'VIDEO';
  return (
    <View style={[styles.feedCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.feedHeader}>
        {avatarUrl ? (
          <Avatar.Image size={36} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Icon size={36} icon="account" />
        )}
        <Text variant="titleSmall" style={{ marginLeft: 8 }}>@{username}</Text>
        <View style={{ marginLeft: 'auto' }}>
          <Button compact onPress={onDownload} icon="download">Save</Button>
        </View>
      </View>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.8}>
        <View pointerEvents="none">
          {isVideo ? (
            <Video source={{ uri: item.mediaUrl }} style={styles.feedMedia} resizeMode="cover" paused muted />
          ) : (
            <InstagramImage 
              instagramUrl={item.mediaUrl} 
              style={styles.feedMedia} 
              resizeMode="cover"
              onError={(url) => console.warn('Failed to load feed story image:', url)}
            />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.feedFooter}>
        {!!item.timestamp && (
          <Text variant="bodySmall" style={{ opacity: 0.6 }}>{new Date(item.timestamp).toLocaleString()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 12, flexWrap: 'wrap' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerText: { gap: 2 },
  segmentWrap: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  segmentBtn: { backgroundColor: 'transparent', borderRadius: 0 },
  segmentActive: { opacity: 0.9 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, marginBottom: 8 },
  gridThumb: { width: '100%', height: '75%', borderRadius: 8 },
  thumbWrapper: { width: '100%', height: '75%', borderRadius: 8, overflow: 'hidden' },
  playBadge: { position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  playBadgeSmall: { position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  playBadgeText: { color: '#fff', fontSize: 12 },
  downloadBtn: { marginTop: 6 },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 10 },
  rowThumbWrapper: { width: 72, height: 72, borderRadius: 8, marginRight: 12, overflow: 'hidden' },
  rowThumb: { width: '100%', height: '100%' , borderRadius: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  viewer: { width: '90%', height: '70%', borderRadius: 12, overflow: 'hidden', padding: 8 },
  player: { width: '100%', height: '85%', borderRadius: 8, backgroundColor: 'black' },
  viewerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8 },
  // Feed styles
  feedCard: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  feedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  feedMedia: { width: '100%', height: 380, backgroundColor: '#000' },
  feedPlayOverlay: { position: 'absolute', right: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  feedFooter: { paddingHorizontal: 12, paddingVertical: 10 },
});


