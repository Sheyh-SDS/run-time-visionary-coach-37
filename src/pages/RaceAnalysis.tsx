
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
import { ChartContainer } from '@/components/ui/chart';
import PerformanceChart from '@/components/PerformanceChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AthletePerformanceChart from '@/components/AthletePerformanceChart';

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
  
  // State for probability data per athlete
  const [athleteProbabilities, setAthleteProbabilities] = useState<Record<string, {
    positionProbabilities: PositionProbability[],
    top2Probabilities: TopNProbability[],
    top3Probabilities: TopNProbability[],
    top12Probabilities: TopNProbability[]
  }>>({});
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'position_probabilities' && message.payload.athleteId) {
      const athleteId = message.payload.athleteId;
      setAthleteProbabilities(prev => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] || {
            positionProbabilities: [],
            top2Probabilities: [],
            top3Probabilities: [],
            top12Probabilities: []
          }),
          positionProbabilities: message.payload.probabilities
        }
      }));
    } else if (message.type === 'top_n_probabilities' && message.payload.athleteId) {
      const athleteId = message.payload.athleteId;
      if (message.payload.topN && Array.isArray(message.payload.probabilities)) {
        const topNType = message.payload.topN.join('_');
        
        setAthleteProbabilities(prev => {
          const athleteData = prev[athleteId] || {
            positionProbabilities: [],
            top2Probabilities: [],
            top3Probabilities: [],
            top12Probabilities: []
          };
          
          let updatedData = { ...athleteData };
          
          if (topNType === '1_2') {
            updatedData.top2Probabilities = message.payload.probabilities;
          } else if (topNType === '1_2_3') {
            updatedData.top3Probabilities = message.payload.probabilities;
          } else if (topNType === '1,2') {
            updatedData.top12Probabilities = message.payload.probabilities;
          }
          
          return {
            ...prev,
            [athleteId]: updatedData
          };
        });
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
    // Create mock data for all athletes
    const mockProbData = {};
    
    liveRaceData.athletes.forEach(athlete => {
      mockProbData[athlete.athleteId] = {
        positionProbabilities: mockProbabilityAnalysis[athlete.athleteId]?.positionProbabilities || [
          { position: 1, probability: Math.random() * 0.4 + 0.1 },
          { position: 2, probability: Math.random() * 0.3 + 0.1 },
          { position: 3, probability: Math.random() * 0.2 + 0.1 },
          { position: 4, probability: Math.random() * 0.2 + 0.05 },
          { position: 5, probability: Math.random() * 0.1 + 0.05 },
          { position: 6, probability: Math.random() * 0.1 }
        ],
        top2Probabilities: [
          { topN: [1, 2], probability: Math.random() * 0.4 + 0.3 }
        ],
        top3Probabilities: [
          { topN: [1, 2, 3], probability: Math.random() * 0.2 + 0.7 }
        ],
        top12Probabilities: [
          { topN: [1], probability: Math.random() * 0.3 + 0.2 },
          { topN: [2], probability: Math.random() * 0.2 + 0.1 }
        ]
      };
    });
    
    setAthleteProbabilities(mockProbData);
    
    // Subscribe to channels for each athlete
    if (connectionState === 'open') {
      liveRaceData.athletes.forEach(athlete => {
        sendMessage('subscribe', { channel: `athlete:${athlete.athleteId}:probabilities` });
      });
      sendMessage('subscribe', { channel: 'race:live' });
    }
  }, [connectionState, sendMessage]);

  // Mock season statistics
  const seasonStats = [
    { distance: '100м', races: 7, wins: 3, podiums: 5, bestTime: '10.42', worstTime: '10.68', avgTime: '10.55' },
    { distance: '200м', races: 5, wins: 2, podiums: 4, bestTime: '20.85', worstTime: '21.24', avgTime: '21.02' },
    { distance: '400м', races: 2, wins: 0, podiums: 1, bestTime: '46.82', worstTime: '47.35', avgTime: '47.08' }
  ];

  // Extract all athletes from live race data
  const raceAthletes = liveRaceData?.athletes || [];

  // Mock performance data for chart
  const performanceData = raceAthletes.map(athlete => {
    return {
      id: athlete.athleteId,
      color: athlete.jerseyColor,
      name: athlete.name,
      number: athlete.number,
      data: [
        { race: 'Race 1', position: Math.floor(Math.random() * 6) + 1 },
        { race: 'Race 2', position: Math.floor(Math.random() * 6) + 1 },
        { race: 'Race 3', position: Math.floor(Math.random() * 6) + 1 },
        { race: 'Race 4', position: Math.floor(Math.random() * 6) + 1 },
        { race: 'Race 5', position: Math.floor(Math.random() * 6) + 1 }
      ]
    };
  });

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
          
          {/* Performance Chart */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Динамика результатов</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AthletePerformanceChart athletes={performanceData} />
              </CardContent>
            </Card>
          </div>
          
          {/* All Athletes Information with Probability Tables */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raceAthletes.map((athlete) => {
                const athleteData = athleteProbabilities[athlete.athleteId] || {
                  positionProbabilities: [],
                  top2Probabilities: [],
                  top3Probabilities: [],
                  top12Probabilities: []
                };
                
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
                  <Card key={athlete.athleteId} className="overflow-hidden border-t-4" style={{ borderTopColor: athlete.jerseyColor }}>
                    <CardHeader className="pb-0">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: athlete.jerseyColor }}
                        >
                          {athlete.number}
                        </div>
                        <CardTitle className="text-lg">{athlete.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Athlete current status */}
                      <div className="text-sm text-muted-foreground mt-1 space-y-1 mb-4">
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
                      
                      {/* Probability tables */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2 text-sm">Вероятности позиций</h4>
                          <ProbabilityTable 
                            probabilities={athleteData.positionProbabilities}
                            type="position"
                            compact={true}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-sm">Топ-2</h4>
                            <ProbabilityTable 
                              probabilities={athleteData.top2Probabilities}
                              type="topn"
                              compact={true}
                            />
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 text-sm">Топ-3</h4>
                            <ProbabilityTable 
                              probabilities={athleteData.top3Probabilities}
                              type="topn"
                              compact={true}
                            />
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 text-sm">1-е и 2-е места</h4>
                            <ProbabilityTable 
                              probabilities={athleteData.top12Probabilities}
                              type="topn"
                              compact={true}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
        </div>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
