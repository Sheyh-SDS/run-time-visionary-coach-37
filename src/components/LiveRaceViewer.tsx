
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { LiveRaceData } from '@/types';
import { formatTime } from '@/data/mockData';

interface LiveRaceViewerProps {
  liveRaceData: LiveRaceData | null;
  onStartRace: () => void;
  isSimulating: boolean;
}

const LiveRaceViewer: React.FC<LiveRaceViewerProps> = ({
  liveRaceData,
  onStartRace,
  isSimulating
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw the race visualization on canvas
  useEffect(() => {
    if (!liveRaceData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Setup dimensions
    const laneHeight = 50;
    const padding = 40;
    const trackLength = canvas.width - (padding * 2);
    const totalRaceDistance = liveRaceData.distance;
    
    // Draw track lanes
    liveRaceData.athletes.forEach((athlete, index) => {
      const y = padding + (index * laneHeight);
      
      // Lane background
      ctx.fillStyle = '#f4f4f5';
      ctx.fillRect(padding, y, trackLength, laneHeight - 10);
      
      // Lane label
      ctx.fillStyle = '#71717a';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${athlete.number}`, padding - 10, y + (laneHeight / 2) + 4);
      
      // Draw athlete position
      const athleteX = padding + (athlete.currentDistance / totalRaceDistance) * trackLength;
      
      // Jersey dot
      ctx.beginPath();
      ctx.arc(athleteX, y + (laneHeight / 2), 12, 0, Math.PI * 2);
      ctx.fillStyle = athlete.jerseyColor;
      ctx.fill();
      
      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${athlete.number}`, athleteX, y + (laneHeight / 2) + 4);
      
      // Name and time
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(athlete.name, padding, y + (laneHeight / 2) - 16);
      
      ctx.fillStyle = '#71717a';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        `${athlete.currentDistance.toFixed(1)}м, ${athlete.currentSpeed.toFixed(1)}м/с`, 
        padding, 
        y + (laneHeight / 2)
      );
    });
    
    // Draw race distance line
    ctx.beginPath();
    ctx.moveTo(padding + trackLength, padding - 20);
    ctx.lineTo(padding + trackLength, padding + (liveRaceData.athletes.length * laneHeight));
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw finish label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Финиш', padding + trackLength, padding - 5);
    
  }, [liveRaceData]);
  
  // If no race data is available, show a prompt to start a race
  if (!liveRaceData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Симуляция забега</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">
            Нет активной симуляции. Запустите забег на вкладке "Настройка".
          </p>
          <Button onClick={onStartRace} disabled={isSimulating}>
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Симуляция...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Начать симуляцию
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Симуляция забега на {liveRaceData.distance}м</CardTitle>
          <div className="text-xl font-mono">
            {formatTime(liveRaceData.elapsedTime)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Статус: {liveRaceData.status === 'starting' ? 'Старт' : 
                  liveRaceData.status === 'running' ? 'Забег' : 
                  liveRaceData.status === 'finished' ? 'Финиш' : 'Ожидание'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-card rounded-md border overflow-hidden">
          <canvas 
            ref={canvasRef}
            width={800}
            height={liveRaceData.athletes.length * 50 + 80}
            className="w-full h-auto"
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium">Текущие позиции:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {liveRaceData.athletes
              .sort((a, b) => a.currentPosition - b.currentPosition)
              .map(athlete => (
                <div 
                  key={athlete.athleteId} 
                  className="flex items-center p-2 border rounded-md"
                >
                  <div className="mr-2 font-bold">{athlete.currentPosition}.</div>
                  <div 
                    className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: athlete.jerseyColor }}
                  >
                    {athlete.number}
                  </div>
                  <div className="flex-grow text-sm">{athlete.name}</div>
                </div>
              ))
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveRaceViewer;
