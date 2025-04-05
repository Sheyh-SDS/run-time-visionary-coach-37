
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveRaceViewer from '@/components/LiveRaceViewer';
import ProbabilityTable from '@/components/ProbabilityTable';
import AthleteStatsCard from '@/components/AthleteStatsCard';
import { useSimulation } from '@/contexts/SimulationContext';
import { 
  mockAthletes, 
  mockLiveRaceData, 
  mockTopNProbabilities, 
  mockProbabilityAnalysis,
  mockRaceResults,
  formatTime
} from '@/data/mockData';
import { Athlete, PositionProbability, TopNProbability } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RaceAnalysis = () => {
  const { isConnected } = useSimulation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(mockAthletes[0]?.id || '');
  const [liveRaceData, setLiveRaceData] = useState(mockLiveRaceData);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Start race simulation
  const startRace = () => {
    setIsSimulating(true);
    
    // In a real app, this would connect to a WebSocket or fetch API
    // For now we'll just set the live race data after a delay
    setTimeout(() => {
      setIsSimulating(false);
    }, 2000);
  };
  
  // Get position probabilities for the selected athlete
  const getPositionProbabilities = (): PositionProbability[] => {
    const athleteAnalysis = mockProbabilityAnalysis[selectedAthleteId];
    return athleteAnalysis?.positionProbabilities || [];
  };
  
  // Create top N probabilities
  const getTopNProbabilities = (): TopNProbability[] => {
    return [
      { topN: [1], probability: 0.45 },
      { topN: [1, 2], probability: 0.73 },
      { topN: [1, 2, 3], probability: 0.88 }
    ];
  };
  
  // Get the selected athlete data
  const selectedAthlete = mockAthletes.find(athlete => athlete.id === selectedAthleteId);

  // Mock season statistics
  const seasonStats = [
    { distance: '100м', races: 7, wins: 3, podiums: 5, bestTime: '10.42', worstTime: '10.68', avgTime: '10.55' },
    { distance: '200м', races: 5, wins: 2, podiums: 4, bestTime: '20.85', worstTime: '21.24', avgTime: '21.02' },
    { distance: '400м', races: 2, wins: 0, podiums: 1, bestTime: '46.82', worstTime: '47.35', avgTime: '47.08' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Комплексный анализ забегов</h1>
          <p className="text-muted-foreground mt-2">
            Анализ соревновательных показателей, вероятностей и статистики за сезон
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Race visualization */}
          <div className="lg:col-span-2">
            <LiveRaceViewer 
              liveRaceData={liveRaceData}
              onStartRace={startRace}
              isSimulating={isSimulating}
            />
          </div>
          
          {/* Right column: Athlete stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Информация о спортсмене</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAthlete && (
                  <div className="space-y-4">
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
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Реакция:</span>
                      </div>
                      <div className="font-medium">{selectedAthlete.reactionTime?.toFixed(3) || 'N/A'} сек</div>
                      
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Макс. скорость:</span>
                      </div>
                      <div className="font-medium">{selectedAthlete.maxSpeed?.toFixed(1) || 'N/A'} м/с</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="probabilities" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="probabilities">Вероятности</TabsTrigger>
            <TabsTrigger value="topn">Топ-N Вероятности</TabsTrigger>
            <TabsTrigger value="season">Статистика сезона</TabsTrigger>
          </TabsList>
          
          <TabsContent value="probabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Вероятности позиций в забеге</CardTitle>
              </CardHeader>
              <CardContent>
                <ProbabilityTable 
                  probabilities={getPositionProbabilities()}
                  type="position" 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="topn" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Вероятности попадания в Топ-N</CardTitle>
              </CardHeader>
              <CardContent>
                <ProbabilityTable 
                  probabilities={getTopNProbabilities()}
                  type="topn"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="season" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
