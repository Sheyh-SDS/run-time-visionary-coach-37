
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RunSession } from '@/types';
import { formatTime } from '@/data/mockData';

interface SessionListProps {
  sessions: RunSession[];
  onSelectSession: (session: RunSession) => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onSelectSession }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список забегов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Дистанция</TableHead>
                <TableHead>Время</TableHead>
                <TableHead>Тип</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(session => (
                <TableRow 
                  key={session.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectSession(session)}
                >
                  <TableCell className="font-medium">
                    {new Date(session.date).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{session.distance}м</TableCell>
                  <TableCell>{formatTime(session.time)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      session.type === 'race' ? 'default' : 
                      session.type === 'training' ? 'secondary' : 'outline'
                    }>
                      {session.type === 'race' ? 'Соревн.' : 
                       session.type === 'training' ? 'Трен.' : 'Симул.'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Забеги не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionList;
