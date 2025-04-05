
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
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use the WebSocket hook
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
        addLog(`WebSocket error: ${lastError?.message || 'Unknown error'}`, true);
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

    connect(url);
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
        let params = {};
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
          params = { ...params, channel: channel };
        }

        centrifugo[cmdMethod as keyof typeof centrifugo]?.(params.channel, params.data);
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
                        Try a different token or check if the server expects a specific format.
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
                disabled={!isConnected || !token}
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
              <div>
                <h3 className="text-lg font-medium mb-2">Common Error Codes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Alert>
                    <AlertTitle>Error 3501 (Bad Request)</AlertTitle>
                    <AlertDescription>
                      This typically means the connection parameters or token format are incorrect. Ensure your token is properly formatted and has the required claims.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <AlertTitle>Error 1006 (Abnormal Close)</AlertTitle>
                    <AlertDescription>
                      The connection was closed abnormally, without proper closing handshake. This often indicates network problems or server issues.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
              
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
                  <h3 className="text-md font-medium mb-2">Ping Command</h3>
                  <pre className="bg-secondary/20 p-3 rounded text-xs overflow-auto">
                    {`{
  "id": 7,
  "method": "ping",
  "params": {}
}`}
                  </pre>
                </div>
              </div>
              
              <Alert className="bg-muted/50">
                <Code className="h-4 w-4" />
                <AlertTitle>Troubleshooting Tips</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Always send a <strong>connect</strong> command immediately after WebSocket connection is established</li>
                    <li>Ensure your JWT token is correctly formatted and signed</li>
                    <li>For connection issues, check that the server URL is correct and accessible</li>
                    <li>Send periodic <strong>ping</strong> commands to keep the connection alive</li>
                    <li>Always check response errors by looking for <code className="text-xs bg-muted p-0.5 rounded">data.error</code> in responses</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WebSocketTest;
