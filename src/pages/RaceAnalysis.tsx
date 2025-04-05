
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveRaceViewer from '@/components/LiveRaceViewer';
import ProbabilityTable from '@/components/ProbabilityTable';
import { useSimulation } from '@/contexts/SimulationContext';
import { useWebSocket } from '@/hooks/use-websocket';
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
import RaceResultsTable from '@/components/RaceResultsTable';

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

  // Extract all athletes from live race data
  const raceAthletes = liveRaceData?.athletes || [];

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
          {/* Race visualization */}
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
          
          {/* All Athletes Information */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Участники забега</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {raceAthletes.map((athlete) => {
                    // Find the matching athlete in mockAthletes to get full details
                    const athleteDetails = mockAthletes.find(a => a.id === athlete.athleteId) || {
                      id: athlete.athleteId,
                      name: athlete.name,
                      age: 0,
                      gender: 'other' as const,
                      specialization: [],
                      personalBests: {},
                      number: athlete.number,
                      jerseyColor: athlete.jerseyColor
                    };
                    
                    return (
                      <Card key={athlete.athleteId} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-1"
                              style={{ backgroundColor: athlete.jerseyColor || '#cccccc' }}
                            >
                              {athlete.number}
                            </div>
                            <div>
                              <h3 className="font-medium">{athlete.name}</h3>
                              
                              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                <div>
                                  <span className="inline-block w-28">Текущая позиция:</span>
                                  <span className="font-medium">{athlete.currentPosition}</span>
                                </div>
                                <div>
                                  <span className="inline-block w-28">Текущая скорость:</span>
                                  <span className="font-medium">{athlete.currentSpeed.toFixed(1)} м/с</span>
                                </div>
                                <div>
                                  <span className="inline-block w-28">Пройдено:</span>
                                  <span className="font-medium">{athlete.currentDistance.toFixed(1)} м</span>
                                </div>
                                {athleteDetails.reactionTime !== undefined && (
                                  <div>
                                    <span className="inline-block w-28">Реакция:</span>
                                    <span className="font-medium">{athleteDetails.reactionTime.toFixed(3)} с</span>
                                  </div>
                                )}
                                {athleteDetails.maxSpeed !== undefined && (
                                  <div>
                                    <span className="inline-block w-28">Макс. скорость:</span>
                                    <span className="font-medium">{athleteDetails.maxSpeed.toFixed(1)} м/с</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
        </div>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
