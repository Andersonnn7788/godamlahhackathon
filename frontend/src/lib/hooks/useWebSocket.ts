import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { wsClient, ConnectionStatus, WebSocketConfig } from '@/lib/api/websocket-client';
import { WebSocketMessage } from '@/types/api';

export interface WebSocketState {
  status: ConnectionStatus;
  error: Error | null;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(config?: Partial<WebSocketConfig>) {
  const [state, setState] = useState<WebSocketState>({
    status: 'disconnected',
    error: null,
    lastMessage: null,
  });

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'connecting', error: null }));

    const wsConfig: WebSocketConfig = {
      onConnect: () => {
        setState((prev) => ({ ...prev, status: 'connected', error: null }));
        config?.onConnect?.();
      },
      onDisconnect: () => {
        setState((prev) => ({ ...prev, status: 'disconnected' }));
        config?.onDisconnect?.();
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, status: 'error', error }));
        config?.onError?.(error);
      },
      onMessage: (message) => {
        setState((prev) => ({ ...prev, lastMessage: message }));
        config?.onMessage?.(message);
      },
    };

    socketRef.current = wsClient.connect(wsConfig);
  }, [config]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    socketRef.current = null;
    setState((prev) => ({ ...prev, status: 'disconnected' }));
  }, []);

  const sendMessage = useCallback(<T,>(message: WebSocketMessage<T>) => {
    if (state.status === 'connected') {
      wsClient.send(message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [state.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendMessage,
    isConnected: state.status === 'connected',
  };
}
