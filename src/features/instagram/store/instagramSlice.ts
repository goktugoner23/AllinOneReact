import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  InstagramState,
  InstagramPostsData,
  InstagramAnalytics,
  HealthStatus,
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

// Check Instagram health
export const checkInstagramHealth = createAsyncThunk('instagram/checkHealth', async (_, { rejectWithValue }) => {
  try {
    return await instagramApiService.checkInstagramHealth();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to check health');
  }
});

// Instagram slice
const instagramSlice = createSlice({
  name: 'instagram',
  initialState,
  reducers: {
    // Error handling
    clearError: (state, action: PayloadAction<'posts' | 'analytics'>) => {
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

    // Check Instagram health
    builder.addCase(checkInstagramHealth.fulfilled, (state, action) => {
      state.health.status = action.payload;
      state.health.lastChecked = new Date().toISOString();
    });

  },
});

// Export actions
export const {
  clearError,
  resetInstagramState,
} = instagramSlice.actions;

// Export reducer
export default instagramSlice.reducer;
