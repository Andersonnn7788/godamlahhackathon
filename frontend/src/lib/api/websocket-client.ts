import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types/api';
import { API_CONFIG } from '@/lib/utils/constants';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: <T>(message: WebSocketMessage<T>) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(config: WebSocketConfig): Socket {
    this.config = config;

    this.socket = io(API_CONFIG.wsURL, {
      path: '/ws/sign-language',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    // Event handlers
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.config.onDisconnect?.();
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      this.config.onError?.(error);
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.config.onMessage?.(message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send<T>(message: WebSocketMessage<T>): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message', message);
    } else {
      console.warn('WebSocket not connected. Message not sent.');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
