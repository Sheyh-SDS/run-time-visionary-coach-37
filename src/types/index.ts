
// Athlete profile
export interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  specialization: string[];
  personalBests: Record<string, number>; // e.g. {"100m": 10.5, "200m": 21.2}
  imageUrl?: string;
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
}

// Performance analysis
export interface PerformanceMetrics {
  recentAvgPace: number;
  paceVariance: number;
  enduranceScore: number;
  recoveryRate: number;
  improvementRate: number;
  consistencyScore: number;
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
}
