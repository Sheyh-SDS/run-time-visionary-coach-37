
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell 
} from 'recharts';
import { mockAthletes, mockRunSessions, mockPerformanceMetrics, formatTime } from '@/data/mockData';
import { RunSession } from '@/types';

const Statistics = () => {
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [timeframe, setTimeframe] = useState('all');

  // Filter sessions based on athlete and timeframe
  const getFilteredSessions = () => {
    let sessions = [...mockRunSessions];
    
    if (selectedAthlete !== 'all') {
      sessions = sessions.filter(session => session.athleteId === selectedAthlete);
    }
    
    if (timeframe !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeframe === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === 'year') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }
      
      sessions = sessions.filter(session => new Date(session.date) >= cutoffDate);
    }
    
    return sessions;
  };

  const filteredSessions = getFilteredSessions();

  // Prepare performance data
  const preparePerformanceData = () => {
    const sessionsByDistance = {};
    
    filteredSessions.forEach(session => {
      if (!sessionsByDistance[session.distance]) {
        sessionsByDistance[session.distance] = [];
      }
      sessionsByDistance[session.distance].push(session);
    });
    
    return Object.entries(sessionsByDistance).map(([distance, sessions]) => {
      const sessionsArray = sessions as RunSession[];
      const avgTime = sessionsArray.reduce((sum, s) => sum + s.time, 0) / sessionsArray.length;
      const bestTime = Math.min(...sessionsArray.map(s => s.time));
      
      return {
        distance: `${distance}м`,
        count: sessionsArray.length,
        avgTime,
        bestTime,
        displayAvgTime: formatTime(avgTime),
        displayBestTime: formatTime(bestTime)
      };
    });
  };

  // Prepare training types data
  const prepareTrainingTypesData = () => {
    const typeCount = { race: 0, training: 0, simulation: 0 };
    
    filteredSessions.forEach(session => {
      typeCount[session.type]++;
    });
    
    return [
      { name: 'Соревнования', value: typeCount.race, color: '#2563eb' },
      { name: 'Тренировки', value: typeCount.training, color: '#16a34a' },
      { name: 'Симуляции', value: typeCount.simulation, color: '#ca8a04' }
    ];
  };

  // Prepare location data
  const prepareLocationData = () => {
    const locationCount = {};
    
    filteredSessions.forEach(session => {
      if (session.location) {
        if (!locationCount[session.location]) {
          locationCount[session.location] = 0;
        }
        locationCount[session.location]++;
      }
    });
    
    return Object.entries(locationCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5); // Top 5 locations
  };

  const performanceData = preparePerformanceData();
  const trainingTypesData = prepareTrainingTypesData();
  const locationData = prepareLocationData();

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Статистика и аналитика</h1>
          <p className="text-muted-foreground mt-1">
            Подробный статистический анализ результатов и тренировок
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Настройки анализа</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <Select
                value={selectedAthlete}
                onValueChange={setSelectedAthlete}
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
            <div className="w-full sm:w-1/2">
              <Select
                value={timeframe}
                onValueChange={setTimeframe}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="week">Последняя неделя</SelectItem>
                  <SelectItem value="month">Последний месяц</SelectItem>
                  <SelectItem value="year">Последний год</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="performance">Результаты</TabsTrigger>
            <TabsTrigger value="distribution">Распределение</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="w-full h-[350px]">
                <CardHeader>
                  <CardTitle>Типы тренировок</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trainingTypesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {trainingTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} забегов`, 'Количество']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="w-full h-[350px]">
                <CardHeader>
                  <CardTitle>Популярные локации</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={locationData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="location" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => [`${value} забегов`, 'Количество']} />
                      <Bar dataKey="count" name="Количество забегов" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="m-0">
            <Card className="w-full h-[400px]">
              <CardHeader>
                <CardTitle>Сравнение результатов по дистанциям</CardTitle>
              </CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" />
                    <YAxis 
                      tickFormatter={(value) => formatTime(value)}
                      label={{ value: 'Время', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "Среднее время" || name === "Лучшее время") {
                          return formatTime(Number(value));
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgTime" name="Среднее время" fill="#3b82f6" />
                    <Bar dataKey="bestTime" name="Лучшее время" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="w-full h-[350px]">
                <CardHeader>
                  <CardTitle>Распределение по дистанциям</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        dataKey="count"
                        nameKey="distance"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.distance}: ${entry.count}`}
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 30 + 200}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} забегов`, 'Количество']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {selectedAthlete !== 'all' && mockPerformanceMetrics[selectedAthlete] && (
                <Card className="w-full h-[350px]">
                  <CardHeader>
                    <CardTitle>Метрики производительности</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius={80} data={[
                        { metric: 'Темп', value: mockPerformanceMetrics[selectedAthlete].recentAvgPace * 10 },
                        { metric: 'Выносливость', value: mockPerformanceMetrics[selectedAthlete].enduranceScore * 100 },
                        { metric: 'Восстановление', value: mockPerformanceMetrics[selectedAthlete].recoveryRate * 100 },
                        { metric: 'Улучшение', value: mockPerformanceMetrics[selectedAthlete].improvementRate * 100 },
                        { metric: 'Стабильность', value: mockPerformanceMetrics[selectedAthlete].consistencyScore * 100 }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Показатели" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Statistics;
