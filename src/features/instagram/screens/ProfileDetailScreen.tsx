import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { Appbar, Avatar, Button, SegmentedButtons, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import instagramApiService from '@features/instagram/services/InstagramApiService';
import { InstagramProfilePictureResponse, InstagramStoriesResponse, InstagramStoryItem } from '@features/instagram/types/Instagram';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { cacheMedia } from '@shared/services/mediaCache';
import Video from 'react-native-video';

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

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [p, s] = await Promise.all([
          instagramApiService.getProfilePicture(username),
          instagramApiService.getStories(username),
        ]);
        setProfile(p);
        setStories((s?.data || []).slice().sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || '')));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load profile/stories', e);
        Alert.alert('Error', 'Failed to load profile/stories');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [username]);

  const handleOpenStory = useCallback(async (item: InstagramStoryItem) => {
    // Cache media first for smooth playback
    const local = await cacheMedia(item.mediaUrl, item.mediaType === 'VIDEO' ? '.mp4' : '.jpg');
    setPreview({ item, localUri: local });
  }, []);

  const handleDownload = useCallback(async (item: InstagramStoryItem) => {
    try {
      const local = await cacheMedia(item.mediaUrl, item.mediaType === 'VIDEO' ? '.mp4' : '.jpg');
      const filePath = local.startsWith('file://') ? local.replace('file://', '') : local;
      // Use Share to present a save dialog; on iOS this allows saving to Files/Photos, on Android share targets
      await Share.open({ url: local, type: item.mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg', saveToFiles: true });
      // As a fallback, copy to Downloads on Android
      if (Platform.OS === 'android') {
        const dest = `${RNFS.DownloadDirectoryPath}/ig_story_${Date.now()}${item.mediaType === 'VIDEO' ? '.mp4' : '.jpg'}`;
        await RNFS.copyFile(filePath, dest);
      }
    } catch (e: any) {
      if (e?.message?.includes('User did not share')) return;
      Alert.alert('Download failed', 'Could not save the media.');
    }
  }, []);

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
        <Avatar.Image size={72} source={{ uri: profile?.data?.imageUrl }} />
        <View style={styles.headerText}> 
          <Text variant="titleMedium">@{username}</Text>
          {!!profile?.data?.fullName && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{profile.data.fullName}</Text>}
          <Text variant="bodySmall" style={{ opacity: 0.6 }}>{stories.length} stories</Text>
        </View>
        <SegmentedButtons
          style={{ marginLeft: 'auto' }}
          value={layout}
          onValueChange={(v) => setLayout(v as any)}
          buttons={[
            { value: 'grid', label: 'Grid', icon: 'grid' },
            { value: 'timeline', label: 'Timeline', icon: 'timeline' },
          ]}
        />
      </View>

      {layout === 'grid' ? (
        <FlatList
          data={stories}
          keyExtractor={(i) => i.id}
          numColumns={3}
          contentContainerStyle={{ padding: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem} onPress={() => handleOpenStory(item)}>
              <Image source={{ uri: item.mediaUrl }} style={styles.gridThumb} />
              <Button compact onPress={() => handleDownload(item)} style={styles.downloadBtn} icon="download">Save</Button>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <CardRow item={item} onOpen={() => handleOpenStory(item)} onDownload={() => handleDownload(item)} />
          )}
        />
      )}

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.viewer, { backgroundColor: theme.colors.surface }]}>
            {preview?.item.mediaType === 'VIDEO' ? (
              <Video source={{ uri: preview.localUri || preview.item.mediaUrl }} style={styles.player} controls resizeMode="contain" />
            ) : (
              <Image source={{ uri: preview?.localUri || preview?.item.mediaUrl }} style={styles.player} resizeMode="contain" />
            )}
            <View style={styles.viewerActions}>
              <Button mode="contained" onPress={() => handleDownload(preview!.item)} icon="download">Download</Button>
              <Button onPress={() => setPreview(null)}>Close</Button>
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
        <Image source={{ uri: item.mediaUrl }} style={styles.rowThumb} />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{item.mediaType}</Text>
          {!!item.timestamp && <Text variant="bodySmall" style={{ opacity: 0.7 }}>{new Date(item.timestamp).toLocaleString()}</Text>}
        </View>
        <Button compact onPress={onDownload} icon="download">Save</Button>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBox: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  headerText: { gap: 2 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, marginBottom: 8 },
  gridThumb: { width: '100%', height: '75%', borderRadius: 8 },
  downloadBtn: { marginTop: 6 },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 10 },
  rowThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  viewer: { width: '90%', height: '70%', borderRadius: 12, overflow: 'hidden', padding: 8 },
  player: { width: '100%', height: '85%', borderRadius: 8, backgroundColor: 'black' },
  viewerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 8 },
});


