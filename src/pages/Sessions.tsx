
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SessionDetail from '@/components/SessionDetail';
import SplitTimesChart from '@/components/SplitTimesChart';
import { RunSession } from '@/types';
import { mockAthletes, mockRunSessions, formatTime } from '@/data/mockData';

const Sessions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [athleteFilter, setAthleteFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null);

  // Filter sessions based on search and athlete filter
  const filteredSessions = mockRunSessions.filter(session => {
    const matchesSearch = 
      session.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.distance.toString().includes(searchTerm) ||
      formatTime(session.time).includes(searchTerm);
      
    const matchesAthlete = athleteFilter === 'all' || session.athleteId === athleteFilter;
    
    return matchesSearch && matchesAthlete;
  });

  // Get athlete name by ID
  const getAthleteName = (athleteId: string) => {
    const athlete = mockAthletes.find(a => a.id === athleteId);
    return athlete ? athlete.name : 'Неизвестный спортсмен';
  };

  // Sort sessions by date (newest first)
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Тренировки и забеги</h1>
          <p className="text-muted-foreground mt-1">
            Управление и анализ всех забегов и тренировок
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Фильтры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input 
                    placeholder="Поиск по дистанции, локации, времени..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    value={athleteFilter}
                    onValueChange={setAthleteFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите спортсмена" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все спортсмены</SelectItem>
                      {mockAthletes.map(athlete => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Список забегов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Дистанция</TableHead>
                        <TableHead>Время</TableHead>
                        <TableHead>Тип</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSessions.map(session => (
                        <TableRow 
                          key={session.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedSession(session)}
                        >
                          <TableCell className="font-medium">
                            {new Date(session.date).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>{session.distance}м</TableCell>
                          <TableCell>{formatTime(session.time)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              session.type === 'race' ? 'default' : 
                              session.type === 'training' ? 'secondary' : 'outline'
                            }>
                              {session.type === 'race' ? 'Соревн.' : 
                               session.type === 'training' ? 'Трен.' : 'Симул.'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            Забеги не найдены
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedSession ? (
              <Tabs defaultValue="details" className="h-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="details">Детали забега</TabsTrigger>
                  <TabsTrigger value="splits">Анализ сплитов</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="m-0">
                  <SessionDetail session={selectedSession} />
                </TabsContent>
                
                <TabsContent value="splits" className="m-0">
                  <SplitTimesChart session={selectedSession} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    Выберите забег из списка для просмотра деталей
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

export default Sessions;
