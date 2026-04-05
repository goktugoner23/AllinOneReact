import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { ChatMessage } from '../types/Muninn';

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

        {message.fileAttachments && message.fileAttachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.fileAttachments.map((file, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.fileRow, { backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : colors.backgroundSecondary }]}
                onPress={() => Linking.openURL(file.url)}
              >
                <Ionicons
                  name="document-outline"
                  size={18}
                  color={isUser ? colors.primaryForeground : colors.primary}
                />
                <Text
                  style={[styles.fileName, { color: isUser ? colors.primaryForeground : colors.foreground }]}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {message.audioUrl && (
          <TouchableOpacity
            style={[styles.audioRow, { backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : colors.backgroundSecondary }]}
            onPress={() => Linking.openURL(message.audioUrl!)}
          >
            <Ionicons
              name="mic-outline"
              size={18}
              color={isUser ? colors.primaryForeground : colors.primary}
            />
            <Text style={[styles.audioLabel, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
              Voice message
            </Text>
          </TouchableOpacity>
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
  attachmentsContainer: {
    gap: 6,
    marginBottom: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  audioLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
