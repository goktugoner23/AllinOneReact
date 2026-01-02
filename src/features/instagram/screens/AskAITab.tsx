import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, TextInput, IconButton, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store';
import {
  addChatMessage,
  clearChatMessages,
  queryInstagramAI,
  analyzeInstagramURL,
  setAttachmentPreview,
  clearAttachmentPreview,
} from '@features/instagram/store/instagramSlice';
import { ChatMessage, ContentType, AttachmentType } from '@features/instagram/types/Instagram';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

export interface AskAIHandle {
  scrollToEnd: () => void;
}

const AskAITab = forwardRef<AskAIHandle, {}>((props, ref) => {
  const colors = useColors();
  const dispatch = useDispatch<AppDispatch>();
  const flatListRef = useRef<FlashList<ChatMessage>>(null);

  const { messages, loading, suggestions } = useSelector((state: RootState) => state.instagram.ai);

  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Expose scrollToEnd to parents
  useImperativeHandle(
    ref,
    () => ({
      scrollToEnd: () => flatListRef.current?.scrollToEnd({ animated: true }),
    }),
    [],
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || loading.isLoading) return;

    const userMessage: ChatMessage = {
      text: inputText.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    // Add user message
    dispatch(addChatMessage(userMessage));

    // Clear input and hide suggestions
    setInputText('');
    setShowSuggestions(false);

    // Check if it's an Instagram URL
    const urlPattern = /https?:\/\/[^\s]*instagram\.com[^\s]*/i;
    const urlMatch = inputText.match(urlPattern);

    if (urlMatch) {
      // Handle Instagram URL analysis
      dispatch(
        analyzeInstagramURL({
          url: urlMatch[0],
          customQuery: inputText.replace(urlMatch[0], '').trim() || undefined,
        }),
      );
    } else {
      // Handle regular text query
      dispatch(
        queryInstagramAI({
          query: inputText.trim(),
          domain: 'instagram',
          options: {
            topK: 5,
            minScore: 0.7,
          },
        }),
      );
    }
  }, [inputText, loading.isLoading, dispatch]);

  // Handle suggested question
  const handleSuggestedQuestion = useCallback((question: string) => {
    setInputText(question);
    setShowSuggestions(false);
  }, []);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          dispatch(clearChatMessages());
          setShowSuggestions(true);
        },
      },
    ]);
  }, [dispatch]);

  // Render message item
  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => <MessageBubble message={item} />, []);

  // Render suggested questions
  const renderSuggestedQuestions = () => {
    const suggestedQuestions = [
      'Which Wing Chun posts have highest engagement?',
      'What martial arts hashtags perform best?',
      'Which knife defense content gets most likes?',
      'Compare my sparring vs technique demonstration videos',
      'What content gets the most comments and engagement?',
      'How do my Turkish vs English posts perform?',
    ];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsTitle, { color: colors.foreground }]}>Suggested Questions</Text>
        <View style={styles.suggestionsGrid}>
          {suggestedQuestions.map((question, index) => (
            <Chip
              key={index}
              mode="outlined"
              onPress={() => handleSuggestedQuestion(question)}
              style={[styles.suggestionChip, { borderColor: colors.border }]}
              textStyle={[styles.suggestionText, { color: colors.foregroundMuted }]}
            >
              {question}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Instagram AI Assistant</Text>
      <Text style={[styles.emptySubtitle, { color: colors.foregroundMuted }]}>
        Ask questions about your Instagram performance, content strategy, and get insights from your posts.
      </Text>
      {showSuggestions ? renderSuggestedQuestions() : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages list */}
      <FlashList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        contentContainerStyle={
          {
            ...styles.messagesList,
            ...(messages.length === 0 ? styles.emptyList : {}),
          } as any
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={80}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />

      {/* Input area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {messages.length > 0 && (
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={handleClearChat}
            style={styles.clearButton}
            iconColor={colors.foregroundMuted}
          />
        )}

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your Instagram performance..."
          placeholderTextColor={colors.foregroundSubtle}
          multiline
          maxLength={500}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          textColor={colors.foreground}
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />

        <IconButton
          icon={loading.isLoading ? 'loading' : 'send'}
          size={24}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || loading.isLoading}
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          iconColor={colors.primaryForeground}
        />
      </View>
    </KeyboardAvoidingView>
  );
});

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const colors = useColors();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
      <Card
        style={[
          styles.messageCard,
          shadow.md,
          {
            backgroundColor: message.isUser
              ? colors.primary
              : message.isError
                ? colors.destructiveMuted
                : colors.surface,
          },
        ]}
      >
        <Card.Content style={styles.messageContent}>
          {message.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.foreground }]}>Thinking...</Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  {
                    color: message.isUser
                      ? colors.primaryForeground
                      : message.isError
                        ? colors.destructive
                        : colors.foreground,
                  },
                ]}
              >
                {message.text}
              </Text>

              {/* Show confidence and processing time for AI responses */}
              {!message.isUser && !message.isError && message.confidence && (
                <View style={styles.messageMetadata}>
                  <Text style={[styles.metadataText, { color: colors.foregroundMuted }]}>
                    Confidence: {(message.confidence * 100).toFixed(0)}%
                  </Text>
                  {message.processingTime && (
                    <Text style={[styles.metadataText, { color: colors.foregroundMuted }]}>
                      {' '}
                      • {message.processingTime}ms
                    </Text>
                  )}
                </View>
              )}

              {/* Show sources for AI responses */}
              {!message.isUser && message.sources && message.sources.length > 0 && (
                <View style={[styles.sourcesContainer, { borderTopColor: colors.border }]}>
                  <Text style={[styles.sourcesTitle, { color: colors.foregroundMuted }]}>
                    Sources ({message.sources.length}):
                  </Text>
                  {message.sources.slice(0, 3).map((source, index) => (
                    <View key={source.id} style={styles.sourceItem}>
                      <Text style={[styles.sourceText, { color: colors.foregroundMuted }]}>
                        {index + 1}. Post {source.metadata.postId?.slice(-6)}
                        {source.metadata.engagementRate &&
                          ` (${source.metadata.engagementRate.toFixed(1)}% engagement)`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      <Text style={[styles.messageTime, { color: colors.foregroundSubtle }]}>{formatTime(message.timestamp)}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: spacing[4],
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing[5],
  },
  emptyTitle: {
    ...textStyles.h2,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    ...textStyles.h4,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
  },
  suggestionChip: {
    marginBottom: spacing[2],
    maxWidth: '90%',
  },
  suggestionText: {
    ...textStyles.caption,
  },
  messageBubble: {
    marginBottom: spacing[4],
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    borderRadius: radius.lg,
  },
  messageContent: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  messageText: {
    ...textStyles.body,
  },
  messageTime: {
    ...textStyles.caption,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  messageMetadata: {
    flexDirection: 'row',
    marginTop: spacing[2],
    flexWrap: 'wrap',
  },
  metadataText: {
    ...textStyles.caption,
  },
  sourcesContainer: {
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
  },
  sourcesTitle: {
    ...textStyles.labelSmall,
    marginBottom: spacing[1],
  },
  sourceItem: {
    marginBottom: spacing[0.5],
  },
  sourceText: {
    fontSize: 11,
    lineHeight: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: spacing[2],
    ...textStyles.bodySmall,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[4],
    borderTopWidth: 1,
  },
  clearButton: {
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: spacing[2],
  },
  textInputContent: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  sendButton: {
    borderRadius: radius.full,
  },
});

export default AskAITab;
