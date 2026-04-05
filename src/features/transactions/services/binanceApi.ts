import { api } from '@shared/services/api/httpClient';
import { AccountData, PositionData, OrderData } from '../types/BinanceApiModels';

/**
 * Binance REST endpoints (huginn-external /api/binance/*). Uses the shared
 * fetch-based httpClient which auto-injects the Bearer token, prefixes
 * API_BASE_URL, and unwraps the `{ success, data }` envelope — so these
 * helpers can just `return api.get(...)` for envelope responses.
 *
 * `/health` returns a flat payload (no envelope), so it uses a local
 * raw-fetch helper (`getFlat`), matching the pattern in muninnApiService.
 */

import { API_BASE_URL, HuginnApiError } from '@shared/services/api/httpClient';
import { HUGINN_API_TOKEN } from '@env';

async function getFlat<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(HUGINN_API_TOKEN ? { Authorization: `Bearer ${HUGINN_API_TOKEN}` } : {}),
    },
  });
  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new HuginnApiError(
      (payload && (payload.error || payload.message)) || `GET ${path} failed (${res.status})`,
      res.status,
    );
  }
  return payload as T;
}

// Account & Balance Endpoints

export async function getUsdMAccount(): Promise<AccountData> {
  return api.get<AccountData>('/api/binance/futures/account');
}

export async function getCoinMAccount(): Promise<AccountData> {
  return api.get<AccountData>('/api/binance/coinm/account');
}

export async function getUsdMBalance(asset: string = 'USDT'): Promise<any> {
  return api.get<any>(`/api/binance/futures/balance/${asset}`);
}

export async function getCoinMBalance(asset: string = 'USDT'): Promise<any> {
  return api.get<any>(`/api/binance/coinm/balance/${asset}`);
}

// Position Endpoints

export async function getUsdMPositions(): Promise<PositionData[]> {
  return api.get<PositionData[]>('/api/binance/futures/positions');
}

export async function getCoinMPositions(): Promise<PositionData[]> {
  return api.get<PositionData[]>('/api/binance/coinm/positions');
}

// Order Management Endpoints

function buildOrderSearchParams(symbol?: string, limit?: number, offset?: number) {
  const sp: Record<string, string | number> = {};
  if (symbol) sp.symbol = symbol;
  if (limit) sp.limit = limit;
  if (offset) sp.offset = offset;
  return sp;
}

export async function getUsdMOrders(symbol?: string, limit?: number, offset?: number): Promise<OrderData[]> {
  return api.get<OrderData[]>('/api/binance/futures/orders', {
    searchParams: buildOrderSearchParams(symbol, limit, offset),
  });
}

export async function getCoinMOrders(symbol?: string, limit?: number, offset?: number): Promise<OrderData[]> {
  return api.get<OrderData[]>('/api/binance/coinm/orders', {
    searchParams: buildOrderSearchParams(symbol, limit, offset),
  });
}

export async function placeUsdMOrder(orderData: {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
  reduceOnly?: boolean;
  positionSide?: string;
}): Promise<any> {
  return api.post<any>('/api/binance/futures/orders', orderData);
}

export async function placeCoinMOrder(orderData: {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
  reduceOnly?: boolean;
  positionSide?: string;
}): Promise<any> {
  return api.post<any>('/api/binance/coinm/orders', orderData);
}

export async function cancelUsdMOrder(symbol: string, orderId: string): Promise<any> {
  return api.delete<any>(`/api/binance/futures/orders/${symbol}/${orderId}`);
}

export async function cancelCoinMOrder(symbol: string, orderId: string): Promise<any> {
  return api.delete<any>(`/api/binance/coinm/orders/${symbol}/${orderId}`);
}

export async function cancelAllUsdMOrders(symbol: string): Promise<any> {
  return api.delete<any>(`/api/binance/futures/orders/${symbol}`);
}

export async function cancelAllCoinMOrders(symbol: string): Promise<any> {
  return api.delete<any>(`/api/binance/coinm/orders/${symbol}`);
}

export async function setTakeProfitStopLoss(data: {
  symbol: string;
  side: 'BUY' | 'SELL';
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}): Promise<any> {
  return api.post<any>('/api/binance/futures/tpsl', data);
}

export async function setCoinMTakeProfitStopLoss(data: {
  symbol: string;
  side: 'BUY' | 'SELL';
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}): Promise<any> {
  return api.post<any>('/api/binance/coinm/tpsl', data);
}

// Market Data Endpoints

export async function getUsdMPrice(symbol?: string): Promise<any> {
  const path = symbol ? `/api/binance/futures/price/${symbol}` : '/api/binance/futures/price';
  return api.get<any>(path);
}

export async function getCoinMPrice(symbol?: string): Promise<any> {
  const path = symbol ? `/api/binance/coinm/price/${symbol}` : '/api/binance/coinm/price';
  return api.get<any>(path);
}

// Health Check — /health returns a flat payload (no envelope), use raw fetch.
export async function getHealthStatus(): Promise<any> {
  return getFlat<any>('/health');
}

// WebSocket Status
export async function getWebSocketStatus(): Promise<any> {
  return api.get<any>('/api/binance/websocket/status');
}
