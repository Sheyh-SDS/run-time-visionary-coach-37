
import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketService, WebSocketOptions, WebSocketState } from '@/services/websocket';

export function useWebSocket(options: WebSocketOptions) {
  const [connectionState, setConnectionState] = useState<WebSocketState>(
    options.url && options.reconnectOnMount ? 'connecting' : 'closed'
  );
  const [isConnected, setIsConnected] = useState(false);
  const webSocketRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Custom handlers that update the component state
    const handlers: WebSocketOptions = {
      ...options,
      onOpen: () => {
        setConnectionState('open');
        setIsConnected(true);
        if (options.onOpen) options.onOpen();
      },
      onClose: () => {
        setConnectionState('closed');
        setIsConnected(false);
        if (options.onClose) options.onClose();
      },
      onError: (error) => {
        setConnectionState('error');
        setIsConnected(false);
        if (options.onError) options.onError(error);
      }
    };

    // Create WebSocket service
    webSocketRef.current = new WebSocketService(handlers);

    // Cleanup on unmount
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
        webSocketRef.current = null;
      }
    };
  }, []);

  /**
   * Connect to a WebSocket server
   * @param url The WebSocket server URL
   */
  const connect = useCallback((url: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.connect(url);
      setConnectionState('connecting');
    }
  }, []);

  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
      setConnectionState('closed');
      setIsConnected(false);
    }
  }, []);

  /**
   * Subscribe to a channel
   * @param channel The channel to subscribe to
   * @param callback Optional callback function for messages on this channel
   */
  const subscribe = useCallback((channel: string, callback?: (data: any) => void) => {
    if (webSocketRef.current) {
      webSocketRef.current.subscribe(channel, callback);
    }
  }, []);

  /**
   * Unsubscribe from a channel
   * @param channel The channel to unsubscribe from
   */
  const unsubscribe = useCallback((channel: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.unsubscribe(channel);
    }
  }, []);

  /**
   * Publish a message to a channel
   * @param channel The channel to publish to
   * @param data The data to publish
   */
  const publish = useCallback((channel: string, data: any) => {
    if (webSocketRef.current) {
      webSocketRef.current.publish(channel, data);
    }
  }, []);

  /**
   * Get the current connection state
   */
  const getState = useCallback((): WebSocketState => {
    return webSocketRef.current?.state || 'closed';
  }, []);

  /**
   * Get the connection ID
   */
  const getConnectionId = useCallback((): string | null => {
    return webSocketRef.current?.getConnectionId() || null;
  }, []);

  return {
    connectionState,
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    getState,
    getConnectionId
  };
}
