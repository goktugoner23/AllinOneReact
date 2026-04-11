import { api } from '@shared/services/api/httpClient';
import { TradeLogEntry } from '../types/TradeLog';

export async function getTradeLog(
  status?: string,
  limit: number = 50,
  offset: number = 0,
  mode?: 'live' | 'paper'
): Promise<TradeLogEntry[]> {
  const params: Record<string, string | number> = { limit, offset };
  if (status) params.status = status;
  if (mode) params.mode = mode;
  return api.get<TradeLogEntry[]>('/api/binance/trade-log', { searchParams: params });
}

export async function getTradeById(id: number): Promise<TradeLogEntry> {
  return api.get<TradeLogEntry>(`/api/binance/trade-log/${id}`);
}

export async function updateTradeNotes(id: number, notes: string): Promise<TradeLogEntry> {
  return api.put<TradeLogEntry>(`/api/binance/trade-log/${id}/notes`, { notes });
}

export async function deleteTrade(id: number): Promise<void> {
  await api.delete(`/api/binance/trade-log/${id}`);
}
