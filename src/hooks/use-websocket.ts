
import { useState, useEffect } from 'react';
import { webSocketService, WebSocketState, WebSocketMessage } from '@/services/websocket';

interface UseWebSocketOptions {
  url?: string;
  reconnectOnMount?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<WebSocketState>(
    webSocketService.getState()
  );

  useEffect(() => {
    // Register state change handler
    const unsubscribeState = webSocketService.onStateChange((state) => {
      setConnectionState(state);
    });

    // Connect if URL is provided and reconnectOnMount is true
    if (options.url && options.reconnectOnMount) {
      webSocketService.connect(options.url);
    }

    // Cleanup on unmount
    return () => {
      unsubscribeState();
    };
  }, [options.url, options.reconnectOnMount]);

  // Helper to send a message
  const sendMessage = (type: string, payload: any): boolean => {
    return webSocketService.send(type, payload);
  };

  // Helper to register a message handler
  const onMessage = (type: string, handler: (payload: any) => void): () => void => {
    return webSocketService.on(type, handler);
  };

  // Connect to WebSocket server
  const connect = (url?: string) => {
    if (url || options.url) {
      webSocketService.connect(url || options.url || '');
    } else {
      console.error('No WebSocket URL provided');
    }
  };

  // Disconnect from WebSocket server
  const disconnect = () => {
    webSocketService.disconnect();
  };

  return {
    connectionState,
    isConnected: connectionState === 'open',
    isConnecting: connectionState === 'connecting',
    sendMessage,
    onMessage,
    connect,
    disconnect
  };
}
