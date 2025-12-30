import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import BinanceWebSocketService from '@features/transactions/services/binanceWebSocket';
import { logger } from '@shared/utils/logger';

type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
  timestamp?: number;
};

type MessageHandler = (message: WebSocketMessage) => void;

interface FuturesWebSocketContextValue {
  connected: boolean;
  addListener: (type: string, handler: MessageHandler) => void;
  removeListener: (type: string, handler: MessageHandler) => void;
  subscribeToPositions: () => void;
  subscribeToOrders: () => void;
  subscribeToBalance: () => void;
  subscribeToTicker: (symbol: string) => void;
  unsubscribeFromTicker: (symbol: string) => void;
}

const FuturesWebSocketContext = createContext<FuturesWebSocketContextValue | undefined>(undefined);

export function FuturesWebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const serviceRef = useRef<BinanceWebSocketService | null>(null);
  const listenersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  useEffect(() => {
    // Initialize service once
    if (!serviceRef.current) {
      serviceRef.current = new BinanceWebSocketService({
        onMessage: (message) => {
          try {
            const typeListeners = listenersRef.current.get(message.type);
            if (typeListeners && typeListeners.size > 0) {
              typeListeners.forEach((handler) => handler(message));
            }
          } catch (error) {
            logger.error('Error dispatching WS message to listeners', error, 'FuturesWebSocketProvider');
          }
        },
        onConnectionChange: (isConnected) => {
          setConnected(isConnected);
        },
        onError: (error) => {
          // Log as warning instead of error - connection failures are expected when server is down
          logger.warn('WebSocket connection issue', { error }, 'FuturesWebSocketProvider');
        },
      });

      serviceRef.current.connect();
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
        serviceRef.current = null;
      }
    };
  }, []);

  const addListener = (type: string, handler: MessageHandler) => {
    const set = listenersRef.current.get(type) || new Set<MessageHandler>();
    set.add(handler);
    listenersRef.current.set(type, set);
  };

  const removeListener = (type: string, handler: MessageHandler) => {
    const set = listenersRef.current.get(type);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listenersRef.current.delete(type);
  };

  const value: FuturesWebSocketContextValue = useMemo(
    () => ({
      connected,
      addListener,
      removeListener,
      subscribeToPositions: () => serviceRef.current?.subscribeToPositions(),
      subscribeToOrders: () => serviceRef.current?.subscribeToOrders(),
      subscribeToBalance: () => serviceRef.current?.subscribeToBalance(),
      subscribeToTicker: (symbol: string) => serviceRef.current?.subscribeToTicker(symbol),
      unsubscribeFromTicker: (symbol: string) => serviceRef.current?.unsubscribeFromTicker(symbol),
    }),
    [connected],
  );

  return <FuturesWebSocketContext.Provider value={value}>{children}</FuturesWebSocketContext.Provider>;
}

export function useFuturesWebSocket(): FuturesWebSocketContextValue {
  const ctx = useContext(FuturesWebSocketContext);
  if (!ctx) throw new Error('useFuturesWebSocket must be used within a FuturesWebSocketProvider');
  return ctx;
}
