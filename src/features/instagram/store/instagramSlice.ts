import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  InstagramState,
  InstagramPostsData,
  InstagramAnalytics,
  ChatMessage,
  RAGQueryRequest,
  RAGQueryResponse,
  HealthStatus,
  AudioRecordingState,
  MessageAttachment,
  MultimodalSuggestion,
  ContentType,
  AttachmentType,
} from '@features/instagram/types/Instagram';
import { instagramApiService } from '@features/instagram/services/InstagramApiService';

// Initial state
const initialState: InstagramState = {
  posts: {
    data: null,
    loading: {
      isLoading: false,
      isRefreshing: false,
      error: undefined,
    },
  },
  analytics: {
    data: null,
    loading: {
      isLoading: false,
      isRefreshing: false,
      error: undefined,
    },
  },
  ai: {
    messages: [],
    loading: {
      isLoading: false,
      isRefreshing: false,
      error: undefined,
    },
    audioRecording: {
      isRecording: false,
      duration: 0,
      amplitude: 0,
    },
    suggestions: [
      {
        title: 'Analyze Screenshot',
        description: 'Upload Instagram screenshots for analysis',
        contentType: ContentType.IMAGE,
        icon: '📱',
        exampleQuery: 'How can I improve my Instagram profile?',
        acceptedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      },
      {
        title: 'Voice Strategy',
        description: 'Record voice memos about your strategy',
        contentType: ContentType.AUDIO,
        icon: '🎤',
        exampleQuery: 'Transcribe and analyze my content ideas',
        acceptedFileTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      },
      {
        title: 'Analytics Report',
        description: 'Upload PDF analytics reports',
        contentType: ContentType.PDF,
        icon: '📊',
        exampleQuery: 'What insights are in this analytics report?',
        acceptedFileTypes: ['application/pdf'],
      },
      {
        title: 'Analyze URL',
        description: 'Analyze Instagram profiles or posts',
        contentType: ContentType.URL,
        icon: '🔗',
        exampleQuery: 'What can I learn from this account?',
        acceptedFileTypes: [],
      },
    ],
  },
  health: {
    status: null,
  },
};

// Async thunks

// Get Instagram posts
export const fetchInstagramPosts = createAsyncThunk(
  'instagram/fetchPosts',
  async (forceSync: boolean = false, { rejectWithValue }) => {
    try {
      const response = await instagramApiService.getInstagramPosts(forceSync);

      // Convert API response to internal data format
      const internalData: InstagramPostsData = {
        posts: response.data,
        count: response.count,
        source: response.source,
        syncInfo: response.syncInfo,
        timestamp: response.timestamp,
      };

      return internalData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch posts');
    }
  },
);

// Get Instagram analytics
export const fetchInstagramAnalytics = createAsyncThunk('instagram/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    return await instagramApiService.getInstagramAnalytics();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch analytics');
  }
});

// Query RAG for AI insights
export const queryInstagramAI = createAsyncThunk(
  'instagram/queryAI',
  async (request: RAGQueryRequest, { rejectWithValue }) => {
    try {
      return await instagramApiService.queryRAG(request);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to query AI');
    }
  },
);

// Check Instagram health
export const checkInstagramHealth = createAsyncThunk('instagram/checkHealth', async (_, { rejectWithValue }) => {
  try {
    return await instagramApiService.checkInstagramHealth();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to check health');
  }
});

// Upload file for analysis
export const uploadFileForAnalysis = createAsyncThunk(
  'instagram/uploadFile',
  async (
    params: {
      fileUri: string;
      fileName: string;
      mimeType: string;
      analysisQuery: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await instagramApiService.uploadFileForAnalysis(
        params.fileUri,
        params.fileName,
        params.mimeType,
        params.analysisQuery,
      );
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload file');
    }
  },
);

// Analyze Instagram URL
export const analyzeInstagramURL = createAsyncThunk(
  'instagram/analyzeURL',
  async (params: { url: string; customQuery?: string }, { rejectWithValue }) => {
    try {
      return await instagramApiService.analyzeInstagramURL(params.url, params.customQuery);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to analyze URL');
    }
  },
);

