
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sidebar as UISidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { Activity, User, Calendar, LineChart, BarChart, Gauge, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <UISidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className={cn("text-lg font-semibold transition-opacity duration-200", 
            isCollapsed && "opacity-0")}>RunCoach Pro</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="rounded-full"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Главное</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Дашборд">
                  <Link to="/" className="flex items-center space-x-3">
                    <LineChart className="h-5 w-5" />
                    <span>Дашборд</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Спортсмены">
                  <Link to="/athletes" className="flex items-center space-x-3">
                    <User className="h-5 w-5" />
                    <span>Спортсмены</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Тренировки">
                  <Link to="/sessions" className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5" />
                    <span>Тренировки</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Анализ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Симуляция">
                  <Link to="/simulation" className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5" />
                    <span>Симуляция</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Статистика">
                  <Link to="/statistics" className="flex items-center space-x-3">
                    <BarChart className="h-5 w-5" />
                    <span>Статистика</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className={cn("p-4 text-xs text-muted-foreground transition-opacity duration-200", 
        isCollapsed && "opacity-0")}>
        <div>RunCoach Pro v1.0</div>
        <div>© 2025 Athletics Analytics</div>
      </SidebarFooter>
      
      {/* Add a rail for easier resizing */}
      <SidebarRail />
    </UISidebar>
  );
};

export default Sidebar;
