
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
  formatTime
} from '@/data/mockData';
import { Athlete, PositionProbability, TopNProbability } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import PerformanceChart from '@/components/PerformanceChart';
import AthletePerformanceChart from '@/components/AthletePerformanceChart';
import { useToast } from '@/components/ui/use-toast';

const RaceAnalysis = () => {
  const { toast } = useToast();
  const { isConnected: isSimulationConnected } = useSimulation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(mockAthletes[0]?.id || '');
  const [liveRaceData, setLiveRaceData] = useState(mockLiveRaceData);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // WebSocket state for handling messages
  const [webSocketMessages, setWebSocketMessages] = useState<any[]>([]);
  
  // State for probability data per athlete
  const [athleteProbabilities, setAthleteProbabilities] = useState<Record<string, {
    positionProbabilities: PositionProbability[],
    top2Probabilities: TopNProbability[],
    top3Probabilities: TopNProbability[],
    top12Probabilities: TopNProbability[]
  }>>({});
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    console.log("Received WebSocket message:", message);
    
    if (message.type === 'position_probabilities' && message.payload?.athleteId) {
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
    } else if (message.type === 'top_n_probabilities' && message.payload?.athleteId) {
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
  
  // Initialize WebSocket connection
  const { 
    connectionState, 
    isConnected: isWsConnected, 
    connect,
    subscribe 
  } = useWebSocket({
    url: undefined, // Connect manually
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      toast({
        title: "WebSocket подключен",
        description: "Соединение с сервером данных установлено"
      });
      
      // Subscribe to channels
      subscribe('live_race');
      subscribe('probabilities');
    },
    onError: (error) => {
      toast({
        title: "Ошибка WebSocket",
        description: "Не удалось подключиться к серверу данных",
        variant: "destructive"
      });
      console.error("WebSocket error:", error);
    }
  });
  
  // Connect to WebSocket on page load
  useEffect(() => {
    // Get token from URL, localStorage or other source
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const wsUrl = "wss://centrifugo.example.com/connection/websocket";
    
    // Connect with token if available
    if (token) {
      connect(wsUrl, token);
    } else {
      connect(wsUrl);
    }
  }, []);
  
  // Start race simulation
  const startRace = () => {
    setIsSimulating(true);
    // In a real implementation this would send a message through the WebSocket
    console.log('Starting race simulation');
    
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
  }, []);

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

  // Check if either simulation or direct WebSocket is connected
  const hasConnection = isSimulationConnected || isWsConnected;
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Комплексный анализ забегов</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Анализ соревновательных показателей, вероятностей и результатов в реальном времени
          </p>
        </div>

        {!hasConnection && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Нет соединения с сервером данных. Используются демо-данные.
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
            <Card className="overflow-hidden border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Динамика результатов</CardTitle>
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
                      <div className="text-sm text-slate-600 dark:text-slate-300 mt-1 space-y-1.5 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Текущая позиция:</span>
                          <span>{athlete.currentPosition}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Текущая скорость:</span>
                          <span>{athlete.currentSpeed.toFixed(1)} м/с</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Пройдено:</span>
                          <span>{athlete.currentDistance.toFixed(1)} м</span>
                        </div>
                        {athleteDetails.reactionTime !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Реакция:</span>
                            <span>{athleteDetails.reactionTime.toFixed(3)} с</span>
                          </div>
                        )}
                        {athleteDetails.maxSpeed !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Макс. скорость:</span>
                            <span>{athleteDetails.maxSpeed.toFixed(1)} м/с</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Probability tables */}
                      <div className="space-y-5">
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
        </div>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
