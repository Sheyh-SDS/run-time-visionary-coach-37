
import React from 'react';
import AthleteCard from './AthleteCard';
import { Athlete } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search } from 'lucide-react';

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

const AthleteList: React.FC<AthleteListProps> = ({ athletes, onSelectAthlete }) => {
  const isMobile = useIsMobile();
  const scrollHeight = isMobile ? "h-[60vh]" : "h-[500px]";

  if (athletes.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg animate-fade-in bg-muted/30 backdrop-blur-sm">
        <p className="text-muted-foreground">Нет спортсменов для отображения</p>
      </div>
    );
  }

  return (
    <div className="transition-all duration-300 ease-in-out">
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder="Поиск спортсменов..." 
          className="w-full pl-10 pr-4 py-2 rounded-md border bg-background border-input transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary focus-visible:outline-none"
        />
      </div>
      
      <ScrollArea className={`${scrollHeight} pr-4 overflow-hidden`}>
        <div className="space-y-3">
          {athletes.map((athlete, index) => (
            <div 
              key={athlete.id} 
              className="transition-all duration-300 ease-in-out"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                opacity: 0,
                animation: 'fade-in 0.5s ease-out forwards'
              }}
            >
              <AthleteCard
                athlete={athlete}
                onClick={onSelectAthlete}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <Badge variant="outline" className="mr-1 bg-primary/10 hover:bg-primary/20 transition-colors duration-200">
            {athletes.length}
          </Badge>
          спортсменов
        </div>
      </ScrollArea>
    </div>
  );
};

export default AthleteList;
