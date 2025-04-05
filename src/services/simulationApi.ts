
import { webSocketService } from './websocket';
import { Athlete, RunSession, SimulationSettings } from '@/types';
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

class SimulationApi {
  private isConnected: boolean = false;
  private mockMode: boolean = true;

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
    
    // If there are registered callbacks, call them
    if (this.simulationCallbacks.size > 0) {
      const runSession = payload as RunSession;
      this.simulationCallbacks.forEach(callback => callback(runSession));
    }
  };

  // Handle athletes list
  private handleAthletesList = (payload: any) => {
    console.log('Received athletes list:', payload);
    // Implementation would depend on how we handle athletes data
  };

  // Handle sessions list
  private handleSessionsList = (payload: any) => {
    console.log('Received sessions list:', payload);
    // Implementation would depend on how we handle sessions data
  };

  // Handle error
  private handleError = (payload: any) => {
    console.error('Received error from simulation server:', payload);
    // Could display an error toast or other notification
  };

  // Request athletes from the server or use mock data
  async getAthletes(): Promise<Athlete[]> {
    if (!this.mockMode && this.isConnected) {
      // In real implementation, we would send a WebSocket message and wait for response
      webSocketService.send(SIMULATION_MESSAGES.REQUEST_ATHLETES, {});
      // This would need to be handled asynchronously with promises in a real implementation
    }
    
    // For now, return mock data after a delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockAthletes);
      }, MOCK_DELAY);
    });
  }

  // Request sessions from the server or use mock data
  async getSessions(athleteId?: string): Promise<RunSession[]> {
    if (!this.mockMode && this.isConnected) {
      // In real implementation, we would send a WebSocket message and wait for response
      webSocketService.send(SIMULATION_MESSAGES.REQUEST_SESSIONS, { athleteId });
      // This would need to be handled asynchronously with promises in a real implementation
    }
    
    // For now, return mock data after a delay
    return new Promise(resolve => {
      setTimeout(() => {
        const filteredSessions = athleteId 
          ? mockRunSessions.filter(session => session.athleteId === athleteId)
          : mockRunSessions;
        resolve(filteredSessions);
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
    return new Promise(resolve => {
      setTimeout(() => {
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
        
        resolve(simulatedSession);
      }, MOCK_DELAY * 2); // Longer delay for simulation to feel more realistic
    });
  }

  // Get probability analysis
  async getProbabilityAnalysis(
    athleteId: string,
    distance: number,
    targetTime: number
  ) {
    if (!this.mockMode && this.isConnected) {
      // Implementation would depend on the actual API
    }
    
    // For now, return mock data after a delay
    return new Promise(resolve => {
      setTimeout(() => {
        const athlete = mockAthletes.find(a => a.id === athleteId);
        if (!athlete) {
          resolve(null);
          return;
        }
        
        const sessions = mockRunSessions.filter(s => s.athleteId === athleteId);
        
        // Use mocked analysis if available, otherwise calculate
        const analysis = mockProbabilityAnalysis[athleteId] || 
          calculateProbability(athlete, distance, targetTime, sessions);
          
        resolve(analysis);
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
