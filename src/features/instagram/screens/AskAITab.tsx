import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Text,
  TextInput,
  IconButton,
  useTheme,
  Card,
  Chip,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
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

const AskAITab: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const flatListRef = useRef<FlashList<ChatMessage>>(null);
  
  const { messages, loading, suggestions } = useSelector((state: RootState) => state.instagram.ai);
  
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

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
      dispatch(analyzeInstagramURL({
        url: urlMatch[0],
        customQuery: inputText.replace(urlMatch[0], '').trim() || undefined,
      }));
    } else {
      // Handle regular text query
      dispatch(queryInstagramAI({
        query: inputText.trim(),
        domain: 'instagram',
        options: {
          topK: 5,
          minScore: 0.7,
        },
      }));
    }
  }, [inputText, loading.isLoading, dispatch]);

  // Handle suggested question
  const handleSuggestedQuestion = useCallback((question: string) => {
    setInputText(question);
    setShowSuggestions(false);
  }, []);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            dispatch(clearChatMessages());
            setShowSuggestions(true);
          },
        },
      ]
    );
  }, [dispatch]);

  // Render message item
  const renderMessageItem = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} />
  ), []);

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
        <Text style={[styles.suggestionsTitle, { color: theme.colors.onSurface }]}>
          Suggested Questions
        </Text>
        <View style={styles.suggestionsGrid}>
          {suggestedQuestions.map((question, index) => (
            <Chip
              key={index}
              mode="outlined"
              onPress={() => handleSuggestedQuestion(question)}
              style={styles.suggestionChip}
              textStyle={styles.suggestionText}
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
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        Instagram AI Assistant
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Ask questions about your Instagram performance, content strategy, and get insights from your posts.
      </Text>
      {showSuggestions ? renderSuggestedQuestions() : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages list */}
      <FlashList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.emptyList,
        ]}
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
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        {messages.length > 0 && (
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={handleClearChat}
            style={styles.clearButton}
          />
        )}
        
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your Instagram performance..."
          multiline
          maxLength={500}
          style={styles.textInput}
          contentStyle={styles.textInputContent}
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />
        
        <IconButton
          icon={loading.isLoading ? 'loading' : 'send'}
          size={24}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || loading.isLoading}
          style={[
            styles.sendButton,
            { backgroundColor: theme.colors.primary },
          ]}
          iconColor={theme.colors.onPrimary}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const theme = useTheme();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[
      styles.messageBubble,
      message.isUser ? styles.userBubble : styles.aiBubble,
    ]}>
      <Card
        style={[
          styles.messageCard,
          {
            backgroundColor: message.isUser
              ? theme.colors.primary
              : message.isError
              ? theme.colors.errorContainer
              : theme.colors.surface,
          },
        ]}
      >
        <Card.Content style={styles.messageContent}>
          {message.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                Thinking...
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  {
                    color: message.isUser
                      ? theme.colors.onPrimary
                      : message.isError
                      ? theme.colors.onErrorContainer
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {message.text}
              </Text>
              
              {/* Show confidence and processing time for AI responses */}
              {!message.isUser && !message.isError && message.confidence && (
                <View style={styles.messageMetadata}>
                  <Text style={[styles.metadataText, { color: theme.colors.onSurfaceVariant }]}>
                    Confidence: {(message.confidence * 100).toFixed(0)}%
                  </Text>
                  {message.processingTime && (
                    <Text style={[styles.metadataText, { color: theme.colors.onSurfaceVariant }]}>
                      • {message.processingTime}ms
                    </Text>
                  )}
                </View>
              )}
              
              {/* Show sources for AI responses */}
              {!message.isUser && message.sources && message.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={[styles.sourcesTitle, { color: theme.colors.onSurfaceVariant }]}>
                    Sources ({message.sources.length}):
                  </Text>
                  {message.sources.slice(0, 3).map((source, index) => (
                    <View key={source.id} style={styles.sourceItem}>
                      <Text style={[styles.sourceText, { color: theme.colors.onSurfaceVariant }]}>
                        {index + 1}. Post {source.metadata.postId?.slice(-6)} 
                        {source.metadata.engagementRate && 
                          ` (${source.metadata.engagementRate.toFixed(1)}% engagement)`
                        }
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>
      
      <Text style={[styles.messageTime, { color: theme.colors.onSurfaceVariant }]}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    marginBottom: 8,
    maxWidth: '90%',
  },
  suggestionText: {
    fontSize: 12,
  },
  messageBubble: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    elevation: 2,
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  messageMetadata: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metadataText: {
    fontSize: 12,
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sourceItem: {
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 11,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  clearButton: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  textInputContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    borderRadius: 20,
  },
});

export default AskAITab;