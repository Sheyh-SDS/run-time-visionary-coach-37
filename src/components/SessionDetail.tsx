
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Thermometer, Wind } from 'lucide-react';
import { RunSession } from '@/types';
import { formatTime } from '@/data/mockData';

interface SessionDetailProps {
  session: RunSession;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Забег {session.distance}м
              <Badge variant="outline" className="ml-2 font-normal">
                {session.type === 'race' ? 'Соревнование' : 
                 session.type === 'training' ? 'Тренировка' : 'Симуляция'}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(session.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {formatTime(session.time)}
            </div>
            <div className="text-sm text-muted-foreground">
              Темп: {formatTime(session.pace * 60)}/км
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Информация о забеге</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Дистанция:</span>
              </div>
              <div className="font-medium">{session.distance}м</div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Время:</span>
              </div>
              <div className="font-medium">{formatTime(session.time)}</div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Средний темп:</span>
              </div>
              <div className="font-medium">{formatTime(session.pace * 60)}/км</div>
              
              {session.heartRate && (
                <>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Пульс сред/макс:</span>
                  </div>
                  <div className="font-medium">
                    {session.heartRate.average} / {session.heartRate.max} уд/мин
                  </div>
                </>
              )}
              
              {session.location && (
                <>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Место:</span>
                  </div>
                  <div className="font-medium">{session.location}</div>
                </>
              )}
            </div>
          </div>
          
          {session.weather && (
            <div>
              <h3 className="text-sm font-medium mb-2">Погодные условия</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Температура:</span>
                </div>
                <div className="font-medium">{session.weather.temperature}°C</div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Условия:</span>
                </div>
                <div className="font-medium">{session.weather.conditions}</div>
                
                {session.weather.humidity && (
                  <>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Влажность:</span>
                    </div>
                    <div className="font-medium">{session.weather.humidity}%</div>
                  </>
                )}
                
                {session.weather.windSpeed && (
                  <>
                    <div className="flex items-center">
                      <Wind className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Ветер:</span>
                    </div>
                    <div className="font-medium">{session.weather.windSpeed} м/с</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {session.notes && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-medium mb-2">Заметки</h3>
              <div className="text-sm">{session.notes}</div>
            </div>
          </>
        )}
        
        <Separator className="my-4" />
        <div>
          <h3 className="text-sm font-medium mb-2">Сплиты</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {session.splits.map((split, index) => (
              <div key={index} className="bg-secondary p-2 rounded-md text-center">
                <div className="text-xs text-muted-foreground">Сплит {index + 1}</div>
                <div className="font-medium">{formatTime(split)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDetail;
