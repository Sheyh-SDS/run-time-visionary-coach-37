
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Athlete, RunSession, SimulationSettings } from '@/types';
import { formatTime } from '@/data/mockData';
import { simulationApi } from '@/services/simulationApi';
import { Loader2 } from 'lucide-react';

interface RunSimulatorProps {
  athletes: Athlete[];
  onSimulate: (session: RunSession) => void;
}

const RunSimulator: React.FC<RunSimulatorProps> = ({ athletes, onSimulate }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [settings, setSettings] = useState<SimulationSettings>({
    distance: 800,
    basePace: 4.0, // minutes per km
    variability: 0.05, // 5%
    fatigueRate: 0.1, // 10% fatigue effect
    weatherConditions: 'good',
    terrainType: 'track',
    competitionFactor: 0.5, // 50% competition impact
    // New settings for performance parameters
    reactionTime: 0.2, // in seconds
    acceleration: 3.0, // meters per second squared
    maxSpeed: 8.0, // meters per second
    deceleration: 2.0, // meters per second squared
  });

  const handleSimulate = async () => {
    if (!selectedAthleteId) return;
    
    setIsSimulating(true);
    
    try {
      // Request simulation from the API
      const simulatedSession = await simulationApi.requestSimulation(
        selectedAthleteId,
        settings
      );
      
      // Pass the session to the parent component
      onSimulate(simulatedSession);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Get selected athlete data for displaying current values
  const selectedAthlete = athletes.find(athlete => athlete.id === selectedAthleteId);

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
          
          {/* New performance parameters */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Характеристики бегуна</h3>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reactionTime">
                  Время реакции (сек): {settings.reactionTime.toFixed(2)}
                  {selectedAthlete?.reactionTime && 
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Текущее: {selectedAthlete.reactionTime.toFixed(2)})
                    </span>
                  }
                </Label>
                <Slider
                  id="reactionTime"
                  min={0.1}
                  max={0.5}
                  step={0.01}
                  value={[settings.reactionTime]}
                  onValueChange={([value]) => 
                    setSettings({...settings, reactionTime: value})
                  }
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="acceleration">
                  Ускорение (м/с²): {settings.acceleration.toFixed(1)}
                  {selectedAthlete?.acceleration && 
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Текущее: {selectedAthlete.acceleration.toFixed(1)})
                    </span>
                  }
                </Label>
                <Slider
                  id="acceleration"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  value={[settings.acceleration]}
                  onValueChange={([value]) => 
                    setSettings({...settings, acceleration: value})
                  }
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="maxSpeed">
                  Максимальная скорость (м/с): {settings.maxSpeed.toFixed(1)}
                  {selectedAthlete?.maxSpeed && 
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Текущее: {selectedAthlete.maxSpeed.toFixed(1)})
                    </span>
                  }
                </Label>
                <Slider
                  id="maxSpeed"
                  min={5.0}
                  max={12.0}
                  step={0.1}
                  value={[settings.maxSpeed]}
                  onValueChange={([value]) => 
                    setSettings({...settings, maxSpeed: value})
                  }
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deceleration">
                  Замедление (м/с²): {settings.deceleration.toFixed(1)}
                  {selectedAthlete?.deceleration && 
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Текущее: {selectedAthlete.deceleration.toFixed(1)})
                    </span>
                  }
                </Label>
                <Slider
                  id="deceleration"
                  min={1.0}
                  max={4.0}
                  step={0.1}
                  value={[settings.deceleration]}
                  onValueChange={([value]) => 
                    setSettings({...settings, deceleration: value})
                  }
                />
              </div>
            </div>
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
            disabled={!selectedAthleteId || isSimulating}
            className="mt-2"
          >
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Симуляция...
              </>
            ) : (
              "Запустить симуляцию"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RunSimulator;
