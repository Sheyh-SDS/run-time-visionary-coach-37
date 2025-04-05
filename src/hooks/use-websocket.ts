
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
  autoSubscribeChannels?: string[];
  pingInterval?: number;
  connectionParams?: Record<string, string>;
  connectWithParams?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<WebSocketState>(
    webSocketService.getState()
  );
  const [lastError, setLastError] = useState<{ code?: number; reason?: string; message?: string } | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    token,
    debug = false,
    autoSubscribeChannels = [],
    pingInterval = 25000,
    connectionParams = {},
    connectWithParams = false
  } = options;

  useEffect(() => {
    let messageUnsubscribe: (() => void) | undefined;
    
    if (onMessage) {
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

  useEffect(() => {
    const setupPingInterval = () => {
      if (pingInterval > 0 && connectionState === 'open') {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
        }
        
        pingTimerRef.current = window.setInterval(() => {
          if (debug) {
            console.log('Sending ping to keep connection alive');
          }
          
          webSocketService.send('ping', {});
        }, pingInterval);
        
        if (debug) {
          console.log(`Ping interval set to ${pingInterval}ms`);
        }
      }
      return () => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
      };
    };
    
    return setupPingInterval();
  }, [pingInterval, connectionState, debug]);

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
      
      if (state === 'open') {
        reconnectAttemptsRef.current = 0;
        setClientId(webSocketService.getClientId());

        // If we should connect with token directly in URL, we don't need to send connect command
        if (token && !connectWithParams) {
          webSocketService.send('connect', { token });
          
          if (debug) {
            console.log('Sent authentication with token:', token);
          }
        }
        
        if (autoSubscribeChannels.length > 0 && state === 'open') {
          autoSubscribeChannels.forEach(channel => {
            webSocketService.subscribeToChannel(channel);
            if (debug) {
              console.log(`Auto-subscribed to channel: ${channel}`);
            }
          });
        }
      }
      
      if (state === 'error' || state === 'closed') {
        attemptReconnect();
      }
    });

    const attemptReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts || !options.url) {
        if (debug) {
          console.log(`Max reconnect attempts (${maxReconnectAttempts}) reached or no URL provided.`);
        }
        return;
      }
      
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
          
          // If token should be passed as connection param
          let connectParams = { ...connectionParams };
          if (connectWithParams && token) {
            connectParams.token = token;
          }
          
          webSocketService.connect(options.url, connectParams);
        }
      }, delay);
    };

    if (options.url && options.reconnectOnMount) {
      // If token should be passed as connection param
      let connectParams = { ...connectionParams };
      if (connectWithParams && token) {
        connectParams.token = token;
      }
      
      webSocketService.connect(options.url, connectParams);
    }

    return () => {
      unsubscribeState();
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (pingTimerRef.current !== null) {
        window.clearInterval(pingTimerRef.current);
      }
    };
  }, [options.url, options.reconnectOnMount, token, maxReconnectAttempts, reconnectInterval, debug, autoSubscribeChannels, connectionParams, connectWithParams]);

  const sendMessage = useCallback((type: string, payload: any): boolean => {
    const result = webSocketService.send(type, payload);
    if (debug && !result) {
      console.error(`Failed to send message of type ${type}`);
    }
    return result;
  }, [debug]);

  const sendRawMessage = useCallback((message: string): boolean => {
    const result = webSocketService.sendRaw(message);
    if (debug && !result) {
      console.error('Failed to send raw message');
    }
    return result;
  }, [debug]);

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

  const centrifugo = {
    connect: (connectToken: string = token || '') => {
      return sendCentrifugoCommand('connect', { token: connectToken }, 1);
    },
    subscribe: (channelName: string) => {
      return sendCentrifugoCommand('subscribe', { channel: channelName });
    },
    unsubscribe: (channelName: string) => {
      return sendCentrifugoCommand('unsubscribe', { channel: channelName });
    },
    publish: (channelName: string, data: any) => {
      return sendCentrifugoCommand('publish', { channel: channelName, data });
    },
    presence: (channelName: string) => {
      return sendCentrifugoCommand('presence', { channel: channelName });
    },
    history: (channelName: string) => {
      return sendCentrifugoCommand('history', { channel: channelName });
    },
    ping: () => {
      return sendCentrifugoCommand('ping', {});
    }
  };

  const onMessageType = useCallback((type: string, handler: (payload: any) => void): () => void => {
    return webSocketService.on(type, handler);
  }, []);

  const connect = useCallback((url?: string) => {
    if (url || options.url) {
      reconnectAttemptsRef.current = 0;
      setLastError(null);
      
      // If token should be passed as connection param
      let connectParams = { ...connectionParams };
      if (connectWithParams && token) {
        connectParams.token = token;
      }
      
      webSocketService.connect(url || options.url || '', connectParams);
    } else {
      console.error('No WebSocket URL provided');
    }
  }, [options.url, connectionParams, connectWithParams, token]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (pingTimerRef.current !== null) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    
    webSocketService.disconnect();
    setClientId(null);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'open',
    isConnecting: connectionState === 'connecting',
    lastError,
    clientId,
    sendMessage,
    sendRawMessage,
    onMessage: onMessageType,
    connect,
    disconnect,
    centrifugo,
    subscribe: useCallback((channel: string) => webSocketService.subscribeToChannel(channel), []),
    unsubscribe: useCallback((channel: string) => webSocketService.unsubscribeFromChannel(channel), []),
    publish: useCallback((channel: string, data: any) => webSocketService.publishToChannel(channel, data), [])
  };
}
