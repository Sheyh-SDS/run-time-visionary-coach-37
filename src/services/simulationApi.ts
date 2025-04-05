
import { webSocketService } from './websocket';
import { Athlete, RunSession, SimulationSettings, ProbabilityAnalysis } from '@/types';
import { 
  mockAthletes, 
  mockRunSessions, 
  generateRunningSession,
  mockProbabilityAnalysis,
  calculateProbability 
} from '@/data/mockData';

// Define message types for the simulation API
export const SIMULATION_MESSAGES = {
  REQUEST_SIMULATION: 'request_simulation',
  SIMULATION_RESULT: 'simulation_result',
  REQUEST_ATHLETES: 'request_athletes',
  ATHLETES_LIST: 'athletes_list',
  REQUEST_SESSIONS: 'request_sessions',
  SESSIONS_LIST: 'sessions_list',
  ERROR: 'error'
};

// Mock delay for simulating network latency
const MOCK_DELAY = 800;

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

class SimulationApi {
  private isConnected: boolean = false;
  private mockMode: boolean = true;
  private cache: Cache = new Cache();

  // Initialize the API
  init(wsUrl?: string): void {
    if (wsUrl) {
      // Register WebSocket handlers
      webSocketService.on(SIMULATION_MESSAGES.SIMULATION_RESULT, this.handleSimulationResult);
      webSocketService.on(SIMULATION_MESSAGES.ATHLETES_LIST, this.handleAthletesList);
      webSocketService.on(SIMULATION_MESSAGES.SESSIONS_LIST, this.handleSessionsList);
      webSocketService.on(SIMULATION_MESSAGES.ERROR, this.handleError);
      
      // Connect to WebSocket server
      webSocketService.connect(wsUrl);
      
      // Track connection state
      webSocketService.onStateChange((state) => {
        this.isConnected = state === 'open';
        
        // Clear cache when connection state changes
        if (state === 'open') {
          this.cache.invalidateAll();
        }
      });
      
      this.mockMode = false;
    } else {
      // If no WebSocket URL is provided, use mock mode
      this.mockMode = true;
    }
  }

  // Handle simulation result
  private handleSimulationResult = (payload: any) => {
    console.log('Received simulation result:', payload);
    
    try {
      // If there are registered callbacks, call them
      if (this.simulationCallbacks.size > 0) {
        const runSession = payload as RunSession;
        this.simulationCallbacks.forEach(callback => callback(runSession));
      }
    } catch (error) {
      console.error('Error processing simulation result:', error);
    }
  };

  // Handle athletes list
  private handleAthletesList = (payload: any) => {
    console.log('Received athletes list:', payload);
    try {
      // Cache the athletes data
      if (Array.isArray(payload)) {
        this.cache.set('athletes', payload);
      }
    } catch (error) {
      console.error('Error processing athletes list:', error);
    }
  };

  // Handle sessions list
  private handleSessionsList = (payload: any) => {
    console.log('Received sessions list:', payload);
    try {
      // Cache the sessions data with the athleteId as part of the key
      if (Array.isArray(payload.sessions) && payload.athleteId) {
        this.cache.set(`sessions_${payload.athleteId}`, payload.sessions);
      } else if (Array.isArray(payload)) {
        this.cache.set('sessions', payload);
      }
    } catch (error) {
      console.error('Error processing sessions list:', error);
    }
  };

  // Handle error
  private handleError = (payload: any) => {
    console.error('Received error from simulation server:', payload);
    // Could display an error toast or other notification
  };

