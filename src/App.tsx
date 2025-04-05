
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
import Race from "./pages/Race";
import RaceAnalysis from "./pages/RaceAnalysis";
import WebSocketTest from "./pages/WebSocketTest";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";
import { SimulationProvider } from "./contexts/SimulationContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Create a client with default options for caching and error retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (replaces cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <SimulationProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/athletes" element={<Athletes />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/race" element={<Race />} />
                <Route path="/race-analysis" element={<RaceAnalysis />} />
                <Route path="/websocket" element={<WebSocketTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </SimulationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
