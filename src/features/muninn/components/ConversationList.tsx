import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { ConversationMeta } from '../types/Muninn';

interface ConversationListProps {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export default function ConversationList({
  visible,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}: ConversationListProps) {
  const colors = useColors();

  const renderItem = ({ item }: { item: ConversationMeta }) => {
    const isActive = item.id === activeId;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: isActive ? colors.primaryMuted : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
        onPress={() => {
          onSelect(item.id);
          onClose();
        }}
      >
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemPreview, { color: colors.foregroundMuted }]} numberOfLines={1}>
            {item.lastMessagePreview || 'No messages yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Conversations</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              onNewChat();
              onClose();
            }}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
            <Text style={[styles.newChatText, { color: colors.primaryForeground }]}>New Chat</Text>
          </TouchableOpacity>

          <FlatList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.foregroundMuted }]}>No conversations yet</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemPreview: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  empty: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
});
