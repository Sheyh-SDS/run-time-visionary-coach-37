
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/use-websocket';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, Send, Plus, Trash, RefreshCw, Check, Key, Copy, CheckCheck } from 'lucide-react';
import { simulationApi, SIMULATION_MESSAGES } from '@/services/simulationApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WebSocketTest: React.FC = () => {
  const { toast } = useToast();
  const [serverUrl, setServerUrl] = useState('wss://centrifugo.example.com/connection/websocket');
  const [authToken, setAuthToken] = useState('');
  const [channelName, setChannelName] = useState('test');
  const [messageText, setMessageText] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<{channel: string, data: any, time: string}[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('connect');
  const [useToken, setUseToken] = useState(false);
  const [jsonFormatted, setJsonFormatted] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messageTemplate, setMessageTemplate] = useState('custom');

  // Message templates
  const messageTemplates = {
    custom: { text: "Custom message" },
    athleteUpdate: { 
      type: "athlete_update", 
      payload: { 
        athleteId: "athlete-123",
        name: "John Doe",
        currentPosition: 2,
        currentSpeed: 8.5,
        currentDistance: 50.2
      }
    },
    sessionUpdate: {
      type: "session_update",
      payload: {
        sessionId: "session-456",
        athleteId: "athlete-123",
        distance: 100,
        time: 12.34,
        date: new Date().toISOString()
      }
    },
    liveRace: {
      type: "live_race",
      payload: {
        raceId: "race-789",
        status: "running",
        athletes: [
          { athleteId: "athlete-123", currentPosition: 1, currentSpeed: 9.1 },
          { athleteId: "athlete-456", currentPosition: 2, currentSpeed: 8.9 }
        ],
        elapsedTime: 15.2
      }
    }
  };

  const handleMessage = (message: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setReceivedMessages(prev => [...prev, {
      channel: message.channel || 'unknown',
      data: message,
      time: timestamp
    }]);
  };

  const { 
    connectionState, 
    isConnected, 
    connect, 
    disconnect, 
    setToken,
    subscribe, 
    unsubscribe, 
    publish,
    send,
    getConnectionId
  } = useWebSocket({
    url: undefined, // We'll connect manually
    onMessage: handleMessage,
    onOpen: () => {
      toast({
        title: "Подключено к серверу",
        description: `Соединение установлено с ID: ${getConnectionId()}`,
      });
      setActiveTab('subscribe');
    },
    onClose: () => {
      toast({
        title: "Соединение закрыто",
        description: "Соединение с сервером было закрыто."
      });
      setActiveSubscriptions([]);
    },
    onError: () => {
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setAuthToken(token);
      setUseToken(true);
      toast({
        title: "Токен получен",
        description: "Токен авторизации получен из URL",
      });
    }
  }, []);

  const handleConnect = () => {
    if (!serverUrl) {
      toast({
        title: "Ошибка",
        description: "Введите URL сервера Centrifugo",
        variant: "destructive"
      });
      return;
    }
    
    if (useToken && !authToken) {
      toast({
        title: "Ошибка",
        description: "Введите токен авторизации или отключите использование токена",
        variant: "destructive"
      });
      return;
    }
    
    connect(serverUrl, useToken ? authToken : undefined);
  };

  const handleUpdateToken = () => {
    if (!authToken) {
      toast({
        title: "Ошибка",
        description: "Введите токен авторизации",
        variant: "destructive"
      });
      return;
    }
    
    setToken(authToken);
    toast({
      title: "Токен обновлен",
      description: "Токен авторизации был обновлен",
    });
  };

  const handleDisconnect = () => {
    disconnect();
    setActiveSubscriptions([]);
  };

  const handleSubscribe = () => {
    if (!channelName) {
      toast({
        title: "Ошибка",
        description: "Введите имя канала",
        variant: "destructive"
      });
      return;
    }

    if (activeSubscriptions.includes(channelName)) {
      toast({
        title: "Канал уже подписан",
        description: `Вы уже подписаны на канал ${channelName}`,
      });
      return;
    }

    subscribe(channelName, (data) => {
      const timestamp = new Date().toLocaleTimeString();
      setReceivedMessages(prev => [...prev, {
        channel: channelName,
        data,
        time: timestamp
      }]);
    });

    setActiveSubscriptions(prev => [...prev, channelName]);
    setChannelName('');
    toast({
      title: "Подписка оформлена",
      description: `Вы подписались на канал ${channelName}`,
    });
  };

  const handleUnsubscribe = (channel: string) => {
    unsubscribe(channel);
    setActiveSubscriptions(prev => prev.filter(sub => sub !== channel));
    toast({
      title: "Подписка отменена",
      description: `Вы отписались от канала ${channel}`,
    });
  };

  const handlePublish = () => {
    if (!activeSubscriptions.length) {
      toast({
        title: "Нет активных подписок",
        description: "Подпишитесь на канал перед отправкой сообщения",
        variant: "destructive"
      });
      return;
    }

    try {
      let messageData;
      
      if (messageText.trim()) {
        try {
          messageData = JSON.parse(messageText);
        } catch (e) {
          // If not valid JSON, send as text string
          messageData = { text: messageText };
        }
      } else {
        messageData = { text: "Test message", timestamp: new Date().toISOString() };
      }
      
      publish(activeSubscriptions[0], messageData);
      toast({
        title: "Сообщение отправлено",
        description: `Сообщение отправлено в канал ${activeSubscriptions[0]}`,
      });
    } catch (error) {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщение.",
        variant: "destructive"
      });
    }
  };

  const handleSubscribeToSimulationChannels = () => {
    const channels = simulationApi.getChannels();
    Object.values(channels).forEach(channel => {
      if (!activeSubscriptions.includes(channel)) {
        subscribe(channel);
        setActiveSubscriptions(prev => [...prev, channel]);
      }
    });
    
    toast({
      title: "Подписка на каналы симуляции",
      description: "Вы подписались на все каналы симуляции",
    });
  };

  const clearMessages = () => {
    setReceivedMessages([]);
  };

  const formatJson = () => {
    try {
      const jsonObj = JSON.parse(messageText);
      setMessageText(JSON.stringify(jsonObj, null, 2));
      setJsonFormatted(true);
    } catch (e) {
      toast({
        title: "Ошибка форматирования",
        description: "Текст не является валидным JSON",
        variant: "destructive"
      });
    }
  };

  const minifyJson = () => {
    try {
      const jsonObj = JSON.parse(messageText);
      setMessageText(JSON.stringify(jsonObj));
      setJsonFormatted(false);
    } catch (e) {
      toast({
        title: "Ошибка минификации",
        description: "Текст не является валидным JSON",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTemplateChange = (value: string) => {
    setMessageTemplate(value);
    if (value === 'custom') {
      return;
    }
    
    const template = messageTemplates[value as keyof typeof messageTemplates];
    setMessageText(JSON.stringify(template, null, 2));
    setJsonFormatted(true);
  };

  const connectionInfo = () => {
    if (connectionState === 'open') {
      return {
        icon: <Wifi className="h-5 w-5 text-green-500" />,
        label: "Подключено",
        description: `ID соединения: ${getConnectionId() || 'неизвестно'}`
      };
    } else if (connectionState === 'connecting') {
      return {
        icon: <Wifi className="h-5 w-5 text-amber-500 animate-pulse" />,
        label: "Подключение...",
        description: "Установка соединения с сервером"
      };
    } else if (connectionState === 'error') {
      return {
        icon: <WifiOff className="h-5 w-5 text-red-500" />,
        label: "Ошибка подключения",
        description: "Не удалось подключиться к серверу"
      };
    } else {
      return {
        icon: <WifiOff className="h-5 w-5 text-muted-foreground" />,
        label: "Отключено",
        description: "Соединение не установлено"
      };
    }
  };

  const info = connectionInfo();

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Centrifugo WebSocket Test</h1>
        <p className="text-muted-foreground">
          Тестирование соединения с Centrifugo и обмена JSON сообщениями по WebSocket
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {info.icon}
                  <span>{info.label}</span>
                </CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="connect">Соединение</TabsTrigger>
                    <TabsTrigger value="subscribe" disabled={!isConnected}>Подписки</TabsTrigger>
                    <TabsTrigger value="publish" disabled={!isConnected || !activeSubscriptions.length}>JSON</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connect" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="server-url">URL сервера Centrifugo</Label>
                      <Input
                        id="server-url"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="wss://centrifugo.example.com/connection/websocket"
                        disabled={isConnected}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-token">Токен авторизации</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="use-token"
                            checked={useToken}
                            onChange={() => setUseToken(!useToken)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="use-token" className="text-xs">Использовать токен</Label>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="auth-token"
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          placeholder="JWT токен"
                          disabled={isConnected || !useToken}
                          className={useToken ? "" : "opacity-50"}
                        />
                        {isConnected && (
                          <Button 
                            onClick={handleUpdateToken}
                            size="icon"
                            disabled={!useToken}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleDisconnect}
                      >
                        <WifiOff className="mr-2 h-4 w-4" />
                        Отключиться
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={handleConnect}
                        disabled={connectionState === 'connecting'}
                      >
                        {connectionState === 'connecting' ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wifi className="mr-2 h-4 w-4" />
                        )}
                        Подключиться
                      </Button>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="subscribe" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel-name">Имя канала</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="channel-name"
                          value={channelName}
                          onChange={(e) => setChannelName(e.target.value)}
                          placeholder="Введите имя канала"
                        />
                        <Button 
                          onClick={handleSubscribe}
                          disabled={!channelName}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Активные подписки</Label>
                      {activeSubscriptions.length > 0 ? (
                        <div className="space-y-2">
                          {activeSubscriptions.map((channel) => (
                            <div key={channel} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                              <span className="text-sm">{channel}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleUnsubscribe(channel)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center p-2">
                          Нет активных подписок
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={handleSubscribeToSimulationChannels}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Подписаться на каналы симуляции
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="publish" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="message-template">Шаблон сообщения</Label>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={formatJson}
                          >
                            Форматировать
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={minifyJson}
                          >
                            Минифицировать
                          </Button>
                        </div>
                      </div>
                      <Select value={messageTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите шаблон" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Пользовательское сообщение</SelectItem>
                          <SelectItem value="athleteUpdate">Обновление спортсмена</SelectItem>
                          <SelectItem value="sessionUpdate">Обновление сессии</SelectItem>
                          <SelectItem value="liveRace">Обновление гонки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message-text">JSON сообщение</Label>
                      <Textarea
                        id="message-text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder='{"text": "Hello world"}'
                        className="font-mono text-sm h-32"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Отправить в канал: 
                        <Badge variant="outline" className="ml-2">
                          {activeSubscriptions[0] || 'нет канала'}
                        </Badge>
                      </div>
                      <Button onClick={handlePublish} disabled={!activeSubscriptions.length}>
                        <Send className="mr-2 h-4 w-4" />
                        Отправить
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Полученные JSON сообщения</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearMessages}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Очистить
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {receivedMessages.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {receivedMessages.map((msg, idx) => (
                      <div key={idx} className="p-3 bg-secondary rounded-md">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <div>Канал: <Badge variant="outline">{msg.channel}</Badge></div>
                          <div>{msg.time}</div>
                        </div>
                        <div className="flex justify-end mb-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => copyToClipboard(JSON.stringify(msg.data, null, 2), idx)}
                          >
                            {copiedIndex === idx ? 
                              <CheckCheck className="h-3 w-3 text-green-500" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                        <pre className="text-xs font-mono overflow-x-auto p-2 bg-background rounded">
                          {JSON.stringify(msg.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <p>Нет полученных сообщений</p>
                    <p className="text-sm mt-2">Подпишитесь на канал для получения сообщений</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="w-full flex justify-between items-center text-sm text-muted-foreground">
                  <div>Всего сообщений: {receivedMessages.length}</div>
                  {isConnected && (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      Соединение активно
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WebSocketTest;
