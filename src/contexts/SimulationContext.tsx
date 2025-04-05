
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { simulationApi, SIMULATION_MESSAGES } from '@/services/simulationApi';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketState } from '@/services/websocket';
import { toast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Define the context type
interface SimulationContextType {
  isConnected: boolean;
  connectionState: WebSocketState;
  connectToServer: (url: string) => void;
  disconnectFromServer: () => void;
  connectionError: string | null;
}

// Create the context with a default value
const SimulationContext = createContext<SimulationContextType>({
  isConnected: false,
  connectionState: 'closed',
  connectToServer: () => {},
  disconnectFromServer: () => {},
  connectionError: null
});

// Context provider component
export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Process messages from the server
  const handleMessage = (message: any) => {
    console.log('Simulation message received:', message);
    
    // Process based on message type
    if (!message || !message.type) return;
    
    switch (message.type) {
      case SIMULATION_MESSAGES.ATHLETE_UPDATE:
        // Invalidate athlete cache to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['athletes'] });
        break;
      case SIMULATION_MESSAGES.SESSION_UPDATE:
        // Invalidate sessions cache
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        break;
      case SIMULATION_MESSAGES.LIVE_RACE_UPDATE:
        // Update any live race data in the query cache
        if (message.data) {
          queryClient.setQueryData(['live-race'], message.data);
        }
        break;
      case SIMULATION_MESSAGES.RACE_RESULTS:
        // Update race results in the query cache
        if (message.data) {
          queryClient.setQueryData(['race-results'], message.data);
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };
  
  // Use the WebSocket hook
  const { 
    connectionState, 
    isConnected,
    connect, 
    disconnect,
    subscribe
  } = useWebSocket({
    url: serverUrl,
    reconnectOnMount: !!serverUrl,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('Centrifugo connection established');
      
      // Subscribe to simulation channels on connection
      const channels = simulationApi.getChannels();
      Object.values(channels).forEach(channel => {
        subscribe(channel);
      });
    }
  });

  // Show toast notifications for connection state changes
  useEffect(() => {
    if (connectionState === 'open') {
      setConnectionError(null);
      toast({
        title: "Подключено к серверу",
        description: "Соединение с сервером симуляции установлено."
      });

      // Invalidate cached data to fetch fresh data from the server
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } else if (connectionState === 'error') {
      setConnectionError("Не удалось подключиться к серверу симуляции");
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу симуляции.",
        variant: "destructive"
      });
    } else if (connectionState === 'closed' && serverUrl) {
      // Only show this toast if we were previously trying to connect
      toast({
        title: "Соединение закрыто",
        description: "Соединение с сервером симуляции было закрыто."
      });
    }
  }, [connectionState, serverUrl, queryClient]);

  // Connect to the simulation server
  const connectToServer = (url: string) => {
    try {
      // Ensure URL is a valid Centrifugo WebSocket URL
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL format');
      }
      
      setServerUrl(url);
      connect(url);
      simulationApi.init(url);
      setConnectionError(null);
    } catch (error) {
      console.error("Error connecting to server:", error);
      setConnectionError("Ошибка при подключении к серверу");
      toast({
        title: "Ошибка подключения",
        description: "Не удалось инициализировать подключение к серверу",
        variant: "destructive"
      });
    }
  };

  // Disconnect from the simulation server
  const disconnectFromServer = () => {
    try {
      disconnect();
      setServerUrl(undefined);
      // Revert to mock mode
      simulationApi.init();
      toast({
        title: "Отключено от сервера",
        description: "Вы отключились от сервера. Используются моковые данные."
      });
    } catch (error) {
      console.error("Error disconnecting from server:", error);
      toast({
        title: "Ошибка отключения",
        description: "Произошла ошибка при отключении от сервера",
        variant: "destructive"
      });
    }
  };

  return (
    <SimulationContext.Provider 
      value={{
        isConnected,
        connectionState,
        connectToServer,
        disconnectFromServer,
        connectionError
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

// Custom hook to use the simulation context
export const useSimulation = () => useContext(SimulationContext);
