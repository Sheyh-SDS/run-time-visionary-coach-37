
import React from 'react';
import AthleteCard from './AthleteCard';
import { Athlete } from '@/types';

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

const AthleteList: React.FC<AthleteListProps> = ({ athletes, onSelectAthlete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {athletes.map((athlete) => (
        <AthleteCard
          key={athlete.id}
          athlete={athlete}
          onClick={onSelectAthlete}
        />
      ))}
    </div>
  );
};

export default AthleteList;
