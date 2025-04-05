
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Timer, Zap, Gauge, TrendingDown } from 'lucide-react';
import { Athlete } from '@/types';

interface PerformanceParamsCardProps {
  athlete: Athlete;
}

const PerformanceParamsCard: React.FC<PerformanceParamsCardProps> = ({ athlete }) => {
  // Check if athlete has performance parameters
  const hasPerformanceParams = athlete.reactionTime !== undefined || 
                              athlete.acceleration !== undefined || 
                              athlete.maxSpeed !== undefined || 
                              athlete.deceleration !== undefined;

  if (!hasPerformanceParams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Характеристики спортсмена</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Нет данных о характеристиках для этого спортсмена
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Характеристики спортсмена</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {athlete.reactionTime !== undefined && (
            <div className="flex items-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Время реакции</div>
                <div className="text-2xl font-semibold">{athlete.reactionTime.toFixed(2)} с</div>
              </div>
            </div>
          )}
          
          {athlete.acceleration !== undefined && (
            <div className="flex items-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Ускорение</div>
                <div className="text-2xl font-semibold">{athlete.acceleration.toFixed(1)} м/с²</div>
              </div>
            </div>
          )}
          
          {athlete.maxSpeed !== undefined && (
            <div className="flex items-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Максимальная скорость</div>
                <div className="text-2xl font-semibold">{athlete.maxSpeed.toFixed(1)} м/с</div>
              </div>
            </div>
          )}
          
          {athlete.deceleration !== undefined && (
            <div className="flex items-center p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Замедление</div>
                <div className="text-2xl font-semibold">{athlete.deceleration.toFixed(1)} м/с²</div>
              </div>
            </div>
          )}
        </div>
        
        {(athlete.reactionTime !== undefined && athlete.maxSpeed !== undefined) && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-2">Основные показатели</h3>
              <div className="text-sm">
                <p>Время преодоления первых 10м примерно: {((athlete.reactionTime || 0) + (10 / (athlete.acceleration || 1))).toFixed(2)}с</p>
                <p>Достижение максимальной скорости через: {((athlete.maxSpeed || 10) / (athlete.acceleration || 1)).toFixed(2)}с</p>
                <p>Максимальная скорость в км/ч: {((athlete.maxSpeed || 0) * 3.6).toFixed(1)} км/ч</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceParamsCard;
