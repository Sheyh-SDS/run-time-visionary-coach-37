
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import SessionDetail from '@/components/SessionDetail';
import SplitTimesChart from '@/components/SplitTimesChart';
import PerformanceParamsChart from '@/components/PerformanceParamsChart';
import { RunSession, Athlete } from '@/types';

interface SessionTabsProps {
  selectedSession: RunSession | null;
  selectedAthlete: Athlete | null;
  performanceHistoryData: any[];
}

const SessionTabs: React.FC<SessionTabsProps> = ({ 
  selectedSession, 
  selectedAthlete,
  performanceHistoryData
}) => {
  return (
    <Tabs defaultValue={selectedSession ? "details" : "performance"} className="h-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="details" disabled={!selectedSession}>
          Детали забега
        </TabsTrigger>
        <TabsTrigger value="splits" disabled={!selectedSession}>
          Анализ сплитов
        </TabsTrigger>
        <TabsTrigger value="performance">Характеристики</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="m-0">
        {selectedSession ? (
          <SessionDetail 
            session={selectedSession} 
            athlete={selectedAthlete}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                Выберите забег из списка для просмотра деталей
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="splits" className="m-0">
        {selectedSession ? (
          <SplitTimesChart session={selectedSession} />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                Выберите забег из списка для просмотра анализа сплитов
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="performance" className="m-0">
        {selectedAthlete ? (
          <PerformanceParamsChart 
            data={performanceHistoryData} 
            athlete={selectedAthlete}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                Выберите спортсмена для просмотра динамики характеристик
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default SessionTabs;
