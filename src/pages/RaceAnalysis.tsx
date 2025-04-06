
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulation } from '@/contexts/SimulationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import UnityWebGLViewer from '@/components/UnityWebGLViewer';

const RaceAnalysis = () => {
  const { toast } = useToast();
  const { isConnected: isSimulationConnected } = useSimulation();
  
  // Function to handle Unity events
  const handleUnityEvent = (eventName: string, data: any) => {
    console.log('Unity event:', eventName, data);
    
    // Handle events from Unity
    if (eventName === 'race_finished') {
      toast({
        title: "Симуляция завершена",
        description: `Результаты забега: ${data.winner} финишировал первым за ${data.time} секунд`
      });
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3D симуляция забега</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Визуализация соревнований в реальном времени с помощью физического движка Unity
          </p>
        </div>

        {!isSimulationConnected && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Нет соединения с сервером данных. Используются демо-данные.
            </AlertDescription>
          </Alert>
        )}

        {/* Unity WebGL Simulation */}
        <UnityWebGLViewer
          onUnityEvent={handleUnityEvent}
          unityLoaderUrl="/Build/UnityLoader.js"
          dataUrl="/Build/WebGLBuild.data"
          frameworkUrl="/Build/WebGLBuild.framework.js"
          codeUrl="/Build/WebGLBuild.wasm"
          height={600}
          title="Симуляция забега в 3D"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Управление симуляцией</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                3D-симуляция позволяет наблюдать забег с различных ракурсов и в реальном времени.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Используйте колесо мыши для приближения/отдаления</li>
                <li>Зажмите правую кнопку мыши для вращения камеры</li>
                <li>Нажмите пробел для переключения вида камеры</li>
                <li>Клавиши 1-6 позволяют переключаться между спортсменами</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Технические детали</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Симуляция построена на физическом движке Unity с использованием реальных данных спортсменов.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Реалистичная физика движения</li>
                <li>Учет индивидуальных характеристик спортсменов</li>
                <li>Симуляция реакции на старте и ускорения</li>
                <li>Возможность сравнения различных стратегий забега</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RaceAnalysis;
