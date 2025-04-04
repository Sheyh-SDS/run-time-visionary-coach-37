
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import AthleteList from '@/components/AthleteList';
import PerformanceChart from '@/components/PerformanceChart';
import ProbabilityChart from '@/components/ProbabilityChart';
import { Athlete } from '@/types';
import { mockAthletes, mockRunSessions, mockProbabilityAnalysis } from '@/data/mockData';

const Athletes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Filter athletes based on search term
  const filteredAthletes = mockAthletes.filter(athlete => 
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get athlete's sessions
  const getAthleteSessions = (athleteId: string) => {
    return mockRunSessions.filter(session => session.athleteId === athleteId);
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Спортсмены</h1>
          <p className="text-muted-foreground mt-1">
            Управление профилями спортсменов и анализ результатов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Поиск спортсменов</CardTitle>
              </CardHeader>
              <CardContent>
                <Input 
                  placeholder="Поиск по имени или специализации..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Список спортсменов</CardTitle>
              </CardHeader>
              <CardContent>
                <AthleteList
                  athletes={filteredAthletes}
                  onSelectAthlete={setSelectedAthlete}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedAthlete ? (
              <Tabs defaultValue="info" className="h-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="info">Информация</TabsTrigger>
                  <TabsTrigger value="performance">Результаты</TabsTrigger>
                  <TabsTrigger value="analysis">Анализ</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Профиль: {selectedAthlete.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Личная информация</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-muted-foreground">Возраст:</div>
                            <div>{selectedAthlete.age} лет</div>
                            
                            <div className="text-muted-foreground">Пол:</div>
                            <div>{selectedAthlete.gender === 'male' ? 'Мужской' : 
                                  selectedAthlete.gender === 'female' ? 'Женский' : 'Другой'}</div>
                            
                            <div className="text-muted-foreground">Специализация:</div>
                            <div>{selectedAthlete.specialization.join(', ')}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Личные рекорды</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedAthlete.personalBests).map(([event, time]) => (
                              <React.Fragment key={event}>
                                <div className="text-muted-foreground">{event}:</div>
                                <div className="font-medium text-primary">{time}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
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
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    Выберите спортсмена для просмотра подробной информации
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

export default Athletes;
