
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Activity, User, Calendar, LineChart, BarChart, Gauge } from 'lucide-react';

const MobileSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 left-4 z-50 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[270px] p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">RunCoach Pro</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 flex flex-col space-y-2">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                Главное
              </h3>
              <div className="space-y-1">
                <Link 
                  to="/" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  <LineChart className="h-5 w-5" />
                  <span>Дашборд</span>
                </Link>
                <Link 
                  to="/athletes" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Спортсмены</span>
                </Link>
                <Link 
                  to="/sessions" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Тренировки</span>
                </Link>
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                Анализ
              </h3>
              <div className="space-y-1">
                <Link 
                  to="/simulation" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  <Gauge className="h-5 w-5" />
                  <span>Симуляция</span>
                </Link>
                <Link 
                  to="/statistics" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  <BarChart className="h-5 w-5" />
                  <span>Статистика</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 mt-auto border-t text-xs text-muted-foreground">
            <div>RunCoach Pro v1.0</div>
            <div>© 2025 Athletics Analytics</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSidebar;
