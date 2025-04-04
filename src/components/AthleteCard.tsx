
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Athlete } from '@/types';

interface AthleteCardProps {
  athlete: Athlete;
  onClick?: (athlete: Athlete) => void;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, onClick }) => {
  const initials = athlete.name
    .split(' ')
    .map(n => n[0])
    .join('');

  const handleClick = () => {
    if (onClick) onClick(athlete);
  };

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer animate-fade-in"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={athlete.imageUrl} alt={athlete.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{athlete.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {athlete.age} лет, {athlete.gender === 'male' ? 'муж' : athlete.gender === 'female' ? 'жен' : 'др'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="text-sm font-medium mb-1">Специализация:</div>
          <div className="flex flex-wrap gap-1">
            {athlete.specialization.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Лучшие результаты:</div>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {Object.entries(athlete.personalBests)
              .slice(0, 4)
              .map(([event, time]) => (
                <div key={event} className="flex justify-between">
                  <span>{event}:</span>
                  <span className="font-medium text-primary">{time}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteCard;
