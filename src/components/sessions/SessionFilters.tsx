
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Athlete } from '@/types';

interface SessionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  athleteFilter: string;
  setAthleteFilter: (id: string) => void;
  athletes: Athlete[];
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  athleteFilter,
  setAthleteFilter,
  athletes
}) => {
  return (
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
              {athletes.map(athlete => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionFilters;
