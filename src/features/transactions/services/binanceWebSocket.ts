import { logger } from '@shared/utils/logger';

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;
  private shouldReconnect = true;
  private callbacks: WebSocketCallbacks = {};
  private subscribedChannels: Set<string> = new Set();

  private readonly BASE_WS_URL = 'ws://129.212.143.6:3000';

  constructor(callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  connect() {
    try {
      logger.debug('Connecting to Binance WebSocket', {}, 'BinanceWebSocket');

      this.ws = new WebSocket(this.BASE_WS_URL);

      this.ws.onopen = () => {
        logger.debug('WebSocket connected successfully', {}, 'BinanceWebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.callbacks.onConnectionChange?.(true);
        this.startHeartbeat();
        this.sendWelcomeMessage();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.debug('WebSocket message received', { type: message.type }, 'BinanceWebSocket');

          this.handleMessage(message);
          this.callbacks.onMessage?.(message);
        } catch (error) {
          logger.error('Error parsing WebSocket message', error, 'BinanceWebSocket');
        }
      };

      this.ws.onclose = (event) => {
        logger.debug('WebSocket closed', { code: event.code, reason: event.reason }, 'BinanceWebSocket');
        this.isConnected = false;
        this.callbacks.onConnectionChange?.(false);
        this.stopHeartbeat();

        if (this.shouldReconnect && event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', error, 'BinanceWebSocket');
        this.callbacks.onError?.('WebSocket connection error');
      };
    } catch (error) {
      logger.error('Error creating WebSocket connection', error, 'BinanceWebSocket');
      this.callbacks.onError?.('Failed to create WebSocket connection');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'welcome':
        logger.debug('Welcome message received', { message: message.message }, 'BinanceWebSocket');
        break;
      case 'pong':
        logger.debug('Heartbeat pong received', {}, 'BinanceWebSocket');
        break;
      case 'error':
        logger.error('WebSocket error message', { error: message.message }, 'BinanceWebSocket');
        this.callbacks.onError?.(message.message || 'Unknown WebSocket error');
        break;
      default:
        logger.debug('Message handled by callback', { type: message.type }, 'BinanceWebSocket');
    }
  }

  private sendWelcomeMessage() {
    this.send({
      type: 'ping',
      timestamp: Date.now(),
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          timestamp: Date.now(),
        });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', {}, 'BinanceWebSocket');
      this.callbacks.onError?.('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.debug('Attempting reconnection', { attempt: this.reconnectAttempts, delay }, 'BinanceWebSocket');

    setTimeout(() => {
      if (this.shouldReconnect && !this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Subscription methods
  subscribeToPositions() {
    this.send({
      type: 'subscribe',
      channel: 'positions',
    });
    this.subscribedChannels.add('positions');
  }

  subscribeToOrders() {
    this.send({
      type: 'subscribe',
      channel: 'orders',
    });
    this.subscribedChannels.add('orders');
  }

  subscribeToBalance() {
    this.send({
      type: 'subscribe',
      channel: 'balance',
    });
    this.subscribedChannels.add('balance');
  }

  subscribeToTicker(symbol: string) {
    this.send({
      type: 'subscribe',
      channel: 'ticker',
      symbol,
    });
    this.subscribedChannels.add(`ticker:${symbol}`);
  }

  subscribeToDepth(symbol: string, levels: number = 10) {
    this.send({
      type: 'subscribe',
      channel: 'depth',
      symbol,
      levels,
    });
    this.subscribedChannels.add(`depth:${symbol}`);
  }

  subscribeToTrades(symbol: string) {
    this.send({
      type: 'subscribe',
      channel: 'trades',
      symbol,
    });
    this.subscribedChannels.add(`trades:${symbol}`);
  }

  // Unsubscription methods
  unsubscribeFromPositions() {
    this.send({
      type: 'unsubscribe',
      channel: 'positions',
    });
    this.subscribedChannels.delete('positions');
  }

  unsubscribeFromOrders() {
    this.send({
      type: 'unsubscribe',
      channel: 'orders',
    });
    this.subscribedChannels.delete('orders');
  }

  unsubscribeFromBalance() {
    this.send({
      type: 'unsubscribe',
      channel: 'balance',
    });
    this.subscribedChannels.delete('balance');
  }

  unsubscribeFromTicker(symbol: string) {
    this.send({
      type: 'unsubscribe',
      channel: 'ticker',
      symbol,
    });
    this.subscribedChannels.delete(`ticker:${symbol}`);
  }

  unsubscribeFromDepth(symbol: string) {
    this.send({
      type: 'unsubscribe',
      channel: 'depth',
      symbol,
    });
    this.subscribedChannels.delete(`depth:${symbol}`);
  }

  unsubscribeFromTrades(symbol: string) {
    this.send({
      type: 'unsubscribe',
      channel: 'trades',
      symbol,
    });
    this.subscribedChannels.delete(`trades:${symbol}`);
  }

  // Utility methods
  send(message: any) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message));
        logger.debug('Message sent', { message }, 'BinanceWebSocket');
      } catch (error) {
        logger.error('Error sending message', error, 'BinanceWebSocket');
      }
    } else {
      logger.warn('Cannot send message - WebSocket not connected', {}, 'BinanceWebSocket');
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.subscribedChannels.clear();
    logger.debug('WebSocket disconnected', {}, 'BinanceWebSocket');
  }

  resetConnection() {
    this.disconnect();
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 1000);
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      subscribedChannels: Array.from(this.subscribedChannels),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default BinanceWebSocketService;
