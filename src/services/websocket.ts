
import { toast } from "@/hooks/use-toast";

// WebSocket connection states
export type WebSocketState = 'connecting' | 'open' | 'closed' | 'error';

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Record<string, ((payload: any) => void)[]> = {};
  private stateChangeHandlers: ((state: WebSocketState) => void)[] = [];

  // Connect to WebSocket server
  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = new WebSocket(url);
      this.registerSocketListeners();
      this.notifyStateChange('connecting');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyStateChange('error');
      this.attemptReconnect();
    }
  }

  // Register WebSocket event listeners
  private registerSocketListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.notifyStateChange('open');
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.notifyStateChange('closed');
      
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyStateChange('error');
    };
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const { type, payload } = message;
    const handlers = this.messageHandlers[type] || [];
    
    console.log(`Received WebSocket message of type: ${type}`);
    
    if (handlers.length === 0) {
      console.warn(`No handlers registered for message type: ${type}`);
    }

    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in handler for message type ${type}:`, error);
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
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
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
  onStateChange(handler: (state: WebSocketState) => void): () => void {
    this.stateChangeHandlers.push(handler);
    
    // Return a function to unregister this handler
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(h => h !== handler);
    };
  }

  // Notify all state change handlers
  private notifyStateChange(state: WebSocketState): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in WebSocket state change handler:', error);
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
}

// Create singleton instance
export const webSocketService = new WebSocketService();
