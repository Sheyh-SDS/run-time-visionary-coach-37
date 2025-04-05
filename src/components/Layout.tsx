
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from './Sidebar';
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSidebar from './MobileSidebar';
import { Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useSimulation } from '@/contexts/SimulationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { isConnected, connectionState } = useSimulation();

  // Get connection status details
  const getConnectionStatus = () => {
    switch(connectionState) {
      case 'connecting':
        return { 
          label: 'Подключение...', 
          icon: <Wifi className="h-5 w-5 text-amber-500 animate-pulse" />,
          color: 'text-amber-500'
        };
      case 'open':
        return { 
          label: 'Подключено к серверу', 
          icon: <Wifi className="h-5 w-5 text-green-500" />,
          color: 'text-green-500'
        };
      case 'error':
        return { 
          label: 'Ошибка подключения', 
          icon: <WifiOff className="h-5 w-5 text-red-500" />,
          color: 'text-red-500'
        };
      default:
        return { 
          label: 'Не подключено (используются локальные данные)', 
          icon: <WifiOff className="h-5 w-5 text-muted-foreground" />,
          color: 'text-muted-foreground'
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full transition-colors duration-300">
        {/* Desktop sidebar with collapsible functionality */}
        {!isMobile && <Sidebar />}
        
        {/* Mobile sidebar */}
        {isMobile && <MobileSidebar />}
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-2 absolute top-4 right-4 z-10">
            {/* Connection status indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-background/50 backdrop-blur-sm border`}>
                    {connectionStatus.icon}
                    <span className={`text-xs ${connectionStatus.color} hidden sm:inline-block`}>
                      {connectionStatus.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {connectionStatus.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Theme toggle */}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-background/50 backdrop-blur-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 transition-all duration-300 rotate-0 scale-100" />
              ) : (
                <Moon className="h-5 w-5 transition-all duration-300 rotate-90 scale-100" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
