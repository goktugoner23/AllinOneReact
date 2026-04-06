import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { muninnApiService } from '../services/muninnApiService';
import {
  ChatMessage,
  ConversationMeta,
  FileAttachment,
  MuninnAction,
  PendingChoice,
  PendingConfirmation,
} from '../types/Muninn';
import {
  ChatBubble,
  ChatInput,
  TypingIndicator,
  UserChoiceCard,
  ConfirmationCard,
  ConversationList,
} from '../components';

export default function MuninnScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [showConversations, setShowConversations] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    muninnApiService.getConversations().then(setConversations).catch(() => {});
  }, []);

  const handleActions = useCallback(
    (actions: MuninnAction[]) => {
      for (const action of actions) {
        if (action.type === 'navigate' && action.screen) {
          navigation.navigate(action.screen, action.params);
        }
        if (action.type === 'data_updated') {
          // Screens fetch fresh data on mount/focus — no global cache to invalidate
        }
        if (action.type === 'user_choice' && action.choiceId) {
          setPendingChoice({
            choiceId: action.choiceId,
            question: action.question || '',
            options: action.options || [],
            allowFreeText: action.allowFreeText,
          });
        }
        if (action.type === 'confirmation' && action.choiceId) {
          setPendingConfirmation({
            choiceId: action.choiceId,
            question: action.question || '',
          });
        }
      }
    },
    [navigation],
  );

  const handleSend = useCallback(
    async (text: string, imageUrls?: string[], fileAttachments?: FileAttachment[], audioUrl?: string) => {
      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: text,
        imageUrls,
        fileAttachments,
        audioUrl,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsSending(true);

      try {
        const response = await muninnApiService.sendMessage({
          message: text,
          conversationId: activeConversationId || undefined,
          imageUrls,
          fileAttachments,
          audioUrl,
        });
        setActiveConversationId(response.conversationId);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        handleActions(response.actions);
      } catch {
        // Remove optimistic user message on failure
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, handleActions],
  );

  const handleChoiceSelect = useCallback(
    async (option: string) => {
      if (!activeConversationId || !pendingChoice) return;
      setIsSending(true);
      setPendingChoice(null);
      setPendingConfirmation(null);

      try {
        const response = await muninnApiService.sendChoiceResponse(
          activeConversationId,
          pendingChoice.choiceId,
          option,
        );
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        handleActions(response.actions);
      } catch {
        // Silently fail — user can retry
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, pendingChoice, handleActions],
  );

  const handleConfirmation = useCallback(
    async (answer: string) => {
      if (!activeConversationId || !pendingConfirmation) return;
      setIsSending(true);
      setPendingChoice(null);
      setPendingConfirmation(null);

      try {
        const response = await muninnApiService.sendChoiceResponse(
          activeConversationId,
          pendingConfirmation.choiceId,
          answer,
        );
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        handleActions(response.actions);
      } catch {
        // Silently fail
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, pendingConfirmation, handleActions],
  );

  const handleSelectConversation = useCallback(async (id: string) => {
    try {
      const conversation = await muninnApiService.getConversation(id);
      const chatMessages: ChatMessage[] = conversation.messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m, idx) => ({
          id: `${conversation.id}-${idx}`,
          role: m.role as 'user' | 'assistant',
          content: m.content!,
          imageUrls: m.imageUrls,
          fileAttachments: m.fileAttachments,
          audioUrl: m.audioUrl,
          createdAt: m.createdAt,
        }));
      setActiveConversationId(conversation.id);
      setMessages(chatMessages);
      setPendingChoice(null);
      setPendingConfirmation(null);
    } catch {
      // Failed to load conversation
    }
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await muninnApiService.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch {
        // Failed to delete
      }
    },
    [activeConversationId],
  );

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setPendingChoice(null);
    setPendingConfirmation(null);
  }, []);

  const openConversations = useCallback(async () => {
    try {
      const convos = await muninnApiService.getConversations();
      setConversations(convos);
    } catch {
      // Failed to fetch
    }
    setShowConversations(true);
  }, []);

  const handleExportConversation = useCallback(async () => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}:\n${m.content}`)
      .join('\n\n---\n\n');
    const title = conversations.find((c) => c.id === activeConversationId)?.title || 'Conversation';
    await Share.share({ message: text, title });
  }, [messages, conversations, activeConversationId]);

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleExportConversation} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={22} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
            <Ionicons name="add-outline" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openConversations} style={styles.headerBtn}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleNewChat, openConversations, handleExportConversation, messages.length]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />

      {isSending && <TypingIndicator />}

      {pendingChoice && (
        <UserChoiceCard choice={pendingChoice} onSelect={handleChoiceSelect} disabled={isSending} />
      )}

      {pendingConfirmation && (
        <ConfirmationCard
          confirmation={pendingConfirmation}
          onConfirm={handleConfirmation}
          disabled={isSending}
        />
      )}

      <ChatInput onSend={handleSend} disabled={isSending} />

      <ConversationList
        visible={showConversations}
        onClose={() => setShowConversations(false)}
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerBtn: {
    padding: 4,
  },
});
