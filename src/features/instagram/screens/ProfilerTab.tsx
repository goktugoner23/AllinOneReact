import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, useTheme, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { usePrefetchInstagramData } from '@shared/hooks';
import { Card, CardContent, Avatar, Button, IconButton, Badge, Skeleton, AddFab } from '@shared/components/ui';
import { StorageService, STORAGE_KEYS } from '@shared/services/storage/asyncStorage';

type UsernameItem = {
  id: string;
  username: string;
};

export default function ProfilerTab() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const prefetchData = usePrefetchInstagramData();

  const [usernames, setUsernames] = useState<UsernameItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [avatars, setAvatars] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadUsernames = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await StorageService.getItem<string[]>(STORAGE_KEYS.INSTAGRAM_PROFILER_USERNAMES);
      if (stored && Array.isArray(stored)) {
        setUsernames(stored.map((u) => ({ id: `${u}`, username: u })));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsernames();
  }, [loadUsernames]);

  // Load cached profile pictures for listed usernames
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        if (!usernames.length) {
          setAvatars({});
          return;
        }
        const keys = usernames.map((u) => `${STORAGE_KEYS.CACHED_DATA}:ig_all:${u.username}`);
        const results = await StorageService.multiGet<any>(keys);
        const map: Record<string, string | undefined> = {};
        results.forEach(([key, value]) => {
          if (value && value.profile && value.profile.data && value.profile.data.imageUrl) {
            const uname = key.split(':ig_all:')[1] || '';
            if (uname) {
              map[uname] = value.profile.data.imageUrl as string;
            }
          }
        });
        setAvatars(map);
      } catch (_) {
        // ignore avatar load errors
      }
    };
    loadAvatars();
  }, [usernames]);

  const persist = useCallback(async (items: UsernameItem[]) => {
    await StorageService.setItem(
      STORAGE_KEYS.INSTAGRAM_PROFILER_USERNAMES,
      items.map((i) => i.username),
    );
  }, []);

  const handleAdd = useCallback(async () => {
    const username = newUsername.trim().replace(/^@/, '');
    if (!username) {
      setAdding(false);
      return;
    }
    if (usernames.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      Alert.alert('Already added', `@${username} is already in the list.`);
      return;
    }
    const updated = [{ id: `${Date.now()}`, username }, ...usernames];
    setUsernames(updated);
    await persist(updated);
    setNewUsername('');
    setAdding(false);

    // Prefetch the new user's data
    prefetchData(username);
  }, [newUsername, usernames, persist, prefetchData]);

  const handleRemove = useCallback(
    async (item: UsernameItem) => {
      const updated = usernames.filter((u) => u.id !== item.id);
      setUsernames(updated);
      await persist(updated);
    },
    [usernames, persist],
  );

  const handleOpenProfile = useCallback(
    (item: UsernameItem) => {
      // Prefetch data before navigating
      prefetchData(item.username);
      navigation.navigate('ProfileDetail', { username: item.username });
    },
    [navigation, prefetchData],
  );

  const handleClearCaches = useCallback(async () => {
    try {
      const keys = await StorageService.getAllKeys();
      const toRemove = keys.filter((k) => k.startsWith(`${STORAGE_KEYS.CACHED_DATA}:ig_`));
      if (toRemove.length) {
        await Promise.all(toRemove.map((k) => StorageService.removeItem(k)));
      }
      setSnackbar({ visible: true, message: 'All story caches cleared' });
    } catch (_) {
      setSnackbar({ visible: true, message: 'Failed to clear caches' });
    }
  }, []);

  const renderSkeletonItem = () => (
    <Card variant="outlined" style={styles.card}>
      <CardContent>
        <View style={styles.cardRow}>
          <Skeleton variant="circular" width={48} height={48} />
          <View style={styles.cardTextContent}>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const renderItem = ({ item }: { item: UsernameItem }) => (
    <Card
      variant="outlined"
      style={styles.card}
      onPress={() => handleOpenProfile(item)}
      onLongPress={() => {
        Alert.alert(`Remove @${item.username}?`, 'This will remove the profile from your list.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => handleRemove(item) },
        ]);
      }}
    >
      <CardContent>
        <View style={styles.cardRow}>
          <Avatar
            source={avatars[item.username] ? { uri: avatars[item.username]! } : undefined}
            name={item.username}
            size="lg"
          />
          <View style={styles.cardTextContent}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.username}>
                @{item.username}
              </Text>
              {avatars[item.username] && (
                <Badge variant="success" size="sm">
                  Cached
                </Badge>
              )}
            </View>
            <Text variant="bodySmall" style={{ opacity: 0.6 }}>
              Tap to view profile
            </Text>
          </View>
          <IconButton
            icon="delete-outline"
            size="md"
            variant="ghost"
            onPress={() => {
              Alert.alert(`Remove @${item.username}?`, 'This will remove the profile from your list.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleRemove(item) },
              ]);
            }}
          />
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {adding && (
        <Card variant="elevated" style={styles.addCard}>
          <CardContent>
            <TextInput
              mode="outlined"
              label="Username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="at" />}
              onSubmitEditing={handleAdd}
            />
            <View style={styles.addActions}>
              <Button variant="primary" onPress={handleAdd}>
                Add
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  setAdding(false);
                  setNewUsername('');
                }}
              >
                Cancel
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <View style={styles.list}>
          {renderSkeletonItem()}
          {renderSkeletonItem()}
          {renderSkeletonItem()}
        </View>
      ) : (
        <FlatList
          data={usernames}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={{ opacity: 0.7 }}>Add usernames to start profiling</Text>
            </View>
          )}
        />
      )}

      <AddFab iconName="refresh" style={{ left: 16, right: undefined }} onPress={handleClearCaches} />
      <AddFab iconName={adding ? 'check' : 'plus'} onPress={() => setAdding((v) => !v)} />
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  card: { marginBottom: 12 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTextContent: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontWeight: '600',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  addCard: { margin: 16 },
  addActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
