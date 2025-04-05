
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RunSimulator from '@/components/RunSimulator';
import SplitTimesChart from '@/components/SplitTimesChart';
import ProbabilityChart from '@/components/ProbabilityChart';
import SessionDetail from '@/components/SessionDetail';
import { RunSession, Athlete, ProbabilityAnalysis } from '@/types';
import { simulationApi } from '@/services/simulationApi';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const Simulation = () => {
  const [simulatedSession, setSimulatedSession] = useState<RunSession | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [probabilityAnalysis, setProbabilityAnalysis] = useState<ProbabilityAnalysis | null>(null);

  // Use React Query for fetching athletes with automatic caching
  const { 
    data: athletes = [], 
    isLoading,
    error: athletesError
  } = useQuery({
    queryKey: ['athletes'],
    queryFn: simulationApi.getAthletes,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    // Use meta instead of direct onError property
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching athletes:', err);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данных спортсменов. Пожалуйста, попробуйте позже.",
          variant: "destructive"
        });
      }
    }
  });

  // Load probability analysis when session changes
  useEffect(() => {
    if (simulatedSession) {
      const loadProbabilityAnalysis = async () => {
        setIsAnalysisLoading(true);
        setError(null);
        try {
          const analysis = await simulationApi.getProbabilityAnalysis(
            simulatedSession.athleteId,
            simulatedSession.distance,
            simulatedSession.time
          );
          
          if (analysis) {
            setProbabilityAnalysis(analysis);
          } else {
            setError("Не удалось получить анализ вероятностей для выбранного спортсмена");
          }
        } catch (error) {
          console.error('Error loading probability analysis:', error);
          setError("Ошибка при загрузке анализа вероятностей");
          toast({
            title: "Ошибка анализа",
            description: "Не удалось загрузить данные анализа вероятностей",
            variant: "destructive"
          });
        } finally {
          setIsAnalysisLoading(false);
        }
      };

      loadProbabilityAnalysis();
    }
  }, [simulatedSession]);

  const handleSimulate = (session: RunSession) => {
    try {
      setSimulatedSession(session);
      setError(null);
      toast({
        title: "Симуляция завершена",
        description: `Симуляция забега на ${session.distance}м создана`,
      });
    } catch (error) {
      console.error("Error handling simulation:", error);
      toast({
        title: "Ошибка симуляции",
        description: "Не удалось создать симуляцию забега",
        variant: "destructive"
      });
    }
  };

  const renderErrorState = (message: string) => (
    <Card className="w-full">
      <CardContent className="flex items-center p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Симуляция забега</h1>
          <p className="text-muted-foreground mt-1">
            Смоделируйте забег и проанализируйте вероятность достижения результата
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            {isLoading ? (
              <Card className="w-full">
                <CardContent className="flex items-center justify-center h-64 p-6">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Загрузка данных...</p>
                  </div>
                </CardContent>
              </Card>
            ) : athletesError ? (
              renderErrorState("Не удалось загрузить список спортсменов. Пожалуйста, попробуйте позже.")
            ) : (
              <RunSimulator 
                athletes={athletes}
                onSimulate={handleSimulate}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            {simulatedSession ? (
              <Tabs defaultValue="results" className="h-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="results">Результаты</TabsTrigger>
                  <TabsTrigger value="analysis">Анализ вероятностей</TabsTrigger>
                </TabsList>
                
                <TabsContent value="results" className="m-0 space-y-4">
                  <SplitTimesChart session={simulatedSession} />
                  <SessionDetail session={simulatedSession} />
                </TabsContent>
                
                <TabsContent value="analysis" className="m-0">
                  {isAnalysisLoading ? (
                    <Card className="w-full h-[350px]">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Анализ данных...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : error ? (
                    renderErrorState(error)
                  ) : probabilityAnalysis ? (
                    <ProbabilityChart analysis={probabilityAnalysis} />
                  ) : (
                    <Card className="w-full h-[350px]">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          Нет данных для анализа вероятностей
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Результаты симуляции</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    Запустите симуляцию забега, чтобы увидеть результаты
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Simulation;
