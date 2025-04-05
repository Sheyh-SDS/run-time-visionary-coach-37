
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { RaceResult } from '@/types';
import { formatTime } from '@/data/mockData';

interface RaceResultsTableProps {
  results: RaceResult[] | null;
  onShowAthleteStats?: (athleteId: string) => void;
}

const RaceResultsTable: React.FC<RaceResultsTableProps> = ({ 
  results,
  onShowAthleteStats 
}) => {
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты забега</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Нет данных о результатах забега. Запустите симуляцию для получения результатов.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out any results with null time or 0 time (didn't participate)
  const participantsResults = results.filter(result => result.time > 0);

  if (participantsResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты забега</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            В забеге не было участников с зарегистрированным временем.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Результаты забега</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Место</TableHead>
              <TableHead className="w-14">Номер</TableHead>
              <TableHead>Спортсмен</TableHead>
              <TableHead className="text-right">Время</TableHead>
              <TableHead className="text-right">Разница</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participantsResults.map((result) => (
              <TableRow key={result.athleteId}>
                <TableCell className="font-medium">{result.position}</TableCell>
                <TableCell>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: result.jerseyColor }}
                  >
                    {result.number}
                  </div>
                </TableCell>
                <TableCell>{result.athleteName}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatTime(result.time)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {result.difference === 0 ? '--' : `+${result.difference.toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {onShowAthleteStats && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShowAthleteStats(result.athleteId)}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RaceResultsTable;
