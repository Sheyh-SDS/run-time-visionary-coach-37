
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AthleteList from '@/components/AthleteList';
import PerformanceChart from '@/components/PerformanceChart';
import SplitTimesChart from '@/components/SplitTimesChart';
import ProbabilityChart from '@/components/ProbabilityChart';
import SessionDetail from '@/components/SessionDetail';
import { Athlete, RunSession } from '@/types';
import { mockAthletes, mockRunSessions, mockProbabilityAnalysis, formatTime } from '@/data/mockData';

const Index = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null);

  // Get athlete's sessions
  const getAthleteSessions = (athleteId: string): RunSession[] => {
    return mockRunSessions.filter(session => session.athleteId === athleteId);
  };

  // Handle athlete selection
  const handleSelectAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    const sessions = getAthleteSessions(athlete.id);
    if (sessions.length > 0) {
      setSelectedSession(sessions[0]);
    } else {
      setSelectedSession(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Дашборд тренера</h1>
            <p className="text-muted-foreground mt-1">
              Обзор результатов и аналитика выступлений спортсменов
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="stat-card col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Спортсмены</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{mockAthletes.length}</div>
              <div className="stat-label">активных атлетов</div>
            </CardContent>
          </Card>
          <Card className="stat-card col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Тренировки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{mockRunSessions.length}</div>
              <div className="stat-label">за последний месяц</div>
            </CardContent>
          </Card>
          <Card className="stat-card col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Лучший результат</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">1:45.8</div>
              <div className="stat-label">800м (Алексей Петров)</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Спортсмены</CardTitle>
                <CardDescription>
                  Выберите спортсмена для просмотра результатов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AthleteList
                  athletes={mockAthletes}
                  onSelectAthlete={handleSelectAthlete}
                />
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 md:col-span-2">
            {selectedAthlete ? (
              <Tabs defaultValue="performance" className="h-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="performance">Результаты</TabsTrigger>
                  <TabsTrigger value="session">Забег</TabsTrigger>
                  <TabsTrigger value="analysis">Анализ</TabsTrigger>
                </TabsList>
                
                <TabsContent value="performance" className="m-0">
                  {getAthleteSessions(selectedAthlete.id).length > 0 ? (
                    <PerformanceChart 
                      sessions={getAthleteSessions(selectedAthlete.id)}
                      title={`Динамика результатов: ${selectedAthlete.name}`}
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                          Нет данных о забегах для этого спортсмена
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="session" className="m-0">
                  {selectedSession ? (
                    <SplitTimesChart session={selectedSession} />
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                          Выберите забег для просмотра деталей
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="analysis" className="m-0">
                  {mockProbabilityAnalysis[selectedAthlete.id] ? (
                    <ProbabilityChart 
                      analysis={mockProbabilityAnalysis[selectedAthlete.id]} 
                    />
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
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
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    Выберите спортсмена для просмотра данных
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {selectedSession && (
          <SessionDetail session={selectedSession} />
        )}
      </div>
    </Layout>
  );
};

export default Index;
