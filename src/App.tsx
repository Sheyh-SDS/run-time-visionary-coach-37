
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Athletes from "./pages/Athletes";
import Sessions from "./pages/Sessions";
import Simulation from "./pages/Simulation";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";
import { SimulationProvider } from "./contexts/SimulationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <SimulationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/athletes" element={<Athletes />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SimulationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
