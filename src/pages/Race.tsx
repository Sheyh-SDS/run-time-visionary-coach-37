
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { simulationApi } from '@/services/simulationApi';
import RaceResultsTable from '@/components/RaceResultsTable';
import LiveRaceViewer from '@/components/LiveRaceViewer';
import AthleteStatsCard from '@/components/AthleteStatsCard';
import ProbabilityTable from '@/components/ProbabilityTable';
import { Athlete, RaceResult, LiveRaceData, TopNProbability } from '@/types';
import { Loader2, AlertTriangle, Play, User } from 'lucide-react';

const Race = () => {
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [raceDistance, setRaceDistance] = useState<number>(100);
  const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);
  const [liveRaceData, setLiveRaceData] = useState<LiveRaceData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAthleteStats, setShowAthleteStats] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch athletes data
  const { 
    data: athletes = [], 
    isLoading: isLoadingAthletes,
    error: athletesError 
  } = useQuery({
    queryKey: ['athletes'],
    queryFn: simulationApi.getAthletes,
    staleTime: 5 * 60 * 1000,
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching athletes:', err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные спортсменов. Пожалуйста, попробуйте позже.",
          variant: "destructive"
        });
      }
    }
  });

  // Fetch top-N probabilities
  const { 
    data: topNProbabilities = [], 
    isLoading: isLoadingProbabilities,
    refetch: refetchProbabilities
  } = useQuery({
    queryKey: ['topn-probabilities', selectedAthleteId, raceDistance],
    queryFn: () => {
      if (!selectedAthleteId) return Promise.resolve([]);
      return simulationApi.getTopNProbabilities(
        selectedAthleteId,
        raceDistance,
        [[1], [2], [3], [1, 2], [2, 3], [1, 2, 3]]
      );
    },
    enabled: !!selectedAthleteId,
    staleTime: 60 * 1000,
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching probabilities:', err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные вероятностей.",
          variant: "destructive"
        });
      }
    }
  });

  // Setup live race data listener
  useEffect(() => {
    const unsubscribe = simulationApi.onLiveRaceUpdate((data) => {
      setLiveRaceData(data);
      
      // If race finished, update results
      if (data.status === 'finished') {
        simulationApi.getRaceResults(data.distance)
          .then(results => {
            setRaceResults(results);
            setIsSimulating(false);
          })
          .catch(error => {
            console.error('Error fetching race results:', error);
            toast({
              title: "Ошибка загрузки",
              description: "Не удалось загрузить результаты забега.",
              variant: "destructive"
            });
            setIsSimulating(false);
          });
      }
    });
    
    return () => {
      unsubscribe();
      simulationApi.stopLiveRaceSimulation();
    };
  }, [toast]);

  // Handle athlete selection
  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      } else {
        // Limit to 6 athletes
        if (prev.length >= 6) {
          toast({
            title: "Максимум спортсменов",
            description: "В забеге может участвовать максимум 6 спортсменов",
          });
          return prev;
        }
        return [...prev, athleteId];
      }
    });
  };

  // Start a live race simulation
  const startRaceSimulation = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "Выберите спортсменов",
        description: "Для начала симуляции выберите хотя бы одного спортсмена",
        variant: "destructive"
      });
      return;
    }
    
    setIsSimulating(true);
    setRaceResults(null);
    
    try {
      await simulationApi.startLiveRaceSimulation(raceDistance, selectedAthletes);
      toast({
        title: "Симуляция запущена",
        description: `Началась симуляция забега на ${raceDistance}м`,
      });
    } catch (error) {
      console.error('Error starting race simulation:', error);
      toast({
        title: "Ошибка симуляции",
        description: "Не удалось запустить симуляцию забега",
        variant: "destructive"
      });
      setIsSimulating(false);
    }
  };

  // Show athlete details
  const handleShowAthleteStats = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setShowAthleteStats(true);
    // Refetch probabilities when an athlete is selected
    if (athleteId !== selectedAthleteId) {
      setTimeout(() => refetchProbabilities(), 0);
    }
  };

  // Component to render the athlete selection grid
  const renderAthleteSelection = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {athletes.map(athlete => (
          <Card 
            key={athlete.id}
            className={`cursor-pointer transition-all ${
              selectedAthletes.includes(athlete.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => toggleAthleteSelection(athlete.id)}
          >
            <CardContent className="flex items-center p-4">
              <div 
                className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white"
                style={{ backgroundColor: athlete.jerseyColor || '#cccccc' }}
              >
                {athlete.number || '?'}
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{athlete.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {athlete.specialization.join(', ')}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowAthleteStats(athlete.id);
                }}
              >
                <User className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Component to render error state
  const renderErrorState = (message: string) => (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  // Function to group top-N probabilities into categories
  const getProbabilityGroups = () => {
    const singlePositions = topNProbabilities.filter(p => p.topN.length === 1);
    const topNGroups = topNProbabilities.filter(p => p.topN.length > 1);
    
    return { singlePositions, topNGroups };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Анализ забега</h1>
          <p className="text-muted-foreground mt-1">
            Анализ вероятностей и симуляция забега в реальном времени
          </p>
        </div>
        
        {isLoadingAthletes ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64 p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка данных спортсменов...</p>
              </div>
            </CardContent>
          </Card>
        ) : athletesError ? (
          renderErrorState("Не удалось загрузить список спортсменов. Пожалуйста, попробуйте позже.")
        ) : (
          <Tabs defaultValue="setup" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="setup">Настройка</TabsTrigger>
              <TabsTrigger value="live">Симуляция</TabsTrigger>
              <TabsTrigger value="results">Результаты</TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Выбор спортсменов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Дистанция</label>
                    <div className="flex space-x-2">
                      {[100, 200, 400, 800, 1500].map(distance => (
                        <Button 
                          key={distance}
                          variant={raceDistance === distance ? "default" : "outline"}
                          onClick={() => setRaceDistance(distance)}
                          className="flex-grow"
                        >
                          {distance}м
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Выберите до 6 спортсменов для участия в забеге
                    </label>
                    {renderAthleteSelection()}
                  </div>
                  <Button 
                    onClick={startRaceSimulation} 
                    className="w-full md:w-auto"
                    disabled={selectedAthletes.length === 0 || isSimulating}
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Симуляция...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Начать симуляцию
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="live">
              <LiveRaceViewer 
                liveRaceData={liveRaceData} 
                onStartRace={startRaceSimulation}
                isSimulating={isSimulating}
              />
            </TabsContent>
            
            <TabsContent value="results">
              <RaceResultsTable 
                results={raceResults}
                onShowAthleteStats={handleShowAthleteStats}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Athlete Stats Dialog */}
      <Dialog open={showAthleteStats} onOpenChange={setShowAthleteStats}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Статистика спортсмена</DialogTitle>
          </DialogHeader>
          
          {selectedAthleteId && (
            <Tabs defaultValue="stats" className="mt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="stats">Характеристики</TabsTrigger>
                <TabsTrigger value="probabilities">Вероятности позиций</TabsTrigger>
                <TabsTrigger value="topn">Вероятности топ-N</TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats">
                <AthleteStatsCard 
                  athlete={athletes.find(a => a.id === selectedAthleteId) as Athlete} 
                />
              </TabsContent>
              
              <TabsContent value="probabilities">
                {isLoadingProbabilities ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ProbabilityTable 
                    probabilities={getProbabilityGroups().singlePositions} 
                    type="position"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="topn">
                {isLoadingProbabilities ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ProbabilityTable 
                    probabilities={getProbabilityGroups().topNGroups} 
                    type="topn"
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Race;
