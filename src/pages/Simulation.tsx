
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RunSimulator from '@/components/RunSimulator';
import SplitTimesChart from '@/components/SplitTimesChart';
import ProbabilityChart from '@/components/ProbabilityChart';
import SessionDetail from '@/components/SessionDetail';
import { RunSession, Athlete, ProbabilityAnalysis } from '@/types';
import { simulationApi } from '@/services/simulationApi';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Simulation = () => {
  const [simulatedSession, setSimulatedSession] = useState<RunSession | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [probabilityAnalysis, setProbabilityAnalysis] = useState<ProbabilityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // Load athletes on mount
  useEffect(() => {
    const loadAthletes = async () => {
      try {
        const loadedAthletes = await simulationApi.getAthletes();
        setAthletes(loadedAthletes);
      } catch (error) {
        console.error('Error loading athletes:', error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные спортсменов.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAthletes();
  }, []);

  // Load probability analysis when session changes
  useEffect(() => {
    if (simulatedSession) {
      const loadProbabilityAnalysis = async () => {
        setIsAnalysisLoading(true);
        try {
          const analysis = await simulationApi.getProbabilityAnalysis(
            simulatedSession.athleteId,
            simulatedSession.distance,
            simulatedSession.time
          );
          
          if (analysis) {
            setProbabilityAnalysis(analysis);
          }
        } catch (error) {
          console.error('Error loading probability analysis:', error);
        } finally {
          setIsAnalysisLoading(false);
        }
      };

      loadProbabilityAnalysis();
    }
  }, [simulatedSession]);

  const handleSimulate = (session: RunSession) => {
    setSimulatedSession(session);
    toast({
      title: "Симуляция завершена",
      description: `Симуляция забега на ${session.distance}м создана`,
    });
  };

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
