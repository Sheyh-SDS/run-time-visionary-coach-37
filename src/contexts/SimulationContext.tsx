
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { simulationApi, SIMULATION_MESSAGES } from '@/services/simulationApi';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketState } from '@/services/websocket';
import { toast } from '@/hooks/use-toast';

// Define the context type
interface SimulationContextType {
  isConnected: boolean;
  connectionState: WebSocketState;
  connectToServer: (url: string) => void;
  disconnectFromServer: () => void;
}

// Create the context with a default value
const SimulationContext = createContext<SimulationContextType>({
  isConnected: false,
  connectionState: 'closed',
  connectToServer: () => {},
  disconnectFromServer: () => {}
});

// Context provider component
export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined);
  
  // Use the WebSocket hook
  const { 
    connectionState, 
    isConnected,
    connect, 
    disconnect 
  } = useWebSocket({
    url: serverUrl,
    reconnectOnMount: !!serverUrl
  });

  // Show toast notifications for connection state changes
  useEffect(() => {
    if (connectionState === 'open') {
      toast({
        title: "Подключено к серверу",
        description: "Соединение с сервером симуляции установлено."
      });
    } else if (connectionState === 'error') {
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу симуляции.",
        variant: "destructive"
      });
    }
  }, [connectionState]);

  // Connect to the simulation server
  const connectToServer = (url: string) => {
    setServerUrl(url);
    connect(url);
    simulationApi.init(url);
  };

  // Disconnect from the simulation server
  const disconnectFromServer = () => {
    disconnect();
    setServerUrl(undefined);
    // Revert to mock mode
    simulationApi.init();
  };

  return (
    <SimulationContext.Provider 
      value={{
        isConnected,
        connectionState,
        connectToServer,
        disconnectFromServer
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

// Custom hook to use the simulation context
export const useSimulation = () => useContext(SimulationContext);
