
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Athlete, RunSession, SimulationSettings } from '@/types';
import { generateRunningSession, formatTime } from '@/data/mockData';

interface RunSimulatorProps {
  athletes: Athlete[];
  onSimulate: (session: RunSession) => void;
}

const RunSimulator: React.FC<RunSimulatorProps> = ({ athletes, onSimulate }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [settings, setSettings] = useState<SimulationSettings>({
    distance: 800,
    basePace: 4.0, // minutes per km
    variability: 0.05, // 5%
    fatigueRate: 0.1, // 10% fatigue effect
    weatherConditions: 'good',
    terrainType: 'track',
    competitionFactor: 0.5 // 50% competition impact
  });

  const handleSimulate = () => {
    if (!selectedAthleteId) return;
    
    // Convert pace from minutes per km to total time in seconds for the distance
    const paceInSecondsPerMeter = (settings.basePace * 60) / 1000;
    const baseTimeForDistance = paceInSecondsPerMeter * settings.distance;
    
    // Apply terrain and weather factors
    let adjustedTime = baseTimeForDistance;
    
    // Terrain factors
    if (settings.terrainType === 'road') adjustedTime *= 1.02;
    else if (settings.terrainType === 'trail') adjustedTime *= 1.1;
    else if (settings.terrainType === 'hills') adjustedTime *= 1.15;
    
    // Weather factors
    if (settings.weatherConditions === 'moderate') adjustedTime *= 1.03;
    else if (settings.weatherConditions === 'challenging') adjustedTime *= 1.08;
    else if (settings.weatherConditions === 'extreme') adjustedTime *= 1.15;
    else if (settings.weatherConditions === 'ideal') adjustedTime *= 0.98;
    
    // Competition factor - can improve time
    adjustedTime *= (1 - (settings.competitionFactor * 0.05));
    
    // Generate the running session
    const simulatedSession = generateRunningSession(
      selectedAthleteId,
      settings.distance,
      adjustedTime,
      settings.variability
    );
    
    onSimulate(simulatedSession);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Симулятор забега</CardTitle>
        <CardDescription>
          Настройте параметры для моделирования забега
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="athlete">Спортсмен</Label>
            <Select
              value={selectedAthleteId}
              onValueChange={setSelectedAthleteId}
            >
              <SelectTrigger id="athlete">
                <SelectValue placeholder="Выберите спортсмена" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(athlete => (
                  <SelectItem key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="distance">Дистанция (метры)</Label>
            <Select
              value={settings.distance.toString()}
              onValueChange={(value) => 
                setSettings({...settings, distance: parseInt(value)})
              }
            >
              <SelectTrigger id="distance">
                <SelectValue placeholder="Выберите дистанцию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100м</SelectItem>
                <SelectItem value="200">200м</SelectItem>
                <SelectItem value="400">400м</SelectItem>
                <SelectItem value="800">800м</SelectItem>
                <SelectItem value="1500">1500м</SelectItem>
                <SelectItem value="3000">3000м</SelectItem>
                <SelectItem value="5000">5000м</SelectItem>
                <SelectItem value="10000">10000м</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pace">
              Базовый темп (мин/км): {settings.basePace.toFixed(1)}
            </Label>
            <Slider
              id="pace"
              min={2.5}
              max={8.0}
              step={0.1}
              value={[settings.basePace]}
              onValueChange={([value]) => 
                setSettings({...settings, basePace: value})
              }
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="variability">
              Вариативность темпа: {Math.round(settings.variability * 100)}%
            </Label>
            <Slider
              id="variability"
              min={0.01}
              max={0.2}
              step={0.01}
              value={[settings.variability]}
              onValueChange={([value]) => 
                setSettings({...settings, variability: value})
              }
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="weather">Погодные условия</Label>
            <Select
              value={settings.weatherConditions}
              onValueChange={(value: any) => 
                setSettings({...settings, weatherConditions: value})
              }
            >
              <SelectTrigger id="weather">
                <SelectValue placeholder="Выберите условия" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ideal">Идеальные</SelectItem>
                <SelectItem value="good">Хорошие</SelectItem>
                <SelectItem value="moderate">Средние</SelectItem>
                <SelectItem value="challenging">Сложные</SelectItem>
                <SelectItem value="extreme">Экстремальные</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="terrain">Тип покрытия</Label>
            <Select
              value={settings.terrainType}
              onValueChange={(value: any) => 
                setSettings({...settings, terrainType: value})
              }
            >
              <SelectTrigger id="terrain">
                <SelectValue placeholder="Выберите покрытие" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="track">Беговая дорожка</SelectItem>
                <SelectItem value="road">Асфальт</SelectItem>
                <SelectItem value="trail">Грунтовая трасса</SelectItem>
                <SelectItem value="hills">Холмистая местность</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="competition">
              Фактор соревнования: {Math.round(settings.competitionFactor * 100)}%
            </Label>
            <Slider
              id="competition"
              min={0}
              max={1}
              step={0.05}
              value={[settings.competitionFactor]}
              onValueChange={([value]) => 
                setSettings({...settings, competitionFactor: value})
              }
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Ожидаемое время на {settings.distance}м</Label>
            <div className="p-2 bg-secondary rounded-md flex items-center justify-center">
              <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                {formatTime((settings.basePace * 60 * settings.distance) / 1000)}
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={handleSimulate}
            disabled={!selectedAthleteId}
            className="mt-2"
          >
            Запустить симуляцию
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RunSimulator;