// Process audio recording
export const processAudioRecording = createAsyncThunk(
  'instagram/processAudio',
  async (
    params: {
      audioFilePath: string;
      analysisQuery: string;
      duration: number;
    },
    { rejectWithValue },
  ) => {
    try {
      return await instagramApiService.processAudioRecording(
        params.audioFilePath,
        params.analysisQuery,
        params.duration,
      );
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process audio');
    }
  },
);

// Instagram slice
const instagramSlice = createSlice({
  name: 'instagram',
  initialState,
  reducers: {
    // AI Chat actions
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.ai.messages.push(action.payload);
    },

    removeChatMessage: (state, action: PayloadAction<number>) => {
      state.ai.messages.splice(action.payload, 1);
    },

    clearChatMessages: (state) => {
      state.ai.messages = [];
      state.ai.loading.error = undefined;
    },

    updateLastChatMessage: (state, action: PayloadAction<Partial<ChatMessage>>) => {
      const lastIndex = state.ai.messages.length - 1;
      if (lastIndex >= 0) {
        state.ai.messages[lastIndex] = {
          ...state.ai.messages[lastIndex],
          ...action.payload,
        };
      }
    },

    // Audio recording actions
    startAudioRecording: (state) => {
      state.ai.audioRecording = {
        isRecording: true,
        duration: 0,
        amplitude: 0,
        error: undefined,
      };
    },

    stopAudioRecording: (state, action: PayloadAction<string>) => {
      state.ai.audioRecording = {
        ...state.ai.audioRecording,
        isRecording: false,
        filePath: action.payload,
      };
    },

    updateRecordingState: (state, action: PayloadAction<{ duration: number; amplitude: number }>) => {
      if (state.ai.audioRecording.isRecording) {
        state.ai.audioRecording.duration = action.payload.duration;
        state.ai.audioRecording.amplitude = action.payload.amplitude;
      }
    },

    setRecordingError: (state, action: PayloadAction<string>) => {
      state.ai.audioRecording.error = action.payload;
      state.ai.audioRecording.isRecording = false;
    },

    // Attachment actions
    setAttachmentPreview: (state, action: PayloadAction<MessageAttachment>) => {
      state.ai.attachmentPreview = action.payload;
    },

    clearAttachmentPreview: (state) => {
      state.ai.attachmentPreview = undefined;
    },

    // Error handling
    clearError: (state, action: PayloadAction<'posts' | 'analytics' | 'ai'>) => {
      state[action.payload].loading.error = undefined;
    },

    // Reset state
    resetInstagramState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Instagram posts
    builder
      .addCase(fetchInstagramPosts.pending, (state, action) => {
        const isRefresh = action.meta.arg === true;
        state.posts.loading.isLoading = !isRefresh;
        state.posts.loading.isRefreshing = isRefresh;
        state.posts.loading.error = undefined;
      })
      .addCase(fetchInstagramPosts.fulfilled, (state, action) => {
        state.posts.data = action.payload;
        state.posts.loading.isLoading = false;
        state.posts.loading.isRefreshing = false;
        state.posts.loading.error = undefined;
      })
      .addCase(fetchInstagramPosts.rejected, (state, action) => {
        state.posts.loading.isLoading = false;
        state.posts.loading.isRefreshing = false;
        state.posts.loading.error = action.payload as string;
      });

    // Fetch Instagram analytics
    builder
      .addCase(fetchInstagramAnalytics.pending, (state) => {
        state.analytics.loading.isLoading = true;
        state.analytics.loading.error = undefined;
      })
      .addCase(fetchInstagramAnalytics.fulfilled, (state, action) => {
        state.analytics.data = action.payload;
        state.analytics.loading.isLoading = false;
        state.analytics.loading.error = undefined;
      })
      .addCase(fetchInstagramAnalytics.rejected, (state, action) => {
        state.analytics.loading.isLoading = false;
        state.analytics.loading.error = action.payload as string;
      });

    // Query Instagram AI
    builder
      .addCase(queryInstagramAI.pending, (state) => {
        state.ai.loading.isLoading = true;
        state.ai.loading.error = undefined;
      })
      .addCase(queryInstagramAI.fulfilled, (state, action) => {
        // Add AI response message
        const aiMessage: ChatMessage = {
          text: action.payload.answer,
          isUser: false,
          timestamp: Date.now(),
          sources: action.payload.sources,
          confidence: action.payload.confidence,
          processingTime: action.payload.processingTime,
        };
        state.ai.messages.push(aiMessage);
        state.ai.loading.isLoading = false;
        state.ai.loading.error = undefined;
      })
      .addCase(queryInstagramAI.rejected, (state, action) => {
        // Add error message
        const errorMessage: ChatMessage = {
          text: 'Sorry, something went wrong. Please try again with a simpler question.',
          isUser: false,
          timestamp: Date.now(),
          isError: true,
        };
        state.ai.messages.push(errorMessage);
        state.ai.loading.isLoading = false;
        state.ai.loading.error = action.payload as string;
      });

    // Check Instagram health
    builder.addCase(checkInstagramHealth.fulfilled, (state, action) => {
      state.health.status = action.payload;
      state.health.lastChecked = new Date().toISOString();
    });

    // Upload file for analysis
    builder
      .addCase(uploadFileForAnalysis.fulfilled, (state, action) => {
        const aiMessage: ChatMessage = {
          text: action.payload.answer,
          isUser: false,
          timestamp: Date.now(),
          sources: action.payload.sources,
          confidence: action.payload.confidence,
          processingTime: action.payload.processingTime,
        };
        state.ai.messages.push(aiMessage);
        state.ai.loading.isLoading = false;
      })
      .addCase(uploadFileForAnalysis.rejected, (state, action) => {
        const errorMessage: ChatMessage = {
          text: 'Failed to analyze the uploaded file. Please try again.',
          isUser: false,
          timestamp: Date.now(),
          isError: true,
        };
        state.ai.messages.push(errorMessage);
        state.ai.loading.error = action.payload as string;
      });

    // Analyze Instagram URL
    builder
      .addCase(analyzeInstagramURL.fulfilled, (state, action) => {
        const aiMessage: ChatMessage = {
          text: action.payload.answer,
          isUser: false,
          timestamp: Date.now(),
          sources: action.payload.sources,
          confidence: action.payload.confidence,
          processingTime: action.payload.processingTime,
        };
        state.ai.messages.push(aiMessage);
        state.ai.loading.isLoading = false;
      })
      .addCase(analyzeInstagramURL.rejected, (state, action) => {
        const errorMessage: ChatMessage = {
          text: 'Failed to analyze the Instagram URL. Please check the URL and try again.',
          isUser: false,
          timestamp: Date.now(),
          isError: true,
        };
        state.ai.messages.push(errorMessage);
        state.ai.loading.error = action.payload as string;
      });

    // Process audio recording
    builder
      .addCase(processAudioRecording.fulfilled, (state, action) => {
        const aiMessage: ChatMessage = {
          text: action.payload.answer,
          isUser: false,
          timestamp: Date.now(),
          sources: action.payload.sources,
          confidence: action.payload.confidence,
          processingTime: action.payload.processingTime,
        };
        state.ai.messages.push(aiMessage);
        state.ai.loading.isLoading = false;
      })
      .addCase(processAudioRecording.rejected, (state, action) => {
        const errorMessage: ChatMessage = {
          text: 'Failed to process the audio recording. Please try again.',
          isUser: false,
          timestamp: Date.now(),
          isError: true,
        };
        state.ai.messages.push(errorMessage);
        state.ai.loading.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  addChatMessage,
  removeChatMessage,
  clearChatMessages,
  updateLastChatMessage,
  startAudioRecording,
  stopAudioRecording,
  updateRecordingState,
  setRecordingError,
  setAttachmentPreview,
  clearAttachmentPreview,
  clearError,
  resetInstagramState,
} = instagramSlice.actions;

// Export reducer
export default instagramSlice.reducer;
