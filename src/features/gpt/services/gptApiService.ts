import { AxiosResponse } from 'axios';
import { BaseApiClient } from '@shared/services/api';
import {
  AIChatResponse,
  AIChatMessageRequest,
  AIChatChoiceResponseRequest,
  ConversationMeta,
  Conversation,
} from '../types/GPT';
import { API_BASE_URL_DEV, API_BASE_URL_PROD } from '@env';

class GPTApiService extends BaseApiClient {
  constructor() {
    const baseURL = __DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD;
    super(baseURL, 120000); // 120s timeout for AI calls
  }

  async sendMessage(request: AIChatMessageRequest): Promise<AIChatResponse> {
    try {
      const response: AxiosResponse<AIChatResponse> = await this.api.post(
        'api/ai-chat/message',
        request,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to send message');
    }
  }

  async sendChoiceResponse(
    conversationId: string,
    choiceId: string,
    selectedOption: string,
  ): Promise<AIChatResponse> {
    try {
      const body: AIChatChoiceResponseRequest = { conversationId, choiceId, selectedOption };
      const response: AxiosResponse<AIChatResponse> = await this.api.post(
        'api/ai-chat/choice-response',
        body,
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to send choice response');
    }
  }

  async getConversations(): Promise<ConversationMeta[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ConversationMeta[] }> =
        await this.api.get('api/ai-chat/conversations');
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get conversations');
    }
  }

  async getConversation(id: string): Promise<Conversation> {
    try {
      const response: AxiosResponse<{ success: boolean; data: Conversation }> =
        await this.api.get(`api/ai-chat/conversations/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get conversation');
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      await this.api.delete(`api/ai-chat/conversations/${id}`);
    } catch (error) {
      throw this.handleApiError(error, 'Failed to delete conversation');
    }
  }

  async updateTitle(id: string, title: string): Promise<void> {
    try {
      await this.api.patch(`api/ai-chat/conversations/${id}`, { title });
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update title');
    }
  }
}

export const gptApiService = new GPTApiService();
export default gptApiService;
