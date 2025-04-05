
import { useEffect, useState, useCallback } from 'react';
import * as Centrifuge from 'centrifuge';

export type WebSocketState = 'connecting' | 'open' | 'closed' | 'error';

export interface WebSocketOptions {
  url: string | undefined;
  onOpen?: () => void;
  onMessage?: (message: any) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onSubscribe?: (channel: string) => void;
  reconnectOnMount?: boolean;
}

export class WebSocketService {
  private centrifuge: Centrifuge.Centrifuge | null = null;
  private url: string | undefined;
  private onOpen: (() => void) | undefined;
  private onMessage: ((data: any) => void) | undefined;
  private onClose: (() => void) | undefined;
  private onError: ((error: Event) => void) | undefined;
  private onSubscribe: ((channel: string) => void) | undefined;
  private subscriptions: Map<string, any> = new Map();
  private _state: WebSocketState = 'closed';
  private stateChangeListeners: Array<(state: WebSocketState) => void> = [];

  constructor(options: WebSocketOptions) {
    this.url = options.url;
    this.onOpen = options.onOpen;
    this.onMessage = options.onMessage;
    this.onClose = options.onClose;
    this.onError = options.onError;
    this.onSubscribe = options.onSubscribe;

    if (this.url && options.reconnectOnMount) {
      this.connect(this.url);
    }
  }

  public get state(): WebSocketState {
    return this._state;
  }

  public get isConnected(): boolean {
    return this._state === 'open';
  }

  public connect(url: string): void {
    if (this.centrifuge) {
      this.disconnect();
    }

    this.url = url;
    this._state = 'connecting';
    this.notifyStateChange();

    try {
      // Create a new Centrifuge instance
      this.centrifuge = new Centrifuge.Centrifuge(url);

      this.centrifuge.on('connecting', () => {
        this._state = 'connecting';
        console.log('Centrifugo: Connecting...');
        this.notifyStateChange();
      });

      this.centrifuge.on('connected', () => {
        this._state = 'open';
        console.log('Centrifugo: Connected!');
        if (this.onOpen) this.onOpen();
        this.notifyStateChange();
      });

      this.centrifuge.on('disconnected', () => {
        this._state = 'closed';
        console.log('Centrifugo: Disconnected');
        if (this.onClose) this.onClose();
        this.notifyStateChange();
      });

      this.centrifuge.on('error', (error) => {
        this._state = 'error';
        console.error('Centrifugo error:', error);
        if (this.onError) this.onError(error);
        this.notifyStateChange();
      });

      // Connect to the Centrifugo server
      this.centrifuge.connect();
    } catch (error) {
      console.error('Failed to create Centrifugo connection:', error);
      this._state = 'error';
      if (this.onError) this.onError(new Event('error'));
      this.notifyStateChange();
    }
  }

  public disconnect(): void {
    if (!this.centrifuge) return;

    // Unsubscribe from all channels
    this.subscriptions.forEach((sub, channel) => {
      this.unsubscribe(channel);
    });

    this.centrifuge.disconnect();
    this.centrifuge = null;
    this._state = 'closed';
    this.notifyStateChange();
  }

  public subscribe(channel: string, callback?: (data: any) => void): void {
    if (!this.centrifuge) {
      console.error('Cannot subscribe to channel - Centrifugo not connected');
      return;
    }

    if (this.subscriptions.has(channel)) {
      console.warn(`Already subscribed to channel: ${channel}`);
      return;
    }

    const subscription = this.centrifuge.newSubscription(channel);

    subscription.on('subscribed', () => {
      console.log(`Subscribed to channel: ${channel}`);
      if (this.onSubscribe) this.onSubscribe(channel);
    });

    subscription.on('publication', (message) => {
      console.log(`Received message on channel ${channel}:`, message);
      if (callback) callback(message.data);
      if (this.onMessage) this.onMessage(message.data);
    });

    subscription.on('error', (error) => {
      console.error(`Error on channel ${channel}:`, error);
    });

    subscription.subscribe();
    this.subscriptions.set(channel, subscription);
  }

  public unsubscribe(channel: string): void {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channel);
      console.log(`Unsubscribed from channel: ${channel}`);
    }
  }

  public publish(channel: string, data: any): void {
    if (!this.centrifuge || this._state !== 'open') {
      console.error('Cannot publish - Centrifugo not connected');
      return;
    }

    // This is a client-side publish and may require server-side configuration
    // to allow client publishing, or you might need to use RPC instead
    this.centrifuge.publish(channel, data).then(() => {
      console.log(`Published to channel ${channel}:`, data);
    }).catch((error) => {
      console.error(`Failed to publish to channel ${channel}:`, error);
    });
  }

  public getConnectionId(): string | null {
    return this.centrifuge?.getClientId() || null;
  }

  // Add the missing methods needed by simulationApi.ts

  public onStateChange(callback: (state: WebSocketState) => void): () => void {
    this.stateChangeListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(
        listener => listener !== callback
      );
    };
  }

  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(listener => listener(this._state));
  }

  public send(messageType: string, data: any): void {
    if (!this.centrifuge || this._state !== 'open') {
      console.error('Cannot send message - Centrifugo not connected');
      return;
    }

    // Use RPC to send a message to the server
    this.centrifuge.rpc(messageType, data)
      .then(response => {
        console.log(`Message sent to Centrifugo (${messageType}):`, data);
        console.log('Response:', response);
      })
      .catch(error => {
        console.error(`Failed to send message to Centrifugo (${messageType}):`, error);
      });
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService({
  url: undefined,
  reconnectOnMount: false
});
