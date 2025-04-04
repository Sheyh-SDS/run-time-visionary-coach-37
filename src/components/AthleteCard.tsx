
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      className="hover:shadow-md transition-all cursor-pointer animate-fade-in border-l-4 border-l-primary"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border-2 border-primary/10">
            <AvatarImage src={athlete.imageUrl} alt={athlete.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-lg">{athlete.name}</div>
            <div className="text-sm text-muted-foreground flex items-center space-x-2">
              <span>{athlete.age} лет</span>
              <span>•</span>
              <span>{athlete.gender === 'male' ? 'Муж' : athlete.gender === 'female' ? 'Жен' : 'Др'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Специализация:</div>
          <div className="flex flex-wrap gap-1">
            {athlete.specialization.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
          {Object.entries(athlete.personalBests)
            .slice(0, 4)
            .map(([event, time]) => (
              <div key={event} className="flex justify-between">
                <span className="text-muted-foreground">{event}:</span>
                <span className="font-medium text-primary">{time}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteCard;
