
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, PlayCircle, StopCircle, X } from 'lucide-react';

const WebSocketTest: React.FC = () => {
  const [url, setUrl] = useState('wss://intricately-tenacious-mantis.cloudpub.ru/ws/connection/websocket');
  const [token, setToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SB4MqSE0zFQHWYumo3NGLN11X6pLQkNNhvAqmh6Wtew');
  const [channel, setChannel] = useState('news');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Add log entry with timestamp
  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [...prevLogs, logMessage]);
    
    if (isError) {
      console.error(logMessage);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const connectWebSocket = () => {
    if (!url) {
      addLog("WebSocket URL is required", true);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog("WebSocket is already connected");
      return;
    }

    try {
      setConnecting(true);
      addLog("Connecting to WebSocket...");

      // Create a new WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // WebSocket event handlers
      ws.onopen = () => {
        addLog("WebSocket connection established");
        setConnected(true);
        setConnecting(false);

        // Send the connect command with token for authentication
        const connectCommand = {
          id: 1,
          method: "connect",
          params: {
            token: token
          }
        };

        ws.send(JSON.stringify(connectCommand));
        addLog(`Sent authentication request: ${JSON.stringify(connectCommand)}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog(`Received: ${JSON.stringify(data, null, 2)}`);
          
          // Check if this is a connect response and store the client ID
          if (data.id === 1 && data.result && data.result.client) {
            clientIdRef.current = data.result.client;
            addLog(`Client ID received: ${clientIdRef.current}`);
            
            // Auto-subscribe to channel if we have a channel name
            if (channel) {
              subscribeToChannel();
            }
          }
        } catch (error) {
          addLog(`Error parsing message: ${error}`, true);
        }
      };

      ws.onerror = (error) => {
        addLog(`WebSocket error: ${error}`, true);
        setConnected(false);
        setConnecting(false);
      };

      ws.onclose = (event) => {
        addLog(`WebSocket connection closed: code=${event.code}, reason=${event.reason}`);
        setConnected(false);
        setConnecting(false);
        clientIdRef.current = null;
      };

    } catch (error) {
      addLog(`Error creating WebSocket: ${error}`, true);
      setConnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      clientIdRef.current = null;
      addLog("WebSocket disconnected");
      setConnected(false);
    }
  };

  const subscribeToChannel = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("WebSocket is not connected", true);
      return;
    }

    if (!channel) {
      addLog("Channel name is required", true);
      return;
    }

    // Send subscribe command
    const subscribeCommand = {
      id: 2,
      method: "subscribe",
      params: {
        channel: channel
      }
    };

    wsRef.current.send(JSON.stringify(subscribeCommand));
    addLog(`Subscribing to channel: ${channel}`);
  };

  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("WebSocket is not connected", true);
      return;
    }

    if (!message) {
      addLog("Message is empty", true);
      return;
    }

    try {
      // Try to parse the message as JSON
      const jsonMessage = JSON.parse(message);
      wsRef.current.send(JSON.stringify(jsonMessage));
      addLog(`Sent: ${JSON.stringify(jsonMessage)}`);
    } catch (e) {
      // If parsing fails, send as plain text
      wsRef.current.send(message);
      addLog(`Sent raw message: ${message}`);
    }

    setMessage('');
  };

  // Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-6">WebSocket Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>Configure your WebSocket connection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wsUrl">WebSocket URL</Label>
                <Input 
                  id="wsUrl" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={connected || connecting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="token">Authentication Token</Label>
                <Input 
                  id="token" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  disabled={connected || connecting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel">Channel Name</Label>
                <Input 
                  id="channel" 
                  value={channel} 
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="Enter channel to subscribe"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {!connected ? (
                <Button 
                  onClick={connectWebSocket} 
                  disabled={connecting || connected}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={disconnectWebSocket} 
                  variant="destructive"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              )}
              
              <Button 
                onClick={subscribeToChannel}
                disabled={!connected || !channel}
                variant="outline"
              >
                Subscribe to Channel
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>WebSocket Logs</span>
                <Badge variant={connected ? "success" : "secondary"}>
                  {connected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
              <CardDescription className="flex justify-between items-center">
                <span>Real-time connection events</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearLogs}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded border p-2 bg-secondary/20">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No logs yet. Connect to WebSocket to see events.
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="pb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className="w-full flex space-x-2">
                <Textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter JSON message to send"
                  className="font-mono text-sm"
                  disabled={!connected}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!connected || !message}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WebSocketTest;
