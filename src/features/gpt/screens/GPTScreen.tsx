import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import {
  sendMessage,
  sendChoiceResponse,
  fetchConversations,
  loadConversation,
  deleteConversation,
  startNewConversation,
} from '../store/gptSlice';
import { ChatMessage } from '../types/GPT';
import {
  ChatBubble,
  ChatInput,
  TypingIndicator,
  UserChoiceCard,
  ConfirmationCard,
  ConversationList,
} from '../components';

export default function GPTScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const [showConversations, setShowConversations] = useState(false);

  const {
    activeConversationId,
    conversations,
    messages,
    isSending,
    pendingChoice,
    pendingConfirmation,
    lastActions,
  } = useSelector((state: RootState) => state.gpt);

  // Load conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Handle navigation and data_updated actions
  useEffect(() => {
    if (!lastActions.length) return;

    for (const action of lastActions) {
      if (action.type === 'navigate' && action.screen) {
        navigation.navigate(action.screen, action.params);
      }
      if (action.type === 'data_updated' && action.collection) {
        queryClient.invalidateQueries({ queryKey: [action.collection] });
      }
    }
  }, [lastActions, navigation, queryClient]);

  const handleSend = useCallback(
    (text: string, imageUrls?: string[]) => {
      dispatch(sendMessage({ message: text, conversationId: activeConversationId || undefined, imageUrls }));
    },
    [dispatch, activeConversationId],
  );

  const handleChoiceSelect = useCallback(
    (option: string) => {
      if (!activeConversationId || !pendingChoice) return;
      dispatch(
        sendChoiceResponse({
          conversationId: activeConversationId,
          choiceId: pendingChoice.choiceId,
          selectedOption: option,
        }),
      );
    },
    [dispatch, activeConversationId, pendingChoice],
  );

  const handleConfirmation = useCallback(
    (answer: string) => {
      if (!activeConversationId || !pendingConfirmation) return;
      dispatch(
        sendChoiceResponse({
          conversationId: activeConversationId,
          choiceId: pendingConfirmation.choiceId,
          selectedOption: answer,
        }),
      );
    },
    [dispatch, activeConversationId, pendingConfirmation],
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      dispatch(loadConversation(id));
    },
    [dispatch],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      dispatch(deleteConversation(id));
    },
    [dispatch],
  );

  const handleNewChat = useCallback(() => {
    dispatch(startNewConversation());
  }, [dispatch]);

  const openConversations = useCallback(() => {
    dispatch(fetchConversations());
    setShowConversations(true);
  }, [dispatch]);

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
            <Ionicons name="add-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openConversations} style={styles.headerBtn}>
            <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleNewChat, openConversations]);

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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
