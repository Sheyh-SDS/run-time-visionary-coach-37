
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
  SidebarFooter
} from "@/components/ui/sidebar";
import { Activity, User, Calendar, LineChart, BarChart, Gauge } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <UISidebar>
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">RunCoach Pro</span>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Главное</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center space-x-3">
                    <LineChart className="h-5 w-5" />
                    <span>Дашборд</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/athletes" className="flex items-center space-x-3">
                    <User className="h-5 w-5" />
                    <span>Спортсмены</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
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
                <SidebarMenuButton asChild>
                  <Link to="/simulation" className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5" />
                    <span>Симуляция</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
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
      
      <SidebarFooter className="p-4 text-xs text-muted-foreground">
        <div>RunCoach Pro v1.0</div>
        <div>© 2025 Athletics Analytics</div>
      </SidebarFooter>
    </UISidebar>
  );
};

export default Sidebar;
