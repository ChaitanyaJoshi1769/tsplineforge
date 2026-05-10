/**
 * WebSocket client for real-time features
 * Provides connection management, reconnection logic, and message handling
 */

export enum WebSocketState {
  Disconnected = 'DISCONNECTED',
  Connecting = 'CONNECTING',
  Connected = 'CONNECTED',
  Reconnecting = 'RECONNECTING',
  Closed = 'CLOSED',
}

export enum WebSocketMessageType {
  // Connection
  Ping = 'PING',
  Pong = 'PONG',

  // Data sync
  DataUpdate = 'DATA_UPDATE',
  DataSync = 'DATA_SYNC',

  // Collaboration
  UserJoined = 'USER_JOINED',
  UserLeft = 'USER_LEFT',
  CursorMove = 'CURSOR_MOVE',
  SelectionChange = 'SELECTION_CHANGE',

  // Operations
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',

  // Custom
  Custom = 'CUSTOM',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: number;
  id?: string;
}

export interface WebSocketClientOptions {
  url: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  pingIntervalMs?: number;
  messageTimeoutMs?: number;
}

export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: WebSocketState) => void;
}

export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.Disconnected;
  private reconnect: boolean;
  private maxReconnectAttempts: number;
  private initialReconnectDelayMs: number;
  private maxReconnectDelayMs: number;
  private pingIntervalMs: number;
  private messageTimeoutMs: number;

  private reconnectAttempts = 0;
  private pingTimerId: NodeJS.Timeout | null = null;
  private reconnectTimerId: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, (message: WebSocketMessage) => void>();
  private eventHandlers: WebSocketEventHandlers = {};

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnect = options.reconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.initialReconnectDelayMs = options.initialReconnectDelayMs ?? 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 30000;
    this.pingIntervalMs = options.pingIntervalMs ?? 30000;
    this.messageTimeoutMs = options.messageTimeoutMs ?? 10000;
  }

  /**
   * Register event handlers
   */
  on(event: keyof WebSocketEventHandlers, handler: (...args: unknown[]) => void): void {
    this.eventHandlers[event] = handler as never;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === WebSocketState.Connected || this.state === WebSocketState.Connecting) {
      return;
    }

    this.setState(WebSocketState.Connecting);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.setState(WebSocketState.Connected);
          this.startPing();
          this.eventHandlers.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event.type}`);
          this.eventHandlers.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.setState(WebSocketState.Closed);
          this.stopPing();
          this.eventHandlers.onDisconnect?.();

          if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.setState(WebSocketState.Disconnected);
          }
        };
      } catch (error) {
        this.setState(WebSocketState.Disconnected);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopPing();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState(WebSocketState.Disconnected);
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.state !== WebSocketState.Connected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send message and wait for response
   */
  async sendAndWait(
    message: WebSocketMessage,
  ): Promise<WebSocketMessage> {
    const id = message.id || this.generateId();
    message.id = id;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error(`Message timeout: ${id}`));
      }, this.messageTimeoutMs);

      this.messageHandlers.set(id, (response) => {
        clearTimeout(timeoutId);
        this.messageHandlers.delete(id);
        resolve(response);
      });

      try {
        this.send(message);
      } catch (error) {
        clearTimeout(timeoutId);
        this.messageHandlers.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Get connection state
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === WebSocketState.Connected;
  }

  // ============= PRIVATE METHODS =============

  private setState(state: WebSocketState): void {
    if (this.state !== state) {
      this.state = state;
      this.eventHandlers.onStateChange?.(state);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;

      // Handle ping/pong
      if (message.type === WebSocketMessageType.Ping) {
        this.send({
          type: WebSocketMessageType.Pong,
          payload: null,
          timestamp: Date.now(),
        });
        return;
      }

      // Handle message response
      if (message.id && this.messageHandlers.has(message.id)) {
        const handler = this.messageHandlers.get(message.id);
        handler?.(message);
        return;
      }

      // Call general message handler
      this.eventHandlers.onMessage?.(message);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventHandlers.onError?.(err);
    }
  }

  private startPing(): void {
    this.pingTimerId = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.send({
            type: WebSocketMessageType.Ping,
            payload: null,
            timestamp: Date.now(),
          });
        } catch (error) {
          // Ignore ping errors
        }
      }
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingTimerId) {
      clearInterval(this.pingTimerId);
      this.pingTimerId = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.initialReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelayMs,
    );

    this.setState(WebSocketState.Reconnecting);

    this.reconnectTimerId = setTimeout(() => {
      this.connect().catch((error) => {
        this.eventHandlers.onError?.(error);
      });
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============= REACT HOOK =============

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWebSocketOptions extends WebSocketClientOptions {
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface UseWebSocketState {
  state: WebSocketState;
  isConnected: boolean;
  send: (message: WebSocketMessage) => void;
  sendAndWait: (message: WebSocketMessage) => Promise<WebSocketMessage>;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketState {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [state, setState] = useState<WebSocketState>(WebSocketState.Disconnected);

  const client = clientRef.current || new WebSocketClient(options);
  if (!clientRef.current) {
    clientRef.current = client;
  }

  useEffect(() => {
    const handleStateChange = (newState: WebSocketState) => {
      setState(newState);
    };

    const handleMessage = (message: WebSocketMessage) => {
      options.onMessage?.(message);
    };

    client.on('onStateChange', handleStateChange as never);
    client.on('onMessage', handleMessage as never);

    if (options.autoConnect !== false) {
      client.connect().catch((error) => {
        console.error('Failed to connect:', error);
      });
    }

    return () => {
      client.disconnect();
    };
  }, [client, options]);

  const send = useCallback((message: WebSocketMessage) => {
    client.send(message);
  }, [client]);

  const sendAndWait = useCallback((message: WebSocketMessage) => {
    return client.sendAndWait(message);
  }, [client]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  return {
    state,
    isConnected: client.isConnected(),
    send,
    sendAndWait,
    disconnect,
  };
}
