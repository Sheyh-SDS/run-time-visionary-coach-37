
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

    // Connect immediately if URL provided and reconnectOnMount is true
    if (options.url && options.reconnectOnMount) {
      webSocketRef.current.connect(options.url, options.token);
    }

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
   * @param token Optional authentication token
   */
  const connect = useCallback((url: string, token?: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.connect(url, token);
      setConnectionState('connecting');
    }
  }, []);

  /**
   * Set authentication token
   * @param token The authentication token
   */
  const setToken = useCallback((token: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.setToken(token);
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
   * Send a message to the server
   * @param messageType The type of message to send
   * @param data The data to send
   */
  const send = useCallback((messageType: string, data: any) => {
    if (webSocketRef.current) {
      webSocketRef.current.send(messageType, data);
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
    setToken,
    subscribe,
    unsubscribe,
    publish,
    send,
    getState,
    getConnectionId
  };
}
