
// Athlete profile
export interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  specialization: string[];
  personalBests: Record<string, number>; // e.g. {"100m": 10.5, "200m": 21.2}
  imageUrl?: string;
  // New performance parameters
  reactionTime?: number; // in seconds
  acceleration?: number; // meters per second squared
  maxSpeed?: number; // meters per second
  deceleration?: number; // meters per second squared
  // Race parameters
  number?: number; // Runner's number (1-6)
  jerseyColor?: string; // Color of jersey
}

// Run session
export interface RunSession {
  id: string;
  athleteId: string;
  date: string;
  type: 'race' | 'training' | 'simulation';
  distance: number; // in meters
  time: number; // in seconds
  splits: number[]; // split times in seconds
  pace: number; // seconds per kilometer
  heartRate?: {
    average: number;
    max: number;
  };
  location?: string;
  weather?: {
    temperature: number; // in Celsius
    conditions: string;
    humidity?: number;
    windSpeed?: number;
  };
  notes?: string;
  position?: number; // Final position in the race
}

// Performance analysis
export interface PerformanceMetrics {
  recentAvgPace: number;
  paceVariance: number;
  enduranceScore: number;
  recoveryRate: number;
  improvementRate: number;
  consistencyScore: number;
  // Adding new performance metrics
  reactionTimeProgress?: number; // percentage improvement over time
  accelerationProgress?: number; // percentage improvement over time
  maxSpeedProgress?: number; // percentage improvement over time
  decelerationProgress?: number; // percentage improvement over time
}

// Probability analysis
export interface ProbabilityAnalysis {
  targetTime: number;
  probability: number;
  confidenceInterval: [number, number];
  factors: {
    name: string;
    impact: number; // -1 to 1, negative is bad, positive is good
  }[];
  positionProbabilities?: PositionProbability[]; // Added position probabilities
}

// Position probability
export interface PositionProbability {
  position: number;
  probability: number;
}

// Top N probability
export interface TopNProbability {
  topN: number[];
  probability: number;
}

// Live race data
export interface LiveRaceData {
  raceId: string;
  distance: number;
  status: 'pending' | 'starting' | 'running' | 'finished';
  athletes: LiveAthleteData[];
  elapsedTime: number;
}

// Live athlete data
export interface LiveAthleteData {
  athleteId: string;
  number: number;
  name: string;
  jerseyColor: string;
  currentPosition: number;
  currentDistance: number;
  currentSpeed: number;
  splitTimes: number[];
}

// Simulation settings
export interface SimulationSettings {
  distance: number;
  basePace: number;
  variability: number;
  fatigueRate: number;
  weatherConditions: 'ideal' | 'good' | 'moderate' | 'challenging' | 'extreme';
  terrainType: 'track' | 'road' | 'trail' | 'hills';
  competitionFactor: number; // 0-1, how much competition pushes the athlete
  // New performance parameters
  reactionTime?: number;
  acceleration?: number;
  maxSpeed?: number;
  deceleration?: number;
  // Original race simulation settings
  numberOfCompetitors?: number;
  includeRaceParameters?: boolean;
}

// Race results table
export interface RaceResult {
  position: number;
  number: number;
  athleteId: string;
  athleteName: string;
  jerseyColor: string;
  time: number;
  difference: number; // difference from first place
}

// Performance characteristics history 
export interface PerformanceHistory {
  date: string;
  reactionTime?: number;
  acceleration?: number;
  maxSpeed?: number;
  deceleration?: number;
}
