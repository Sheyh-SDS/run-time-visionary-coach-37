
import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService, WebSocketState, WebSocketMessage } from '@/services/websocket';

interface UseWebSocketOptions {
  url?: string;
  reconnectOnMount?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  token?: string;
  debug?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<WebSocketState>(
    webSocketService.getState()
  );
  const [lastError, setLastError] = useState<{ code?: number; reason?: string } | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    token,
    debug = false
  } = options;

  // Setup message handler if provided
  useEffect(() => {
    let messageUnsubscribe: (() => void) | undefined;
    
    if (onMessage) {
      // Use the 'on' method to register a general message handler for all message types
      messageUnsubscribe = webSocketService.on('*', (payload) => {
        onMessage({ type: payload.type || 'unknown', payload: payload.payload });
        
        if (debug) {
          console.log('WebSocket received message:', payload);
        }
      });
    }
    
    return () => {
      if (messageUnsubscribe) {
        messageUnsubscribe();
      }
    };
  }, [onMessage, debug]);

  // Register state change handler
  useEffect(() => {
    const unsubscribeState = webSocketService.onStateChange((state, error) => {
      setConnectionState(state);
      
      if (error) {
        setLastError(error);
        
        if (debug) {
          console.error('WebSocket error:', error);
        }
      } else {
        setLastError(null);
      }
      
      // Reset reconnect attempts when connected successfully
      if (state === 'open') {
        reconnectAttemptsRef.current = 0;

        // Authenticate with token if provided
        if (token && webSocketService.socket) {
          webSocketService.send('connect', { token });
          
          if (debug) {
            console.log('Sent authentication with token');
          }
        }
      }
      
      // Attempt to reconnect on error
      if (state === 'error' || state === 'closed') {
        attemptReconnect();
      }
    });

    // Attempt reconnect logic
    const attemptReconnect = () => {
      // Clear any existing reconnect timer
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // If we've exceeded max attempts, give up
      if (reconnectAttemptsRef.current >= maxReconnectAttempts || !options.url) {
        if (debug) {
          console.log(`Max reconnect attempts (${maxReconnectAttempts}) reached or no URL provided.`);
        }
        return;
      }
      
      // Exponential backoff
      const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
      
      if (debug) {
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
      }
      
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        if (options.url) {
          if (debug) {
            console.log(`Reconnecting to ${options.url}...`);
          }
          webSocketService.connect(options.url);
        }
      }, delay);
    };

    // Connect if URL is provided and reconnectOnMount is true
    if (options.url && options.reconnectOnMount) {
      webSocketService.connect(options.url);
    }

    // Cleanup on unmount
    return () => {
      unsubscribeState();
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [options.url, options.reconnectOnMount, token, maxReconnectAttempts, reconnectInterval, debug]);

  // Helper to send a message
  const sendMessage = useCallback((type: string, payload: any): boolean => {
    const result = webSocketService.send(type, payload);
    if (debug && !result) {
      console.error(`Failed to send message of type ${type}`);
    }
    return result;
  }, [debug]);

  // Helper function specifically for Centrifugo commands
  const sendCentrifugoCommand = useCallback((method: string, params: any, id?: number): boolean => {
    if (!webSocketService.socket || webSocketService.socket.readyState !== WebSocket.OPEN) {
      if (debug) {
        console.error('Cannot send Centrifugo command, WebSocket is not connected');
      }
      return false;
    }

    try {
      const commandId = id || Math.floor(Math.random() * 1000) + 1;
      const command = {
        id: commandId,
        method,
        params
      };

      webSocketService.socket.send(JSON.stringify(command));
      
      if (debug) {
        console.log(`Sent Centrifugo command:`, command);
      }
      
      return true;
    } catch (error) {
      if (debug) {
        console.error('Error sending Centrifugo command:', error);
      }
      return false;
    }
  }, [debug]);

  // Helper for common Centrifugo operations
  const centrifugo = {
    connect: (connectToken: string = token || '') => {
      return sendCentrifugoCommand('connect', { token: connectToken }, 1);
    },
    subscribe: (channelName: string) => {
      return sendCentrifugoCommand('subscribe', { channel: channelName }, 2);
    },
    unsubscribe: (channelName: string) => {
      return sendCentrifugoCommand('unsubscribe', { channel: channelName }, 3);
    },
    publish: (channelName: string, data: any) => {
      return sendCentrifugoCommand('publish', { channel: channelName, data }, 4);
    }
  };

  // Helper to register a message handler
  const onMessageType = useCallback((type: string, handler: (payload: any) => void): () => void => {
    return webSocketService.on(type, handler);
  }, []);

  // Connect to WebSocket server
  const connect = useCallback((url?: string) => {
    if (url || options.url) {
      reconnectAttemptsRef.current = 0;
      setLastError(null);
      webSocketService.connect(url || options.url || '');
    } else {
      console.error('No WebSocket URL provided');
    }
  }, [options.url]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    // Stop any reconnection attempts
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    webSocketService.disconnect();
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'open',
    isConnecting: connectionState === 'connecting',
    lastError,
    sendMessage,
    onMessage: onMessageType,
    connect,
    disconnect,
    centrifugo // New helper for Centrifugo-specific operations
  };
}
