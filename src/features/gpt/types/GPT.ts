export interface AIChatAction {
  type: 'navigate' | 'user_choice' | 'confirmation' | 'data_updated';
  screen?: string;
  params?: Record<string, any>;
  choiceId?: string;
  question?: string;
  options?: string[];
  collection?: string;
}

export interface AIChatResponse {
  success: boolean;
  conversationId: string;
  message: string;
  actions: AIChatAction[];
  model: string;
}

export interface AIChatMessageRequest {
  message: string;
  conversationId?: string;
}

export interface AIChatChoiceResponseRequest {
  conversationId: string;
  choiceId: string;
  selectedOption: string;
}

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  messageCount: number;
  lastMessagePreview: string;
}

export interface ConversationMessage {
  index: number;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  toolCalls?: any[];
  toolCallId?: string;
  name?: string;
  createdAt: string;
}

export interface Conversation extends ConversationMeta {
  messages: ConversationMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface PendingChoice {
  choiceId: string;
  question: string;
  options: string[];
}

export interface PendingConfirmation {
  choiceId: string;
  question: string;
}
