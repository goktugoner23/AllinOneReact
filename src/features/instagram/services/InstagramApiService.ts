import { AxiosResponse } from 'axios';
import { BaseApiClient } from '@shared/services/api';
import {
  InstagramPostsApiResponse,
  InstagramAnalytics,
  RAGQueryRequest,
  RAGQueryResponse,
  HealthStatus,
  ApiResponse,
} from '@features/instagram/types/Instagram';

class InstagramApiService extends BaseApiClient {
  constructor() {
    // External API URL - pointing to allinone-external backend
    const baseURL = __DEV__ 
      ? 'http://129.212.143.6:3000/' 
      : 'http://129.212.143.6:3000/';
    
    super(baseURL, 90000); // 90 seconds for Instagram API processing
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
      const form = new FormData();
      // React Native requires { uri, name, type } for file field
      form.append('file', {
        // @ts-ignore React Native FormData file type
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });
      form.append('query', analysisQuery);
      form.append('contentType', mimeType.split('/')[0]);

      const response: AxiosResponse<ApiResponse<RAGQueryResponse>> = await this.api.post(
        'api/rag/upload',
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120_000,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error uploading file');
      }

      return response.data.data;
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

      const response: AxiosResponse<ApiResponse<RAGQueryResponse>> = await this.api.post(
        'api/rag/instagram/analyze',
        { url, query },
        { timeout: 90_000 }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Unknown error analyzing Instagram URL');
      }

      return response.data.data;
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