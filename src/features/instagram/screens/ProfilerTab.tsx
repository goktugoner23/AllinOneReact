import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { Avatar, Card, Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { PurpleFab } from '@shared/components';
import { StorageService, STORAGE_KEYS } from '@shared/services/storage';

type UsernameItem = {
  id: string;
  username: string;
};

export default function ProfilerTab() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [usernames, setUsernames] = useState<UsernameItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const loadUsernames = useCallback(async () => {
    const stored = await StorageService.getItem<string[]>(STORAGE_KEYS.INSTAGRAM_PROFILER_USERNAMES);
    if (stored && Array.isArray(stored)) {
      setUsernames(stored.map((u) => ({ id: `${u}`, username: u })));
    }
  }, []);

  useEffect(() => {
    loadUsernames();
  }, [loadUsernames]);

  const persist = useCallback(async (items: UsernameItem[]) => {
    await StorageService.setItem(STORAGE_KEYS.INSTAGRAM_PROFILER_USERNAMES, items.map((i) => i.username));
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
  }, [newUsername, usernames, persist]);

  const handleRemove = useCallback(async (item: UsernameItem) => {
    const updated = usernames.filter((u) => u.id !== item.id);
    setUsernames(updated);
    await persist(updated);
  }, [usernames, persist]);

  const handleOpenProfile = useCallback((item: UsernameItem) => {
    navigation.navigate('ProfileDetail', { username: item.username });
  }, [navigation]);

  const renderItem = ({ item }: { item: UsernameItem }) => (
    <TouchableOpacity onPress={() => handleOpenProfile(item)}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title={`@${item.username}`}
          subtitle="Tap to view profile"
          left={(props) => <Avatar.Icon {...props} icon="account" />}
          right={(props) => (
            <Button compact onPress={() => handleRemove(item)}>
              Remove
            </Button>
          )}
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {adding && (
        <Card style={[styles.addCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Add username"
              placeholder="goktug_oner"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Affix text="@" />}
              onSubmitEditing={handleAdd}
            />
            <View style={styles.addActions}>
              <Button mode="contained" onPress={handleAdd} style={styles.addBtn}>Add</Button>
              <Button onPress={() => { setAdding(false); setNewUsername(''); }}>Cancel</Button>
            </View>
          </Card.Content>
        </Card>
      )}

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

      <PurpleFab iconName={adding ? 'check' : 'plus'} onPress={() => setAdding((v) => !v)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  card: { marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  addCard: { margin: 16 },
  addActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  addBtn: { marginRight: 12 },
});


