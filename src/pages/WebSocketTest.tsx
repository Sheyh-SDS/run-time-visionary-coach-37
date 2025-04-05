
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
import { Loader2, Send, PlayCircle, StopCircle, X, Info, AlertCircle, Code, Download, Copy, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWebSocket } from "@/hooks/use-websocket";
import { Toggle } from "@/components/ui/toggle";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const WebSocketTest: React.FC = () => {
  // WebSocket hook
  const [url, setUrl] = useState('wss://intricately-tenacious-mantis.cloudpub.ru/ws/connection/websocket');
  const [token, setToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SB4MqSE0zFQHWYumo3NGLN11X6pLQkNNhvAqmh6Wtew');
  const [channel, setChannel] = useState('news');
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('simple');
  const [rawMessage, setRawMessage] = useState('');
  const [cmdMethod, setCmdMethod] = useState('subscribe');
  const [cmdParams, setCmdParams] = useState('');
  const [debugMode, setDebugMode] = useState(true);
  const [autoSubscribe, setAutoSubscribe] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'command' | 'params'>('command');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [infoFormat, setInfoFormat] = useState<'conn' | 'sub' | 'common'>('conn');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use the WebSocket hook with the selected connection method
  const { 
    connectionState, 
    isConnected,
    isConnecting,
    lastError,
    clientId,
    connect,
    disconnect,
    sendRawMessage,
    centrifugo
  } = useWebSocket({
    debug: debugMode,
    autoSubscribeChannels: autoSubscribe ? [channel] : [],
    connectWithParams: connectionMethod === 'params',
  });

  // Add log entry with timestamp
  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [...prevLogs, logMessage]);
    
    if (isError) {
      console.error(logMessage);
    }
  };

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Log WebSocket state changes
  useEffect(() => {
    switch (connectionState) {
      case 'connecting':
        addLog('Connecting to WebSocket...');
        break;
      case 'open':
        addLog('WebSocket connection established');
        break;
      case 'closed':
        addLog(`WebSocket connection closed${lastError ? `: code=${lastError.code}, reason=${lastError.reason}` : ''}`);
        break;
      case 'error':
        // Fixed here: checking if lastError exists before accessing message
        addLog(`WebSocket error: ${lastError ? (lastError.reason || 'Unknown error') : 'Unknown error'}`, true);
        break;
    }
  }, [connectionState, lastError]);

  // Log client ID when it changes
  useEffect(() => {
    if (clientId) {
      addLog(`Client ID received: ${clientId}`);
    }
  }, [clientId]);

  const clearLogs = () => {
    setLogs([]);
  };

  // Connect with advanced options for Centrifugo
  const connectWebSocket = () => {
    if (!url) {
      addLog("WebSocket URL is required", true);
      toast({
        title: "Error",
        description: "WebSocket URL is required",
        variant: "destructive"
      });
      return;
    }

    // Use a URL without parameters for direct connection method
    let connectUrl = url;
    
    // For parameter-based connection, we'll set the token in the hook
    if (connectionMethod === 'params') {
      addLog(`Connecting with token in URL parameters`);
      // The hook will handle adding the token
    } else {
      addLog(`Connecting without parameters, will send token via command after connection`);
    }
    
    connect(connectUrl);
  };

  const sendAuthentication = () => {
    if (!isConnected) {
      addLog("WebSocket is not connected", true);
      return;
    }

    if (!token) {
      addLog("Authentication token is required", true);
      return;
    }

    centrifugo.connect(token);
    addLog(`Sent authentication with token: ${token}`);
  };

  const disconnectWebSocket = () => {
    disconnect();
    addLog("WebSocket disconnected");
  };

  const subscribeToChannel = () => {
    if (!isConnected) {
      addLog("WebSocket is not connected", true);
      return;
    }

    if (!channel) {
      addLog("Channel name is required", true);
      return;
    }

    centrifugo.subscribe(channel);
    addLog(`Subscribing to channel: ${channel}`);
  };

  const sendMessage = () => {
    if (!isConnected) {
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
        sendRawMessage(JSON.stringify(jsonMessage));
        addLog(`Sent: ${JSON.stringify(jsonMessage, null, 2)}`);
      } catch (e) {
        // If parsing fails, send as plain text
        sendRawMessage(message);
        addLog(`Sent raw message: ${message}`);
      }

      setMessage('');
    } else if (activeTab === 'raw') {
      if (!rawMessage) {
        addLog("Raw message is empty", true);
        return;
      }

      try {
        sendRawMessage(rawMessage);
        addLog(`Sent raw message: ${rawMessage}`);
      } catch (e) {
        addLog(`Error sending message: ${e}`, true);
      }
    } else if (activeTab === 'command') {
      if (!cmdMethod) {
        addLog("Command method is required", true);
        return;
      }

      try {
        // Parse params if provided
        let params: Record<string, any> = {};
        if (cmdParams) {
          try {
            params = JSON.parse(cmdParams);
          } catch (e) {
            addLog(`Invalid JSON in parameters: ${e}`, true);
            return;
          }
        }

        // Add channel to params for certain methods
        if (['subscribe', 'unsubscribe', 'publish', 'presence', 'history'].includes(cmdMethod) && !params.channel) {
          params = { ...params, channel };
        }

        // Fixed: Type-safe method calling
        switch(cmdMethod) {
          case 'connect':
            centrifugo.connect(params.token || token);
            break;
          case 'subscribe':
            centrifugo.subscribe(params.channel);
            break;
          case 'unsubscribe':
            centrifugo.unsubscribe(params.channel);
            break;
          case 'publish':
            centrifugo.publish(params.channel, params.data || {});
            break;
          case 'presence':
            centrifugo.presence(params.channel);
            break;
          case 'history':
            centrifugo.history(params.channel);
            break;
          case 'ping':
            centrifugo.ping();
            break;
        }
        
        addLog(`Sent ${cmdMethod} command with params: ${JSON.stringify(params)}`);
      } catch (e) {
        addLog(`Error sending command: ${e}`, true);
      }
    }
  };

  const sendPing = () => {
    if (!isConnected) {
      addLog("WebSocket is not connected", true);
      return;
    }
    
    centrifugo.ping();
    addLog("Sent ping command");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    });
  };

  // Sample messages for common operations
  const getSampleMessage = (type: string) => {
    switch (type) {
      case 'connect':
        return JSON.stringify({
          id: 1,
          method: "connect",
          params: {
            token: token || "JWT_TOKEN_HERE"
          }
        }, null, 2);
      case 'subscribe':
        return JSON.stringify({
          id: 2,
          method: "subscribe",
          params: {
            channel: channel || "CHANNEL_NAME"
          }
        }, null, 2);
      case 'publish':
        return JSON.stringify({
          id: 3,
          method: "publish",
          params: {
            channel: channel || "CHANNEL_NAME",
            data: {
              text: "Hello from WebSocket test!"
            }
          }
        }, null, 2);
      case 'unsubscribe':
        return JSON.stringify({
          id: 4,
          method: "unsubscribe",
          params: {
            channel: channel || "CHANNEL_NAME"
          }
        }, null, 2);
      case 'presence':
        return JSON.stringify({
          id: 5,
          method: "presence",
          params: {
            channel: channel || "CHANNEL_NAME"
          }
        }, null, 2);
      case 'history':
        return JSON.stringify({
          id: 6,
          method: "history",
          params: {
            channel: channel || "CHANNEL_NAME"
          }
        }, null, 2);
      case 'ping':
        return JSON.stringify({
          id: 7,
          method: "ping",
          params: {}
        }, null, 2);
      default:
        return "";
    }
  };

  const copyToInput = (template: string) => {
    if (activeTab === 'simple') {
      setMessage(template);
    } else if (activeTab === 'raw') {
      setRawMessage(template);
    }
  };

  // Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Function to save logs to file
  const saveLogsToFile = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get proper code sample based on selected info format
  const getSelectedInfoFormat = () => {
    switch(infoFormat) {
      case 'conn':
        return `// 1. Connect to Centrifugo in URL params (recommended for error 3501)
const socket = new WebSocket("wss://your-server.com/connection/websocket?token=JWT_TOKEN_HERE");

// 2. After connection established, listen for messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};`;
      case 'sub':
        return `// After successful connection and authentication
// Send subscription command
const subscribeCommand = {
  "id": 2,
  "method": "subscribe",
  "params": {
    "channel": "news"
  }
};

socket.send(JSON.stringify(subscribeCommand));

// Handle subscription push messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Check for push messages from subscriptions
  if (data.push && data.push.channel) {
    console.log("Message from channel:", data.push.channel);
    console.log("Data:", data.push.data);
  }
};`;
      case 'common':
        return `// Common Centrifugo error codes:
// 3501 - Bad Request (wrong params or token format)
// 3502 - Stale connection (expired or invalid token)
// 3503 - Unauthorized (missing or invalid credentials)
// 3504 - Rate Limit (too many requests)
// 3505 - Forbidden (access denied)

// JWT token format for Centrifugo:
{
  // Standard claims
  "sub": "user-123",   // Subject (user ID)
  "exp": 1617304605,   // Expiration (timestamp)
  
  // Centrifugo-specific claims
  "channels": ["news", "chat"],  // Allowed channels
  "info": {                      // User info (optional)
    "name": "John",
    "avatar": "url"
  }
}`;
    }
  };

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
                <div className="flex space-x-2">
                  <Input 
                    id="wsUrl" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isConnected || isConnecting}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(url)}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="token">Authentication Token</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="token" 
                    value={token} 
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isConnected}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(token)}
                    title="Copy Token"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
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
              
              {/* Connection method selection */}
              <div className="space-y-2">
                <Label>Connection Method</Label>
                <RadioGroup 
                  value={connectionMethod} 
                  onValueChange={(value) => setConnectionMethod(value as 'command' | 'params')}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="command" id="method-command" />
                    <Label htmlFor="method-command">Connect first, then send token with command (Default)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="params" id="method-params" />
                    <Label htmlFor="method-params">Send token in URL parameters (Try for error 3501)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="debug-mode"
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-subscribe"
                    checked={autoSubscribe}
                    onCheckedChange={setAutoSubscribe}
                    disabled={isConnected}
                  />
                  <Label htmlFor="auto-subscribe">Auto-subscribe</Label>
                </div>
              </div>

              {/* Advanced settings toggle */}
              <div className="flex items-center justify-between pt-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="text-xs"
                >
                  {advancedMode ? "Hide Advanced Settings" : "Show Advanced Settings"}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('debug', 'true');
                    url.pathname = '/websocket';
                    window.history.pushState({}, '', url.toString());
                    window.location.reload();
                  }}
                  className="text-xs"
                >
                  Debug Mode
                </Button>
              </div>

              {advancedMode && (
                <Alert className="bg-muted/50 mt-1">
                  <AlertDescription className="text-xs">
                    <p className="mb-2">Debugging steps for error 3501:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Try adding token in URL parameters</li>
                      <li>Check for trailing slashes in the URL</li>
                      <li>Verify the token format matches server expectations</li>
                      <li>Look for specific headers or parameters required by server</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {lastError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    <p>Code: {lastError.code}</p>
                    <p>Reason: {lastError.reason || 'No reason provided'}</p>
                    {lastError.code === 3501 && (
                      <p className="mt-2">
                        Error 3501 (Bad Request) usually indicates an issue with the connection parameters or token format. 
                        Try sending the token in URL parameters instead of as a command after connection.
                      </p>
                    )}
                    {lastError.code === 3502 && (
                      <p className="mt-2">
                        Error 3502 (Stale) usually indicates that the token has expired or is invalid.
                        Try generating a new token.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {clientId && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Connection Info</AlertTitle>
                  <AlertDescription>
                    <p>Client ID: {clientId}</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {!isConnected ? (
                <Button 
                  onClick={connectWebSocket} 
                  disabled={isConnecting || isConnected}
                >
                  {isConnecting ? (
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
                onClick={sendAuthentication}
                disabled={!isConnected || !token || connectionMethod === 'params'}
                variant="secondary"
              >
                Authenticate
              </Button>
              
              <Button 
                onClick={subscribeToChannel}
                disabled={!isConnected || !channel}
                variant="outline"
              >
                Subscribe
              </Button>
              
              <Button 
                onClick={sendPing}
                disabled={!isConnected}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Ping
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>WebSocket Logs</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription className="flex justify-between items-center">
                <span>Real-time connection events</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={saveLogsToFile}
                    className="h-8"
                    title="Download logs"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearLogs}
                    className="h-8"
                    title="Clear logs"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                      <div key={index} className={`pb-1 ${log.includes('error') || log.includes('Error') ? 'text-destructive' : ''}`}>
                        {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex-col">
              <Tabs defaultValue="simple" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="simple">JSON Message</TabsTrigger>
                  <TabsTrigger value="command">Centrifugo Command</TabsTrigger>
                  <TabsTrigger value="raw">Raw Message</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simple" className="w-full">
                  <div className="w-full space-y-4">
                    <Textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter JSON message to send"
                      className="font-mono text-sm"
                      disabled={!isConnected}
                      rows={5}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('connect'))}
                      >
                        Connect
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('subscribe'))}
                      >
                        Subscribe
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('publish'))}
                      >
                        Publish
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('unsubscribe'))}
                      >
                        Unsubscribe
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('ping'))}
                      >
                        Ping
                      </Button>
                      
                      <div className="grow"></div>
                      
                      <Button 
                        onClick={sendMessage}
                        disabled={!isConnected || !message}
                      >
                        <Send className="h-4 w-4 mr-2" /> Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="command" className="w-full">
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="cmdMethod">Command Method</Label>
                        <Select value={cmdMethod} onValueChange={setCmdMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="connect">connect</SelectItem>
                            <SelectItem value="subscribe">subscribe</SelectItem>
                            <SelectItem value="unsubscribe">unsubscribe</SelectItem>
                            <SelectItem value="publish">publish</SelectItem>
                            <SelectItem value="presence">presence</SelectItem>
                            <SelectItem value="history">history</SelectItem>
                            <SelectItem value="ping">ping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cmdParams">Parameters (Optional JSON)</Label>
                        <Textarea 
                          id="cmdParams"
                          value={cmdParams}
                          onChange={(e) => setCmdParams(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="font-mono text-sm"
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={sendMessage}
                        disabled={!isConnected}
                      >
                        <Send className="h-4 w-4 mr-2" /> Send Command
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
                      disabled={!isConnected}
                      rows={5}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('connect'))}
                      >
                        Connect
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('subscribe'))}
                      >
                        Subscribe
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('publish'))}
                      >
                        Publish
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToInput(getSampleMessage('ping'))}
                      >
                        Ping
                      </Button>
                      
                      <div className="grow"></div>
                      
                      <Button 
                        onClick={sendMessage}
                        disabled={!isConnected || !rawMessage}
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
              Centrifugo WebSocket Protocol Reference
            </CardTitle>
            <CardDescription>
              Documentation for standard Centrifugo WebSocket protocol commands and troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Tabs defaultValue="conn" onValueChange={(val) => setInfoFormat(val as 'conn' | 'sub' | 'common')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="conn">Connection</TabsTrigger>
                  <TabsTrigger value="sub">Subscription</TabsTrigger>
                  <TabsTrigger value="common">Error Codes</TabsTrigger>
                </TabsList>
                
                <div className="bg-secondary/20 p-4 rounded-md">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {getSelectedInfoFormat()}
                  </pre>
                </div>
              </Tabs>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Common Error Codes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Alert>
                    <AlertTitle>Error 3501 (Bad Request)</AlertTitle>
                    <AlertDescription>
                      This typically means the connection parameters or token format are incorrect. Try sending the token in the URL instead of as a command.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <AlertTitle>Error 3502 (Stale)</AlertTitle>
                    <AlertDescription>
                      The connection was closed because the token is stale, expired or invalid. Try generating a new token with the correct claims.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WebSocketTest;
