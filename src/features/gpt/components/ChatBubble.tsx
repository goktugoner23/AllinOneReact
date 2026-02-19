import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useColors } from '@shared/theme';
import { ChatMessage } from '../types/GPT';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const colors = useColors();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        {message.imageUrls && message.imageUrls.length > 0 && (
          <View style={styles.imageContainer}>
            {message.imageUrls.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.messageImage} resizeMode="cover" />
            ))}
          </View>
        )}
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
          selectable
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  messageImage: {
    width: 180,
    height: 140,
    borderRadius: 8,
  },
});
