import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { ConversationMeta } from '../types/Muninn';

interface ConversationTabsProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenFullList: () => void;
  // True while Muninn is processing a send. We disable interactions
  // because tapping a chip mid-send wipes the optimistic messages
  // (handleNewChat clears, handleSelectConversation replaces with the
  // tapped convo's history). Easy to misclick on a thin chip strip.
  disabled?: boolean;
}

/**
 * Always-visible horizontal strip of recent conversations. Sits between
 * the header and the chat list so switching threads is one tap, not
 * tap-icon-then-pick-from-modal. The full conversation list modal stays
 * available behind the "..." chip on the right for older threads.
 */
export default function ConversationTabs({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onOpenFullList,
  disabled = false,
}: ConversationTabsProps) {
  const colors = useColors();
  // Cap visible chips at 12. The "more" chip handles overflow.
  const MAX_VISIBLE = 12;
  const visible = conversations.slice(0, MAX_VISIBLE);
  const hasMore = conversations.length > MAX_VISIBLE;

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 },
      ]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.iconChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={onNewChat}
          accessibilityLabel="New chat"
        >
          <Ionicons name="add" size={16} color={colors.foreground} />
        </TouchableOpacity>

        {visible.map((c) => {
          const isActive = c.id === activeId;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelect(c.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
                numberOfLines={1}
              >
                {c.title || 'Untitled'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {hasMore || conversations.length === 0 ? (
          <TouchableOpacity
            style={[styles.iconChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={onOpenFullList}
            accessibilityLabel="See all conversations"
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.foreground} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 160,
    minWidth: 60,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  iconChip: {
    width: 32,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
