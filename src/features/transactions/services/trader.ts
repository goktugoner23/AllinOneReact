// Mirror of huginn-webapp/src/modules/v1.0/investments/services/index.ts
// trader fetchers. All routes are protected via Bearer; httpClient already
// adds the header. Names match the webapp on purpose so anyone reading both
// codebases can grep one set.

import { api } from '@shared/services/api/httpClient';
import type {
  BotConfig,
  BotConfigPatch,
  BotStatus,
  TraderModeStats,
  TwitterAccount,
  TweetEntry,
  NewsEntry,
  TradeSignal,
} from '../types/Trader';
import type { TradeLogEntry } from '../types/TradeLog';

/* ── Bot config + status ── */

export function getBotConfig() {
  return api.get<BotConfig | null>('/api/trader/config');
}

export function updateBotConfig(patch: BotConfigPatch) {
  return api.patch<BotConfig | null>('/api/trader/config', patch);
}

export function getBotStatus() {
  return api.get<BotStatus>('/api/trader/status');
}

/* ── Bot positions / history (filterable by live|paper) ── */

export function getBotPositions(limit: number = 50, mode?: 'live' | 'paper') {
  const params: Record<string, string | number> = { limit };
  if (mode) params.mode = mode;
  return api.get<TradeLogEntry[]>('/api/trader/positions', { searchParams: params });
}

export function getBotHistory(
  limit: number = 50,
  status?: string,
  mode?: 'live' | 'paper'
) {
  const params: Record<string, string | number> = { limit };
  if (status) params.status = status;
  if (mode) params.mode = mode;
  return api.get<TradeLogEntry[]>('/api/trader/history', { searchParams: params });
}

export function getTraderModeStats(mode: 'live' | 'paper') {
  return api.get<TraderModeStats>('/api/trader/stats', {
    searchParams: { mode },
  });
}

/* ── Twitter accounts ── */

export function listTwitterAccounts() {
  return api.get<TwitterAccount[]>('/api/trader/accounts');
}

export function addTwitterAccount(handle: string, displayName?: string) {
  return api.post<TwitterAccount>('/api/trader/accounts', {
    handle,
    display_name: displayName,
  });
}

export function removeTwitterAccount(id: number) {
  return api.delete<{ removed: boolean }>(`/api/trader/accounts/${id}`);
}

export function setTwitterAccountEnabled(id: number, enabled: boolean) {
  return api.patch<{ updated: boolean }>(`/api/trader/accounts/${id}`, {
    enabled,
  });
}

/* ── Signal feed ── */

export function getTweets(limit: number = 50, offset: number = 0, symbol?: string) {
  const params: Record<string, string | number> = { limit, offset };
  if (symbol) params.symbol = symbol;
  return api.get<TweetEntry[]>('/api/trader/tweets', { searchParams: params });
}

export function getNews(limit: number = 50, offset: number = 0, symbol?: string) {
  const params: Record<string, string | number> = { limit, offset };
  if (symbol) params.symbol = symbol;
  return api.get<NewsEntry[]>('/api/trader/news', { searchParams: params });
}

export function getSignals(limit: number = 50, offset: number = 0) {
  return api.get<TradeSignal[]>('/api/trader/signals', {
    searchParams: { limit, offset },
  });
}

/* ── Emergency stop ── */

export function emergencyStopBot() {
  return api.post<{ cancelled: number }>('/api/trader/emergency-stop');
}
