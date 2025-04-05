
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Athlete } from '@/types';

interface AthleteStatsCardProps {
  athlete: Athlete;
}

const AthleteStatsCard: React.FC<AthleteStatsCardProps> = ({ athlete }) => {
  if (!athlete) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Нет данных о спортсмене
        </CardContent>
      </Card>
    );
  }

  // Format personal bests
  const formatPersonalBests = () => {
    return Object.entries(athlete.personalBests).map(([distance, time]) => (
      <div key={distance} className="grid grid-cols-2 gap-2 py-1 border-b border-gray-100">
        <span className="text-muted-foreground">{distance}</span>
        <span className="font-mono">{time}</span>
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: athlete.jerseyColor || '#cccccc' }}
              >
                {athlete.number || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold">{athlete.name}</h3>
                <p className="text-muted-foreground">
                  {athlete.age} лет, {athlete.gender === 'male' ? 'муж' : athlete.gender === 'female' ? 'жен' : 'др'}
                </p>
              </div>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Специализация</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {athlete.specialization.map(spec => (
                <span 
                  key={spec}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                >
                  {spec}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3">Характеристики</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Время реакции</span>
                <span className="font-mono">{athlete.reactionTime?.toFixed(3) || 'N/A'} сек</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Ускорение</span>
                <span className="font-mono">{athlete.acceleration?.toFixed(1) || 'N/A'} м/с²</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Макс. скорость</span>
                <span className="font-mono">{athlete.maxSpeed?.toFixed(1) || 'N/A'} м/с</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Замедление</span>
                <span className="font-mono">{athlete.deceleration?.toFixed(2) || 'N/A'} м/с²</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-3">Личные рекорды</h4>
            <div className="space-y-1">
              {formatPersonalBests()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AthleteStatsCard;
