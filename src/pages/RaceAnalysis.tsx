
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveRaceViewer from '@/components/LiveRaceViewer';
import ProbabilityTable from '@/components/ProbabilityTable';
import { useSimulation } from '@/contexts/SimulationContext';
import { useWebSocket } from '@/hooks/use-websocket';
import ProbabilityChart from '@/components/ProbabilityChart';
import { 
  mockAthletes, 
  mockLiveRaceData, 
  mockProbabilityAnalysis,
  mockRaceResults,
  formatTime
} from '@/data/mockData';
import { Athlete, PositionProbability, TopNProbability } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const RaceAnalysis = () => {
  const { isConnected } = useSimulation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(mockAthletes[0]?.id || '');
  const [liveRaceData, setLiveRaceData] = useState(mockLiveRaceData);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // WebSocket connection
  const { connectionState, sendMessage, onMessage } = useWebSocket({
    url: import.meta.env.VITE_CENTRIFUGO_URL || undefined,
    reconnectOnMount: true,
    onMessage: (message) => {
      console.log('Received WebSocket message:', message);
      handleWebSocketMessage(message);
    }
  });
  
  // State for probability data
  const [positionProbabilities, setPositionProbabilities] = useState<PositionProbability[]>([]);
  const [top2Probabilities, setTop2Probabilities] = useState<TopNProbability[]>([]);
  const [top3Probabilities, setTop3Probabilities] = useState<TopNProbability[]>([]);
  const [top12Probabilities, setTop12Probabilities] = useState<TopNProbability[]>([]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'position_probabilities') {
      setPositionProbabilities(message.payload.probabilities);
    } else if (message.type === 'top_n_probabilities') {
      if (message.payload.topN && Array.isArray(message.payload.probabilities)) {
        const topNType = message.payload.topN.join('_');
        
        if (topNType === '1_2') {
          setTop2Probabilities(message.payload.probabilities);
        } else if (topNType === '1_2_3') {
          setTop3Probabilities(message.payload.probabilities);
        } else if (topNType === '1,2') {
          setTop12Probabilities(message.payload.probabilities);
        }
      }
    } else if (message.type === 'live_race') {
      setLiveRaceData(message.payload);
    }
  };
  
  // Start race simulation
  const startRace = () => {
    setIsSimulating(true);
    sendMessage('request_simulation', { type: 'race' });
    
    // In a real app, this would connect to a WebSocket or fetch API
    // For now we'll just set the live race data after a delay
    setTimeout(() => {
      setIsSimulating(false);
    }, 2000);
  };
  
  // Initialize with mock data on mount
  useEffect(() => {
    // Default position probabilities
    setPositionProbabilities(
      mockProbabilityAnalysis[selectedAthleteId]?.positionProbabilities || []
    );
    
    // Default Top-2 probabilities
    setTop2Probabilities([
      { topN: [1, 2], probability: 0.73 }
    ]);
    
    // Default Top-3 probabilities
    setTop3Probabilities([
      { topN: [1, 2, 3], probability: 0.88 }
    ]);
    
    // Default 1st-2nd place probabilities
    setTop12Probabilities([
      { topN: [1], probability: 0.45 },
      { topN: [2], probability: 0.28 }
    ]);
    
    // Subscribe to channels
    if (connectionState === 'open') {
      sendMessage('subscribe', { channel: `athlete:${selectedAthleteId}:probabilities` });
      sendMessage('subscribe', { channel: 'race:live' });
    }
  }, [selectedAthleteId, connectionState, sendMessage]);
  
  // Update subscriptions when selected athlete changes
  useEffect(() => {
    if (connectionState === 'open') {
      sendMessage('unsubscribe', { channel: 'athlete:*:probabilities' });
      sendMessage('subscribe', { channel: `athlete:${selectedAthleteId}:probabilities` });
    }
  }, [selectedAthleteId, connectionState, sendMessage]);

  // Mock season statistics
  const seasonStats = [
    { distance: '100м', races: 7, wins: 3, podiums: 5, bestTime: '10.42', worstTime: '10.68', avgTime: '10.55' },
    { distance: '200м', races: 5, wins: 2, podiums: 4, bestTime: '20.85', worstTime: '21.24', avgTime: '21.02' },
    { distance: '400м', races: 2, wins: 0, podiums: 1, bestTime: '46.82', worstTime: '47.35', avgTime: '47.08' }
  ];

  // Get the selected athlete data
  const selectedAthlete = mockAthletes.find(athlete => athlete.id === selectedAthleteId);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Комплексный анализ забегов</h1>
          <p className="text-muted-foreground mt-2">
            Анализ соревновательных показателей, вероятностей и статистики за сезон
          </p>
        </div>

        {connectionState !== 'open' && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionState === 'connecting' ? 'Подключение к серверу...' : 'Нет соединения с сервером данных. Используются демо-данные.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Race visualization */}
          <div className="lg:col-span-3">
            <LiveRaceViewer 
              liveRaceData={liveRaceData}
              onStartRace={startRace}
              isSimulating={isSimulating}
            />
          </div>
          
          {/* Probability tables section */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Position probabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Вероятности позиций</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProbabilityTable 
                    probabilities={positionProbabilities}
                    type="position" 
                  />
                </CardContent>
              </Card>
              
              {/* Top-2 probabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Топ-2 вероятности</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProbabilityTable 
                    probabilities={top2Probabilities}
                    type="topn" 
                  />
                </CardContent>
              </Card>
              
              {/* Top-3 probabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Топ-3 вероятности</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProbabilityTable 
                    probabilities={top3Probabilities}
                    type="topn" 
                  />
                </CardContent>
              </Card>
              
              {/* 1st and 2nd place probabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>1-е и 2-е места</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProbabilityTable 
                    probabilities={top12Probabilities}
                    type="topn" 
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Season statistics table */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Статистика забегов за сезон</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дистанция</TableHead>
                      <TableHead className="text-right">Забеги</TableHead>
                      <TableHead className="text-right">Победы</TableHead>
                      <TableHead className="text-right">Подиумы</TableHead>
                      <TableHead className="text-right">Лучшее время</TableHead>
                      <TableHead className="text-right">Худшее время</TableHead>
                      <TableHead className="text-right">Среднее время</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasonStats.map((stat) => (
                      <TableRow key={stat.distance}>
                        <TableCell className="font-medium">{stat.distance}</TableCell>
                        <TableCell className="text-right">{stat.races}</TableCell>
                        <TableCell className="text-right">{stat.wins}</TableCell>
                        <TableCell className="text-right">{stat.podiums}</TableCell>
                        <TableCell className="text-right font-mono">{stat.bestTime}</TableCell>
                        <TableCell className="text-right font-mono">{stat.worstTime}</TableCell>
                        <TableCell className="text-right font-mono">{stat.avgTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Athlete information section */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Информация о спортсмене</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAthlete && (
                  <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: selectedAthlete.jerseyColor || '#cccccc' }}
                      >
                        {selectedAthlete.number || '?'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedAthlete.name}</h3>
                        <p className="text-muted-foreground">
                          {selectedAthlete.age} лет, {selectedAthlete.gender === 'male' ? 'муж' : selectedAthlete.gender === 'female' ? 'жен' : 'др'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4 md:mt-0 ml-0 md:ml-auto">
                      <div>
                        <span className="text-muted-foreground block">Реакция:</span>
                        <span className="font-medium">{selectedAthlete.reactionTime?.toFixed(3) || 'N/A'} сек</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Ускорение:</span>
                        <span className="font-medium">{selectedAthlete.acceleration?.toFixed(1) || 'N/A'} м/с²</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Макс. скорость:</span>
                        <span className="font-medium">{selectedAthlete.maxSpeed?.toFixed(1) || 'N/A'} м/с</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Замедление:</span>
                        <span className="font-medium">{selectedAthlete.deceleration?.toFixed(1) || 'N/A'} м/с²</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
