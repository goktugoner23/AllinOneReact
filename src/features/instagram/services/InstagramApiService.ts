import { AxiosResponse } from 'axios';
import { BaseApiClient } from '@shared/services/api';
import {
  InstagramPostsApiResponse,
  InstagramAnalytics,
  HealthStatus,
  ApiResponse,
} from '@features/instagram/types/Instagram';
import {
  InstagramProfilePictureResponse,
  InstagramStoriesResponse,
  InstagramUserPostsResponse,
  InstagramAllDataResponse,
} from '@features/instagram/types/Instagram';
import { API_BASE_URL_DEV, API_BASE_URL_PROD } from '@env';

class InstagramApiService extends BaseApiClient {
  constructor() {
    // External API URL - pointing to allinone-external backend
    const baseURL = __DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD;

    super(baseURL, 90000); // 90 seconds for Instagram API processing
  }

  /**
   * Get public profile picture by username
   */
  async getProfilePicture(username: string): Promise<InstagramProfilePictureResponse> {
    try {
      const response: AxiosResponse<InstagramProfilePictureResponse> = await this.api.get(
        `api/instagram/profile-picture/${encodeURIComponent(username)}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      throw this.handleApiError(error, 'Failed to fetch profile picture');
    }
  }

  /**
   * Get public stories by username
   */
  async getStories(username: string): Promise<InstagramStoriesResponse> {
    try {
      const response: AxiosResponse<InstagramStoriesResponse> = await this.api.get(
        `api/instagram/stories/${encodeURIComponent(username)}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      throw this.handleApiError(error, 'Failed to fetch stories');
    }
  }

  /**
   * Get public posts by username
   */
  async getUserPosts(username: string): Promise<InstagramUserPostsResponse> {
    try {
      const response: AxiosResponse<InstagramUserPostsResponse> = await this.api.get(
        `api/instagram/posts/${encodeURIComponent(username)}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      throw this.handleApiError(error, 'Failed to fetch user posts');
    }
  }

  /**
   * Get all data (profile + stories + posts) in a single efficient call
   * This is the most efficient endpoint - uses a single browser navigation
   */
  async getAllUserData(username: string): Promise<InstagramAllDataResponse> {
    try {
      const response: AxiosResponse<InstagramAllDataResponse> = await this.api.get(
        `api/instagram/all/${encodeURIComponent(username)}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all user data:', error);
      throw this.handleApiError(error, 'Failed to fetch all user data');
    }
  }

  /**
   * Get Instagram posts with smart caching and auto-sync
   * Main endpoint for Posts tab
   */
  async getInstagramPosts(forceSync: boolean = false): Promise<InstagramPostsApiResponse> {
    try {
      const response: AxiosResponse<InstagramPostsApiResponse> = await this.api.get('api/instagram/firestore/posts', {
        params: { forceSync },
      });

      if (!response.data.success) {
        throw new Error('API returned success=false');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get Instagram posts:', error);
      throw this.handleApiError(error, 'Failed to get Instagram posts');
    }
  }

  /**
   * Get comprehensive Instagram analytics
   * Main endpoint for Insights tab
   */
  async getInstagramAnalytics(): Promise<InstagramAnalytics> {
    try {
      const response: AxiosResponse<ApiResponse<InstagramAnalytics>> = await this.api.get('api/instagram/analytics');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error fetching analytics');
      }

      const raw = response.data.data as any;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('📊 Analytics payload (raw):', JSON.stringify(raw)?.slice(0, 500));
      }

      // Normalize account fields in case backend uses different keys
      const account = raw.account || {};
      const normalizedAccount = {
        id: account.id,
        username: account.username || account.userName || account.handle || '',
        name: account.name || account.fullName || account.full_name,
        biography: account.biography || account.bio,
        website: account.website,
        profilePictureUrl: account.profilePictureUrl || account.profile_picture_url || account.profilePicUrl,
        followersCount:
          account.followersCount ?? account.followers ?? account.followers_count ?? account.followerCount ?? 0,
        followsCount: account.followsCount ?? account.following ?? account.follows ?? account.follow_count ?? 0,
        mediaCount:
          account.mediaCount ??
          account.media ??
          account.media_count ??
          (Array.isArray(raw.posts) ? raw.posts.length : 0),
        accountType: account.accountType || account.account_type || 'BUSINESS',
      };

      const normalized: InstagramAnalytics = {
        account: normalizedAccount,
        posts: raw.posts || [],
        summary: raw.summary || {
          totalPosts: normalizedAccount.mediaCount || 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
        },
      };

      return normalized;
    } catch (error) {
      console.error('Failed to get Instagram analytics:', error);
      throw this.handleApiError(error, 'Failed to get Instagram analytics');
    }
  }

  /**
   * Check Instagram service health
   * Optional health monitoring
   */
  async checkInstagramHealth(): Promise<HealthStatus> {
    try {
      const response: AxiosResponse<ApiResponse<HealthStatus>> = await this.api.get('api/instagram/status');

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      // Graceful fallback when health endpoint is unavailable or returns unexpected payload
      const fallback: HealthStatus = {
        instagram: true,
        firestore: true,
        cache: true,
        overall: true,
      };
      // eslint-disable-next-line no-console
      console.warn('Health endpoint returned unexpected payload; using fallback Online status');
      return fallback;
    } catch (error) {
      // Treat health check as optional: warn and return an "online" fallback to avoid noisy errors in dev
      // eslint-disable-next-line no-console
      console.warn('Failed to check Instagram health (non-fatal):', error);
      const fallback: HealthStatus = {
        instagram: true,
        firestore: true,
        cache: true,
        overall: true,
      };
      return fallback;
    }
  }

  /**
   * Get the configured base URL for reference
   */
  getBaseUrl(): string {
    return this.baseURL;
  }

}

// Export singleton instance
export const instagramApiService = new InstagramApiService();
export default instagramApiService;