  // Request athletes from the server or use mock data
  getAthletes = async (): Promise<Athlete[]> => {
    // Check cache first
    const cachedAthletes = this.cache.get<Athlete[]>('athletes');
    if (cachedAthletes) {
      console.log('Using cached athletes data');
      return cachedAthletes;
    }
    
    if (!this.mockMode && this.isConnected) {
      // In real implementation, we would send a WebSocket message and wait for response
      webSocketService.send(SIMULATION_MESSAGES.REQUEST_ATHLETES, {});
      // This would need to be handled asynchronously with promises in a real implementation
      
      // For now, we'll still return mock data after a delay
    }
    
    // Return mock data after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const data = mockAthletes;
          this.cache.set('athletes', data);
          resolve(data);
        } catch (error) {
          console.error('Error getting athletes:', error);
          reject(new Error('Failed to fetch athletes data'));
        }
      }, MOCK_DELAY);
    });
  }

  // Request sessions from the server or use mock data
  async getSessions(athleteId?: string): Promise<RunSession[]> {
    // Check cache first
    const cacheKey = athleteId ? `sessions_${athleteId}` : 'sessions';
    const cachedSessions = this.cache.get<RunSession[]>(cacheKey);
    if (cachedSessions) {
      console.log(`Using cached sessions data for ${cacheKey}`);
      return cachedSessions;
    }
    
    if (!this.mockMode && this.isConnected) {
      // In real implementation, we would send a WebSocket message and wait for response
      webSocketService.send(SIMULATION_MESSAGES.REQUEST_SESSIONS, { athleteId });
      // This would need to be handled asynchronously with promises in a real implementation
    }
    
    // For now, return mock data after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const filteredSessions = athleteId 
            ? mockRunSessions.filter(session => session.athleteId === athleteId)
            : mockRunSessions;
          this.cache.set(cacheKey, filteredSessions);
          resolve(filteredSessions);
        } catch (error) {
          console.error('Error getting sessions:', error);
          reject(new Error('Failed to fetch sessions data'));
        }
      }, MOCK_DELAY);
    });
  }

  // Callbacks for simulation results
  private simulationCallbacks = new Set<(session: RunSession) => void>();

  // Register a callback for simulation results
  onSimulationResult(callback: (session: RunSession) => void): () => void {
    this.simulationCallbacks.add(callback);
    return () => {
      this.simulationCallbacks.delete(callback);
    };
  }

  // Request a simulation
  async requestSimulation(
    athleteId: string, 
    settings: SimulationSettings
  ): Promise<RunSession> {
    if (!this.mockMode && this.isConnected) {
      // In real implementation, we would send a WebSocket message and wait for response
      webSocketService.send(SIMULATION_MESSAGES.REQUEST_SIMULATION, {
        athleteId,
        settings
      });
      
      // Return a Promise that will be resolved when we receive the simulation result
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Simulation request timed out'));
        }, 30000); // 30s timeout
        
        const handleResult = (result: RunSession) => {
          if (result.athleteId === athleteId) {
            cleanup();
            resolve(result);
          }
        };
        
        const unsubscribe = this.onSimulationResult(handleResult);
        
        const cleanup = () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      });
    }
    
    // For mock mode, simulate a response after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Convert pace from minutes per km to total time in seconds for the distance
          const paceInSecondsPerMeter = (settings.basePace * 60) / 1000;
          const baseTimeForDistance = paceInSecondsPerMeter * settings.distance;
          
          // Apply terrain and weather factors
          let adjustedTime = baseTimeForDistance;
          
          // Terrain factors
          if (settings.terrainType === 'road') adjustedTime *= 1.02;
          else if (settings.terrainType === 'trail') adjustedTime *= 1.1;
          else if (settings.terrainType === 'hills') adjustedTime *= 1.15;
          
          // Weather factors
          if (settings.weatherConditions === 'moderate') adjustedTime *= 1.03;
          else if (settings.weatherConditions === 'challenging') adjustedTime *= 1.08;
          else if (settings.weatherConditions === 'extreme') adjustedTime *= 1.15;
          else if (settings.weatherConditions === 'ideal') adjustedTime *= 0.98;
          
          // Competition factor - can improve time
          adjustedTime *= (1 - (settings.competitionFactor * 0.05));
          
          // Generate the running session
          const simulatedSession = generateRunningSession(
            athleteId,
            settings.distance,
            adjustedTime,
            settings.variability
          );
          
          // Also invalidate sessions cache for this athlete to ensure fresh data
          this.cache.invalidate(`sessions_${athleteId}`);
          
          resolve(simulatedSession);
        } catch (error) {
          console.error('Error generating simulation:', error);
          reject(new Error('Failed to simulate run session'));
        }
      }, MOCK_DELAY * 2); // Longer delay for simulation to feel more realistic
    });
  }

  // Get probability analysis
  async getProbabilityAnalysis(
    athleteId: string,
    distance: number,
    targetTime: number
  ): Promise<ProbabilityAnalysis | null> {
    // Check cache first
    const cacheKey = `probability_${athleteId}_${distance}_${targetTime}`;
    const cachedAnalysis = this.cache.get<ProbabilityAnalysis>(cacheKey);
    if (cachedAnalysis) {
      console.log('Using cached probability analysis');
      return cachedAnalysis;
    }
    
    if (!this.mockMode && this.isConnected) {
      // Implementation would depend on the actual API
    }
    
    // For now, return mock data after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const athlete = mockAthletes.find(a => a.id === athleteId);
          if (!athlete) {
            resolve(null);
            return;
          }
          
          const sessions = mockRunSessions.filter(s => s.athleteId === athleteId);
          
          // Use mocked analysis if available, otherwise calculate
          const analysis = mockProbabilityAnalysis[athleteId] || 
            calculateProbability(athlete, distance, targetTime, sessions);
          
          if (analysis) {
            this.cache.set(cacheKey, analysis);
          }
            
          resolve(analysis);
        } catch (error) {
          console.error('Error calculating probability analysis:', error);
          reject(new Error('Failed to calculate probability analysis'));
        }
      }, MOCK_DELAY);
    });
  }
}

// Create singleton instance
export const simulationApi = new SimulationApi();

// Initialize the API with mock mode for now
simulationApi.init();

// Export a function to enable real WebSocket mode
export function connectToSimulationServer(wsUrl: string) {
  simulationApi.init(wsUrl);
}
