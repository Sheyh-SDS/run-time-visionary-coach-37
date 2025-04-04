
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from './Sidebar';
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSidebar from './MobileSidebar';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full transition-colors duration-300">
        {/* Desktop sidebar with collapsible functionality */}
        {!isMobile && <Sidebar />}
        
        {/* Mobile sidebar */}
        {isMobile && <MobileSidebar />}
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="absolute top-4 right-4 z-10">
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
