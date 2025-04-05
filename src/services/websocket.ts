
import { toast } from "@/hooks/use-toast";

// WebSocket connection states
export type WebSocketState = 'connecting' | 'open' | 'closed' | 'error';

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
}

// Error information from WebSocket
export interface WebSocketError {
  code?: number;
  reason?: string;
  message?: string;
}

class WebSocketService {
  socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Record<string, ((payload: any) => void)[]> = {};
  private stateChangeHandlers: ((state: WebSocketState, error?: WebSocketError) => void)[] = [];
  private lastError: WebSocketError | null = null;
  private clientId: string | null = null;

  // Connect to WebSocket server with optional connection parameters
  connect(url: string, params: Record<string, string> = {}): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Append connection parameters to URL if provided
      let connectionUrl = url;
      const urlParams = new URLSearchParams(params);
      const queryString = urlParams.toString();
      
      if (queryString && !url.includes('?')) {
        connectionUrl = `${url}?${queryString}`;
      } else if (queryString) {
        connectionUrl = `${url}&${queryString}`;
      }
      
      console.log(`Connecting to WebSocket at ${connectionUrl}`);
      this.socket = new WebSocket(connectionUrl);
      this.registerSocketListeners();
      this.notifyStateChange('connecting');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.lastError = {
        message: error instanceof Error ? error.message : 'Unknown connection error'
      };
      this.notifyStateChange('error', this.lastError);
      this.attemptReconnect();
    }
  }

  // Register WebSocket event listeners
  private registerSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.notifyStateChange('open');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        // Handle Centrifugo protocol responses
        if (data.id !== undefined) {
          // This is a command response
          if (data.error) {
            console.error('Centrifugo error:', data.error);
            this.lastError = {
              message: data.error.message || 'Centrifugo error',
              code: data.error.code,
              reason: data.error.message
            };
            
            // Show toast for errors
            toast({
              title: "WebSocket Error",
              description: this.lastError.message,
              variant: "destructive"
            });
            
            // Notify handlers of the error
            const errorHandlers = this.messageHandlers['error'] || [];
            errorHandlers.forEach(handler => {
              try {
                handler(data.error);
              } catch (e) {
                console.error('Error in error handler:', e);
              }
            });
          }
          
          // Store client ID from connect response
          if (data.id === 1 && data.result && data.result.client) {
            this.clientId = data.result.client;
            console.log('Client ID received:', this.clientId);
            
            // Notify connection success
            toast({
              title: "WebSocket Connected",
              description: `Connected with client ID: ${this.clientId}`,
            });
          }
          
          // Notify about specific command responses
          const commandHandlers = this.messageHandlers[`command:${data.id}`] || [];
          commandHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (e) {
              console.error(`Error in command handler for ID ${data.id}:`, e);
            }
          });
        }
        
        // Handle Centrifugo push messages (publications)
        if (data.push && data.push.channel) {
          const channel = data.push.channel;
          const channelData = data.push.data;
          
          console.log(`Received message on channel ${channel}:`, channelData);
          
          // Notify channel handlers
          const channelHandlers = this.messageHandlers[`channel:${channel}`] || [];
          channelHandlers.forEach(handler => {
            try {
              handler(channelData);
            } catch (e) {
              console.error(`Error in channel handler for ${channel}:`, e);
            }
          });
          
          // Also create a normalized message
          const message: WebSocketMessage = {
            type: 'message',
            payload: {
              channel,
              data: channelData
            }
          };
          
          this.handleMessage(message);
        }
        
        // Also handle legacy format for backward compatibility
        if (data.result && data.result.channel && data.result.data) {
          const channelHandlers = this.messageHandlers[`channel:${data.result.channel}`] || [];
          channelHandlers.forEach(handler => {
            try {
              handler(data.result.data);
            } catch (e) {
              console.error(`Error in channel handler for ${data.result.channel}:`, e);
            }
          });
        }
        
        // Always create a normalized message for uniform handling
        const message: WebSocketMessage = {
          type: data.method || (data.result?.channel ? 'message' : 'response'),
          payload: data
        };
        
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      
      this.lastError = {
        code: event.code,
        reason: event.reason
      };
      
      this.notifyStateChange('closed', this.lastError);
      
      // Reset client ID
      this.clientId = null;
      
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      this.lastError = {
        message: 'WebSocket error event'
      };
      
      this.notifyStateChange('error', this.lastError);
    };
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const { type, payload } = message;
    const handlers = this.messageHandlers[type] || [];
    const wildcardHandlers = this.messageHandlers['*'] || [];
    
    console.log(`Received WebSocket message of type: ${type}`);
    
    if (handlers.length === 0 && wildcardHandlers.length === 0) {
      console.warn(`No handlers registered for message type: ${type}`);
    }

    // Call specific handlers for this message type
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in handler for message type ${type}:`, error);
      }
    });

    // Also call wildcard handlers
    wildcardHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in wildcard handler for message type ${type}:`, error);
      }
    });
  }

  // Attempt to reconnect to WebSocket server
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу симуляции после нескольких попыток.",
        variant: "destructive"
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.socket?.url) {
        this.connect(this.socket.url);
      }
    }, delay);
  }

  // Send a message to the WebSocket server
  send(type: string, payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket is not connected');
      return false;
    }

    try {
      // Special case for Centrifugo protocol
      if (type === 'connect' || type === 'subscribe' || type === 'publish' || type === 'unsubscribe') {
        let id = Math.floor(Math.random() * 1000) + 1;
        if (type === 'connect') id = 1; // Always use id=1 for connect for consistency
        
        const command = {
          id,
          method: type,
          params: payload
        };
        
        console.log(`Sending Centrifugo command: ${JSON.stringify(command)}`);
        this.socket.send(JSON.stringify(command));
      } else {
        const message: WebSocketMessage = { type, payload };
        this.socket.send(JSON.stringify(message));
      }
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Send a raw message (string) to the WebSocket server
  sendRaw(message: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket is not connected');
      return false;
    }

    try {
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending raw WebSocket message:', error);
      return false;
    }
  }

  // Register a handler for a specific message type
  on(type: string, handler: (payload: any) => void): () => void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    
    this.messageHandlers[type].push(handler);
    
    // Return a function to unregister this handler
    return () => {
      this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
    };
  }

  // Register a state change handler
  onStateChange(handler: (state: WebSocketState, error?: WebSocketError) => void): () => void {
    this.stateChangeHandlers.push(handler);
    
    // Return a function to unregister this handler
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(h => h !== handler);
    };
  }

  // Notify all state change handlers
  private notifyStateChange(state: WebSocketState, error?: WebSocketError): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(state, error);
      } catch (e) {
        console.error('Error in WebSocket state change handler:', e);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.clientId = null;
  }

  // Get current WebSocket state
  getState(): WebSocketState {
    if (!this.socket) return 'closed';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return 'closed';
    }
  }

  // Get the last error that occurred
  getLastError(): WebSocketError | null {
    return this.lastError;
  }

  // Get client ID if connected
  getClientId(): string | null {
    return this.clientId;
  }
  
  // Subscribe to a channel
  subscribeToChannel(channel: string): boolean {
    return this.send('subscribe', { channel });
  }
  
  // Publish to a channel
  publishToChannel(channel: string, data: any): boolean {
    return this.send('publish', { channel, data });
  }
  
  // Unsubscribe from a channel
  unsubscribeFromChannel(channel: string): boolean {
    return this.send('unsubscribe', { channel });
  }

  // Support for Unity WebGL based simulations
  connectToUnitySimulation(unityInstance: any): void {
    // Method to be called when Unity is loaded and ready
    // The unityInstance would be the reference to the Unity WebGL instance
    
    if (!unityInstance) {
      console.error('Unity instance is not provided');
      return;
    }
    
    try {
      // Register a method to receive data from Unity
      // This assumes Unity will call this method via JSLib
      window.receiveFromUnity = (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          this.handleMessage({
            type: data.type || 'unity_message',
            payload: data
          });
        } catch (error) {
          console.error('Error parsing data from Unity:', error);
        }
      };
      
      console.log('Unity simulation connection established');
      toast({
        title: "Подключено к Unity",
        description: "Соединение с симуляцией Unity установлено."
      });
      
    } catch (error) {
      console.error('Error connecting to Unity simulation:', error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к симуляции Unity.",
        variant: "destructive"
      });
    }
  }
  
  // Send data to Unity
  sendToUnity(method: string, data: any): boolean {
    try {
      if (window.unityInstance) {
        const stringData = JSON.stringify(data);
        window.unityInstance.SendMessage('WebSocketReceiver', method, stringData);
        return true;
      } else {
        console.warn('Unity instance not available');
        return false;
      }
    } catch (error) {
      console.error('Error sending data to Unity:', error);
      return false;
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Add global types for Unity integration
declare global {
  interface Window {
    receiveFromUnity: (jsonData: string) => void;
    unityInstance: any;
  }
}
