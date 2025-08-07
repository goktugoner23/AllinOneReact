import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  InstagramPostsApiResponse,
  InstagramAnalytics,
  RAGQueryRequest,
  RAGQueryResponse,
  HealthStatus,
  ApiResponse,
} from '../types/Instagram';

class InstagramApiService {
  private api: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    // External API URL - pointing to allinone-external backend
    this.baseURL = __DEV__ 
      ? 'http://129.212.143.6:3000/' 
      : 'http://129.212.143.6:3000/';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 90000, // 90 seconds for Instagram API processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        if (__DEV__) {
          console.log(`📤 Instagram API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('📤 Instagram API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(`📥 Instagram API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('📥 Instagram API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get Instagram posts with smart caching and auto-sync
   * Main endpoint for Posts tab
   */
  async getInstagramPosts(forceSync: boolean = false): Promise<InstagramPostsApiResponse> {
    try {
      const response: AxiosResponse<InstagramPostsApiResponse> = await this.api.get(
        'api/instagram/firestore/posts',
        {
          params: { forceSync }
        }
      );

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
      const response: AxiosResponse<ApiResponse<InstagramAnalytics>> = await this.api.get(
        'api/instagram/analytics'
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error fetching analytics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get Instagram analytics:', error);
      throw this.handleApiError(error, 'Failed to get Instagram analytics');
    }
  }

  /**
   * Query the RAG system for Instagram insights
   * Used for AI chat functionality
   */
  async queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    try {
      const response: AxiosResponse<ApiResponse<RAGQueryResponse>> = await this.api.post(
        'api/rag/query',
        {
          query: request.query,
          domain: request.domain || 'instagram',
          options: {
            topK: request.options?.topK || 5,
            minScore: request.options?.minScore || 0.7,
            ...request.options
          }
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error querying RAG');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to query RAG:', error);
      throw this.handleApiError(error, 'Failed to query RAG');
    }
  }

  /**
   * Check Instagram service health
   * Optional health monitoring
   */
  async checkInstagramHealth(): Promise<HealthStatus> {
    try {
      const response: AxiosResponse<ApiResponse<HealthStatus>> = await this.api.get(
        'api/instagram/status'
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error checking health');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to check Instagram health:', error);
      throw this.handleApiError(error, 'Failed to check Instagram health');
    }
  }

  /**
   * Upload file for multimodal analysis
   * Used for image, audio, PDF analysis
   */
  async uploadFileForAnalysis(
    fileUri: string,
    fileName: string,
    mimeType: string,
    analysisQuery: string
  ): Promise<RAGQueryResponse> {
    try {
      // For now, we'll simulate file upload by sending the query with file info
      // In a real implementation, you'd upload the file first, then analyze
      const query = `Analyze this ${mimeType.split('/')[0]} file (${fileName}) for Instagram insights: ${analysisQuery}`;
      
      return await this.queryRAG({
        query,
        domain: 'instagram',
        options: {
          topK: 5,
          minScore: 0.7
        }
      });
    } catch (error) {
      console.error('Failed to upload and analyze file:', error);
      throw this.handleApiError(error, 'Failed to upload and analyze file');
    }
  }

  /**
   * Analyze Instagram URL
   * Used for URL analysis in AI chat
   */
  async analyzeInstagramURL(url: string, customQuery?: string): Promise<RAGQueryResponse> {
    try {
      if (!this.isValidInstagramURL(url)) {
        throw new Error('Please provide a valid Instagram URL');
      }

      const analysisType = this.getInstagramURLType(url);
      const query = customQuery || this.getDefaultAnalysisQuery(analysisType);
      
      return await this.queryRAG({
        query: `Analyze this Instagram URL and provide strategic insights: ${url}. ${query}`,
        domain: 'instagram',
        options: {
          topK: 5,
          minScore: 0.8 // Higher threshold for URL analysis
        }
      });
    } catch (error) {
      console.error('Failed to analyze Instagram URL:', error);
      throw this.handleApiError(error, 'Failed to analyze Instagram URL');
    }
  }

  /**
   * Process audio recording for analysis
   */
  async processAudioRecording(
    audioFilePath: string,
    analysisQuery: string,
    duration: number
  ): Promise<RAGQueryResponse> {
    try {
      const query = `Analyze this audio recording for Instagram strategy insights. ` +
                   `Duration: ${Math.round(duration / 1000)}s. Question: ${analysisQuery}. ` +
                   `Audio file: ${audioFilePath}`;
      
      return await this.queryRAG({
        query,
        domain: 'instagram',
        options: {
          topK: 5,
          minScore: 0.7
        }
      });
    } catch (error) {
      console.error('Failed to process audio recording:', error);
      throw this.handleApiError(error, 'Failed to process audio recording');
    }
  }

  /**
   * Get the configured base URL for reference
   */
  getBaseUrl(): string {
    return this.baseURL;
  }

  // Private helper methods

  private handleApiError(error: any, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.error || error.response.statusText || defaultMessage;
        return new Error(`${message} (${error.response.status})`);
      } else if (error.request) {
        // Request was made but no response received
        return new Error('Network error - please check your connection');
      }
    }
    
    // Other errors
    return new Error(error.message || defaultMessage);
  }

  private isValidInstagramURL(url: string): boolean {
    return url.includes('instagram.com') && (
      url.includes('/p/') ||          // Post
      url.includes('/reel/') ||       // Reel
      /.*instagram\.com\/[a-zA-Z0-9._]+\/?$/.test(url)  // Profile
    );
  }

  private getInstagramURLType(url: string): string {
    if (url.includes('/p/')) return 'Post';
    if (url.includes('/reel/')) return 'Reel';
    return 'Profile';
  }

  private getDefaultAnalysisQuery(type: string): string {
    switch (type) {
      case 'Post':
        return 'Why did this post perform well/poorly? What can I learn for my content strategy?';
      case 'Reel':
        return 'What makes this reel engaging? How can I apply these insights to my content?';
      case 'Profile':
        return 'What can I learn from this account\'s content strategy and posting patterns?';
      default:
        return 'What strategic insights can I get from this Instagram content?';
    }
  }
}

// Export singleton instance
export const instagramApiService = new InstagramApiService();
export default instagramApiService;