
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RunSimulator from '@/components/RunSimulator';
import SplitTimesChart from '@/components/SplitTimesChart';
import ProbabilityChart from '@/components/ProbabilityChart';
import SessionDetail from '@/components/SessionDetail';
import { RunSession } from '@/types';
import { mockAthletes, mockProbabilityAnalysis, calculateProbability } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const Simulation = () => {
  const [simulatedSession, setSimulatedSession] = useState<RunSession | null>(null);

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
            <RunSimulator 
              athletes={mockAthletes}
              onSimulate={handleSimulate}
            />
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
                  {simulatedSession && (
                    <ProbabilityChart 
                      analysis={
                        mockProbabilityAnalysis[simulatedSession.athleteId] || 
                        calculateProbability(
                          mockAthletes.find(a => a.id === simulatedSession.athleteId)!,
                          simulatedSession.distance,
                          simulatedSession.time,
                          [simulatedSession]
                        )
                      }
                    />
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
