/**
 * Muninn chat service — talks to huginn-external /api/muninn/*.
 *
 * Replaces the legacy axios-based ai-chat client. Uses the shared
 * fetch-based `api` client from httpClient. huginn-external excludes
 * /api/muninn from the Bearer-protected path set (see app.ts registerProtected
 * allow-list), so these endpoints work with or without HUGINN_API_TOKEN — the
 * token tags along via httpClient.authHeaders() and is ignored by the server.
 *
 * API envelope quirk: POST /message and POST /choice-response return a FLAT
 * MuninnChatResponse (`{ success, conversationId, message, actions, model }`)
 * rather than the `{ success, data }` envelope used by the rest of
 * huginn-external. httpClient's auto-unwrap would drop the payload, so we hit
 * those two endpoints via a local raw-fetch helper. GET /conversations and
 * /conversations/:id use the real envelope and go through `api.*` normally.
 */

import { api, API_BASE_URL, HuginnApiError } from '@shared/services/api/httpClient';
import { HUGINN_API_TOKEN } from '@env';
import type {
  MuninnChatResponse,
  MuninnChatMessageRequest,
  MuninnChatChoiceResponseRequest,
  ConversationMeta,
  Conversation,
} from '../types/Muninn';

// 120s timeout — AI calls can be slow when tool-calling expands the loop.
const CHAT_TIMEOUT_MS = 120_000;

async function postFlat<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(HUGINN_API_TOKEN ? { Authorization: `Bearer ${HUGINN_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;
    if (!res.ok || (payload && payload.success === false)) {
      const message = payload?.error || `muninn ${path} failed (${res.status})`;
      throw new HuginnApiError(message, res.status);
    }
    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendMessage(
  request: MuninnChatMessageRequest,
): Promise<MuninnChatResponse> {
  return postFlat<MuninnChatResponse>('/api/muninn/message', request);
}

export async function sendChoiceResponse(
  conversationId: string,
  choiceId: string,
  selectedOption: string,
): Promise<MuninnChatResponse> {
  const body: MuninnChatChoiceResponseRequest = { conversationId, choiceId, selectedOption };
  return postFlat<MuninnChatResponse>('/api/muninn/choice-response', body);
}

export async function getConversations(): Promise<ConversationMeta[]> {
  return api.get<ConversationMeta[]>('/api/muninn/conversations');
}

export async function getConversation(id: string): Promise<Conversation> {
  return api.get<Conversation>(`/api/muninn/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete<unknown>(`/api/muninn/conversations/${id}`);
}

export async function updateTitle(id: string, title: string): Promise<void> {
  await api.patch<unknown>(`/api/muninn/conversations/${id}`, { title });
}

// Back-compat object wrapper so callers importing `muninnApiService.xxx`
// work without per-call rewrites.
export const muninnApiService = {
  sendMessage,
  sendChoiceResponse,
  getConversations,
  getConversation,
  deleteConversation,
  updateTitle,
};

export default muninnApiService;
