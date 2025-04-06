
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Rotate3d, Move3d, Scale3d } from 'lucide-react';

interface UnityWebGLViewerProps {
  unityLoaderUrl?: string;
  dataUrl?: string;
  frameworkUrl?: string;
  codeUrl?: string;
  containerClassName?: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  onUnityEvent?: (eventName: string, data: any) => void;
}

const UnityWebGLViewer: React.FC<UnityWebGLViewerProps> = ({
  unityLoaderUrl = '/Build/UnityLoader.js',
  dataUrl = '/Build/WebGLBuild.data',
  frameworkUrl = '/Build/WebGLBuild.framework.js',
  codeUrl = '/Build/WebGLBuild.wasm',
  containerClassName = '',
  title = 'Симуляция забега в 3D',
  width = '100%',
  height = 500,
  onUnityEvent
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const unityInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'free' | 'follow' | 'top'>('free');

  useEffect(() => {
    // Skip initialization if running in a server-side environment
    if (typeof window === 'undefined') return;

    // Load Unity script dynamically
    const script = document.createElement('script');
    script.src = unityLoaderUrl;
    script.async = true;
    script.onload = initializeUnity;
    script.onerror = () => setError('Не удалось загрузить Unity WebGL модуль');
    
    document.body.appendChild(script);

    return () => {
      // Cleanup Unity instance on component unmount
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit();
      }
      
      document.body.removeChild(script);
    };
  }, [unityLoaderUrl]);

  const initializeUnity = () => {
    if (!window.createUnityInstance) {
      console.error('Unity loader not available');
      setError('Unity loader не найден');
      return;
    }

    if (!containerRef.current) return;

    setIsLoading(true);

    // Configure Unity
    const config = {
      dataUrl,
      frameworkUrl,
      codeUrl,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "LovableRunCoach",
      productName: "Run Race Simulation",
      productVersion: "1.0",
    };

    // Create Unity instance
    window.createUnityInstance(canvasRef.current, config)
      .then((unityInstance) => {
        unityInstanceRef.current = unityInstance;
        setIsLoading(false);
        console.log('Unity WebGL initialized successfully');
        
        // Setup message handlers for Unity -> React communication
        window.receiveUnityEvent = (eventName: string, jsonData: string) => {
          try {
            const data = JSON.parse(jsonData);
            console.log('Received event from Unity:', eventName, data);
            if (onUnityEvent) {
              onUnityEvent(eventName, data);
            }
          } catch (error) {
            console.error('Error parsing Unity event data:', error);
          }
        };
      })
      .catch((error) => {
        console.error('Unity WebGL initialization error:', error);
        setError('Ошибка инициализации Unity WebGL');
        setIsLoading(false);
      });
  };

  // Function to send messages to Unity
  const sendMessageToUnity = (objectName: string, methodName: string, value: string) => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current.SendMessage(objectName, methodName, value);
    }
  };

  // Race control functions
  const startRaceSimulation = () => {
    sendMessageToUnity('SimulationManager', 'StartRaceSimulation', '');
  };
  
  const resetSimulation = () => {
    sendMessageToUnity('SimulationManager', 'ResetSimulation', '');
  };
  
  const changeCamera = (mode: 'free' | 'follow' | 'top') => {
    setViewMode(mode);
    sendMessageToUnity('CameraController', 'SetCameraMode', mode);
  };
  
  const toggleSlowMotion = () => {
    sendMessageToUnity('SimulationManager', 'ToggleSlowMotion', '');
  };

  return (
    <Card className={`overflow-hidden ${containerClassName}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div>{title}</div>
          {isLoading && (
            <div className="flex items-center text-sm font-normal">
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Загрузка симуляции...
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          {error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p>{error}</p>
              <p className="text-sm mt-2">
                Убедитесь, что файлы Unity WebGL корректно скопированы в папку public вашего проекта и 
                имеют структуру: /public/Build/UnityLoader.js, /public/Build/WebGLBuild.data и т.д.
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                <canvas 
                  ref={canvasRef}
                  style={{ width, height }}
                  className="bg-background border rounded-md"
                />
                
                {/* Camera controls overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button 
                    size="icon" 
                    variant={viewMode === 'free' ? "default" : "outline"}
                    onClick={() => changeCamera('free')}
                    title="Свободная камера"
                  >
                    <Rotate3d className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon"
                    variant={viewMode === 'follow' ? "default" : "outline"}
                    onClick={() => changeCamera('follow')}
                    title="Следовать за бегуном"
                  >
                    <Move3d className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon"
                    variant={viewMode === 'top' ? "default" : "outline"}
                    onClick={() => changeCamera('top')}
                    title="Вид сверху"
                  >
                    <Scale3d className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={startRaceSimulation} disabled={isLoading}>
                  Запустить симуляцию
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetSimulation}
                  disabled={isLoading}
                >
                  Сбросить
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={toggleSlowMotion}
                  disabled={isLoading}
                >
                  Замедленная съемка
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add this declaration to make TypeScript happy
declare global {
  interface Window {
    createUnityInstance: any;
    receiveUnityEvent: (eventName: string, jsonData: string) => void;
  }
}

export default UnityWebGLViewer;
