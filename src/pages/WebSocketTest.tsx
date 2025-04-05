
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
import { Loader2, Send, PlayCircle, StopCircle, X, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WebSocketTest: React.FC = () => {
  const [url, setUrl] = useState('wss://intricately-tenacious-mantis.cloudpub.ru/ws/connection/websocket');
  const [token, setToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SB4MqSE0zFQHWYumo3NGLN11X6pLQkNNhvAqmh6Wtew');
  const [channel, setChannel] = useState('news');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('simple');
  const [rawMessage, setRawMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<{code?: number, reason?: string} | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Sample messages for common operations
  const sampleMessages = {
    connect: JSON.stringify({
      id: 1,
      method: "connect",
      params: {
        token: token
      }
    }, null, 2),
    subscribe: JSON.stringify({
      id: 2,
      method: "subscribe",
      params: {
        channel: channel
      }
    }, null, 2),
    publish: JSON.stringify({
      id: 3,
      method: "publish",
      params: {
        channel: channel,
        data: {
          text: "Hello from WebSocket test!"
        }
      }
    }, null, 2)
  };

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
    setErrorDetails(null);
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
      setErrorDetails(null);
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
          
          // Check for error responses
          if (data.error) {
            addLog(`Error response: ${data.error.message || 'Unknown error'}`, true);
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
        const closeMessage = `WebSocket connection closed: code=${event.code}, reason=${event.reason}`;
        addLog(closeMessage);
        
        // Set error details for specific error codes
        if (event.code !== 1000) { // 1000 is normal closure
          setErrorDetails({
            code: event.code,
            reason: event.reason
          });
          
          // Provide more context for common error codes
          let errorContext = '';
          switch (event.code) {
            case 1001:
              errorContext = 'The server is going down or a browser navigated away from the page.';
              break;
            case 1002:
              errorContext = 'The endpoint is terminating the connection due to a protocol error.';
              break;
            case 1003:
              errorContext = 'The connection is being terminated because it received data of a type it cannot accept.';
              break;
            case 1006:
              errorContext = 'The connection was closed abnormally, without a proper closing handshake.';
              break;
            case 1008:
              errorContext = 'The connection was terminated due to a message that violates the server\'s policy.';
              break;
            case 1011:
              errorContext = 'The server encountered an unexpected condition that prevented it from fulfilling the request.';
              break;
            case 3000:
            case 3001:
            case 3002:
            case 3003:
              errorContext = 'Custom Centrifugo error code. Check server logs for more details.';
              break;
            case 3501:
              errorContext = 'Bad request: The connection parameters might be incorrect or the authentication token is invalid.';
              break;
            default:
              if (event.code >= 4000) {
                errorContext = 'Application-specific error code.';
              }
          }
          
          if (errorContext) {
            addLog(`Error context: ${errorContext}`, true);
          }
        }
        
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

    // Based on which tab is active, send the appropriate message
    if (activeTab === 'simple') {
      if (!message) {
        addLog("Message is empty", true);
        return;
      }

      try {
        // Try to parse the message as JSON
        const jsonMessage = JSON.parse(message);
        wsRef.current.send(JSON.stringify(jsonMessage));
        addLog(`Sent: ${JSON.stringify(jsonMessage, null, 2)}`);
      } catch (e) {
        // If parsing fails, send as plain text
        wsRef.current.send(message);
        addLog(`Sent raw message: ${message}`);
      }

      setMessage('');
    } else {
      if (!rawMessage) {
        addLog("Raw message is empty", true);
        return;
      }

      try {
        wsRef.current.send(rawMessage);
        addLog(`Sent raw message: ${rawMessage}`);
      } catch (e) {
        addLog(`Error sending message: ${e}`, true);
      }
    }
  };

  const copyToInput = (template: string) => {
    if (activeTab === 'simple') {
      setMessage(template);
    } else {
      setRawMessage(template);
    }
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

              {errorDetails && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    <p>Code: {errorDetails.code}</p>
                    <p>Reason: {errorDetails.reason || 'No reason provided'}</p>
                    {errorDetails.code === 3501 && (
                      <p className="mt-2">
                        Error 3501 (Bad Request) usually indicates an issue with the connection parameters or token format. 
                        Try a different token or check if the server expects a specific format.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
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
                <Badge variant={connected ? "default" : "secondary"}>
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
            <CardFooter className="flex-col">
              <Tabs defaultValue="simple" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="simple">JSON Message</TabsTrigger>
                  <TabsTrigger value="raw">Raw Message</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simple" className="w-full">
                  <div className="w-full space-y-4">
                    <Textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter JSON message to send"
                      className="font-mono text-sm"
                      disabled={!connected}
                      rows={5}
                    />
                    
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToInput(sampleMessages.connect)}
                          disabled={!connected}
                        >
                          Connect
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToInput(sampleMessages.subscribe)}
                          disabled={!connected}
                        >
                          Subscribe
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToInput(sampleMessages.publish)}
                          disabled={!connected}
                        >
                          Publish
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={sendMessage}
                        disabled={!connected || !message}
                      >
                        <Send className="h-4 w-4 mr-2" /> Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="raw" className="w-full">
                  <div className="w-full space-y-4">
                    <Textarea 
                      value={rawMessage} 
                      onChange={(e) => setRawMessage(e.target.value)}
                      placeholder="Enter raw message to send"
                      className="font-mono text-sm"
                      disabled={!connected}
                      rows={5}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={sendMessage}
                        disabled={!connected || !rawMessage}
                      >
                        <Send className="h-4 w-4 mr-2" /> Send Raw
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardFooter>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Common Centrifugo Commands
            </CardTitle>
            <CardDescription>
              Reference for standard Centrifugo WebSocket protocol commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2">Connect Command</h3>
                <pre className="bg-secondary/20 p-3 rounded text-xs overflow-auto">
                  {`{
  "id": 1,
  "method": "connect",
  "params": {
    "token": "JWT_TOKEN_HERE"
  }
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Subscribe Command</h3>
                <pre className="bg-secondary/20 p-3 rounded text-xs overflow-auto">
                  {`{
  "id": 2,
  "method": "subscribe",
  "params": {
    "channel": "CHANNEL_NAME"
  }
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Publish Command</h3>
                <pre className="bg-secondary/20 p-3 rounded text-xs overflow-auto">
                  {`{
  "id": 3,
  "method": "publish",
  "params": {
    "channel": "CHANNEL_NAME",
    "data": {
      "text": "Your message here"
    }
  }
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Unsubscribe Command</h3>
                <pre className="bg-secondary/20 p-3 rounded text-xs overflow-auto">
                  {`{
  "id": 4,
  "method": "unsubscribe",
  "params": {
    "channel": "CHANNEL_NAME"
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WebSocketTest;
