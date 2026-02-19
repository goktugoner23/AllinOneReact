import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { gptApiService } from '../services/gptApiService';
import {
  ChatMessage,
  ConversationMeta,
  PendingChoice,
  PendingConfirmation,
  AIChatAction,
} from '../types/GPT';

interface GPTState {
  activeConversationId: string | null;
  conversations: ConversationMeta[];
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  pendingChoice: PendingChoice | null;
  pendingConfirmation: PendingConfirmation | null;
  lastActions: AIChatAction[];
}

const initialState: GPTState = {
  activeConversationId: null,
  conversations: [],
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  pendingChoice: null,
  pendingConfirmation: null,
  lastActions: [],
};

export const fetchConversations = createAsyncThunk(
  'gpt/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await gptApiService.getConversations();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch conversations');
    }
  },
);

export const loadConversation = createAsyncThunk(
  'gpt/loadConversation',
  async (id: string, { rejectWithValue }) => {
    try {
      const conversation = await gptApiService.getConversation(id);
      // Convert conversation messages to ChatMessages (only user/assistant with content)
      const chatMessages: ChatMessage[] = conversation.messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m, idx) => ({
          id: `${conversation.id}-${idx}`,
          role: m.role as 'user' | 'assistant',
          content: m.content!,
          createdAt: m.createdAt,
        }));
      return { id: conversation.id, title: conversation.title, messages: chatMessages };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load conversation');
    }
  },
);

export const sendMessage = createAsyncThunk(
  'gpt/sendMessage',
  async ({ message, conversationId, imageUrls }: { message: string; conversationId?: string; imageUrls?: string[] }, { rejectWithValue }) => {
    try {
      const response = await gptApiService.sendMessage({ message, conversationId, imageUrls });
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  },
);

export const sendChoiceResponse = createAsyncThunk(
  'gpt/sendChoiceResponse',
  async (
    { conversationId, choiceId, selectedOption }: { conversationId: string; choiceId: string; selectedOption: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await gptApiService.sendChoiceResponse(conversationId, choiceId, selectedOption);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send choice');
    }
  },
);

export const deleteConversation = createAsyncThunk(
  'gpt/deleteConversation',
  async (id: string, { rejectWithValue }) => {
    try {
      await gptApiService.deleteConversation(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  },
);

const gptSlice = createSlice({
  name: 'gpt',
  initialState,
  reducers: {
    startNewConversation(state) {
      state.activeConversationId = null;
      state.messages = [];
      state.pendingChoice = null;
      state.pendingConfirmation = null;
      state.lastActions = [];
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearPendingInteraction(state) {
      state.pendingChoice = null;
      state.pendingConfirmation = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load conversation
    builder
      .addCase(loadConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeConversationId = action.payload.id;
        state.messages = action.payload.messages;
        state.pendingChoice = null;
        state.pendingConfirmation = null;
      })
      .addCase(loadConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.isSending = true;
        state.error = null;
        // Optimistically add user message
        const userMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content: action.meta.arg.message,
          imageUrls: action.meta.arg.imageUrls,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(userMsg);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        state.activeConversationId = action.payload.conversationId;
        // Add assistant message
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: action.payload.message,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(assistantMsg);
        state.lastActions = action.payload.actions;

        // Handle actions
        for (const act of action.payload.actions) {
          if (act.type === 'user_choice' && act.choiceId) {
            state.pendingChoice = {
              choiceId: act.choiceId,
              question: act.question || '',
              options: act.options || [],
              allowFreeText: act.allowFreeText,
            };
          }
          if (act.type === 'confirmation' && act.choiceId) {
            state.pendingConfirmation = {
              choiceId: act.choiceId,
              question: act.question || '',
            };
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
        // Remove the optimistic user message on failure
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].role === 'user') {
          state.messages.pop();
        }
      });

    // Send choice response
    builder
      .addCase(sendChoiceResponse.pending, (state) => {
        state.isSending = true;
        state.pendingChoice = null;
        state.pendingConfirmation = null;
      })
      .addCase(sendChoiceResponse.fulfilled, (state, action) => {
        state.isSending = false;
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: action.payload.message,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(assistantMsg);
        state.lastActions = action.payload.actions;
      })
      .addCase(sendChoiceResponse.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      });

    // Delete conversation
    builder.addCase(deleteConversation.fulfilled, (state, action) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = null;
        state.messages = [];
      }
    });
  },
});

export const { startNewConversation, clearError, clearPendingInteraction } = gptSlice.actions;
export default gptSlice.reducer;
