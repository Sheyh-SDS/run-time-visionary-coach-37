
import React from 'react';
import AthleteCard from './AthleteCard';
import { Athlete } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

const AthleteList: React.FC<AthleteListProps> = ({ athletes, onSelectAthlete }) => {
  if (athletes.length === 0) {
    return (
      <div className="text-center p-4 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Нет спортсменов для отображения</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-3">
        {athletes.map((athlete) => (
          <AthleteCard
            key={athlete.id}
            athlete={athlete}
            onClick={onSelectAthlete}
          />
        ))}
      </div>
      <div className="mt-3 text-sm text-muted-foreground text-center">
        <Badge variant="outline" className="mr-1">
          {athletes.length}
        </Badge>
        спортсменов
      </div>
    </ScrollArea>
  );
};

export default AthleteList;
