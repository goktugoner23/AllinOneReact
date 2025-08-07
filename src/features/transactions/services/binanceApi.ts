import axios from 'axios';
import { AccountData, PositionData, OrderData } from '../types/BinanceApiModels';

const BASE_URL = 'http://129.212.143.6:3000'; // Change to your allinone-external base URL

// Account & Balance Endpoints

export async function getUsdMAccount(): Promise<AccountData> {
  const res = await axios.get(`${BASE_URL}/api/binance/futures/account`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch USD-M account');
}

export async function getCoinMAccount(): Promise<AccountData> {
  const res = await axios.get(`${BASE_URL}/api/binance/coinm/account`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch COIN-M account');
}

export async function getUsdMBalance(asset: string = 'USDT'): Promise<any> {
  const res = await axios.get(`${BASE_URL}/api/binance/futures/balance/${asset}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || `Failed to fetch USD-M balance for ${asset}`);
}

export async function getCoinMBalance(asset: string = 'USDT'): Promise<any> {
  const res = await axios.get(`${BASE_URL}/api/binance/coinm/balance/${asset}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || `Failed to fetch COIN-M balance for ${asset}`);
}

// Position Endpoints

export async function getUsdMPositions(): Promise<PositionData[]> {
  const res = await axios.get(`${BASE_URL}/api/binance/futures/positions`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch USD-M positions');
}

export async function getCoinMPositions(): Promise<PositionData[]> {
  const res = await axios.get(`${BASE_URL}/api/binance/coinm/positions`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch COIN-M positions');
}

// Order Management Endpoints

export async function getUsdMOrders(symbol?: string, limit?: number, offset?: number): Promise<OrderData[]> {
  const params = new URLSearchParams();
  if (symbol) params.append('symbol', symbol);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const url = `${BASE_URL}/api/binance/futures/orders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axios.get(url);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch USD-M orders');
}

export async function getCoinMOrders(symbol?: string, limit?: number, offset?: number): Promise<OrderData[]> {
  const params = new URLSearchParams();
  if (symbol) params.append('symbol', symbol);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const url = `${BASE_URL}/api/binance/coinm/orders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await axios.get(url);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch COIN-M orders');
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
  const res = await axios.post(`${BASE_URL}/api/binance/futures/orders`, orderData);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to place USD-M order');
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
  const res = await axios.post(`${BASE_URL}/api/binance/coinm/orders`, orderData);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to place COIN-M order');
}

export async function cancelUsdMOrder(symbol: string, orderId: string): Promise<any> {
  const res = await axios.delete(`${BASE_URL}/api/binance/futures/orders/${symbol}/${orderId}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to cancel USD-M order');
}

export async function cancelCoinMOrder(symbol: string, orderId: string): Promise<any> {
  const res = await axios.delete(`${BASE_URL}/api/binance/coinm/orders/${symbol}/${orderId}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to cancel COIN-M order');
}

export async function cancelAllUsdMOrders(symbol: string): Promise<any> {
  const res = await axios.delete(`${BASE_URL}/api/binance/futures/orders/${symbol}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to cancel all USD-M orders');
}

export async function cancelAllCoinMOrders(symbol: string): Promise<any> {
  const res = await axios.delete(`${BASE_URL}/api/binance/coinm/orders/${symbol}`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to cancel all COIN-M orders');
}

export async function setTakeProfitStopLoss(data: {
  symbol: string;
  side: 'BUY' | 'SELL';
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}): Promise<any> {
  const res = await axios.post(`${BASE_URL}/api/binance/futures/tpsl`, data);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to set Take Profit and Stop Loss');
}

export async function setCoinMTakeProfitStopLoss(data: {
  symbol: string;
  side: 'BUY' | 'SELL';
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}): Promise<any> {
  const res = await axios.post(`${BASE_URL}/api/binance/coinm/tpsl`, data);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to set COIN-M Take Profit and Stop Loss');
}

// Market Data Endpoints

export async function getUsdMPrice(symbol?: string): Promise<any> {
  const url = symbol 
    ? `${BASE_URL}/api/binance/futures/price/${symbol}`
    : `${BASE_URL}/api/binance/futures/price`;
  const res = await axios.get(url);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch USD-M price');
}

export async function getCoinMPrice(symbol?: string): Promise<any> {
  const url = symbol 
    ? `${BASE_URL}/api/binance/coinm/price/${symbol}`
    : `${BASE_URL}/api/binance/coinm/price`;
  const res = await axios.get(url);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch COIN-M price');
}

// Health Check

export async function getHealthStatus(): Promise<any> {
  const res = await axios.get(`${BASE_URL}/health`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch health status');
}

// WebSocket Status

export async function getWebSocketStatus(): Promise<any> {
  const res = await axios.get(`${BASE_URL}/api/binance/websocket/status`);
  if (res.data.success && res.data.data) return res.data.data;
  throw new Error(res.data.error || 'Failed to fetch WebSocket status');
}
