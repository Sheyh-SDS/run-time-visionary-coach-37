
// Define all types for the application

export interface Athlete {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  specialization: string[];
  personalBests: Record<string, number>;
  imageUrl?: string;
  reactionTime?: number;
  acceleration?: number;
  maxSpeed?: number;
  deceleration?: number;
  number?: number;
  jerseyColor?: string;
}

export interface RunSession {
  id: string;
  athleteId: string;
  date: string;
  type: 'race' | 'training' | 'simulation';
  distance: number;
  time: number;
  splits: number[];
  pace: number;
  heartRate?: {
    average: number;
    max: number;
  };
  location?: string;
  weather?: {
    temperature: number;
    conditions: string;
    humidity?: number;
    windSpeed?: number;
  };
  position?: number;
  notes?: string;
}

export interface PerformanceMetrics {
  recentAvgPace: number;
  paceVariance: number;
  enduranceScore: number;
  recoveryRate: number;
  improvementRate: number;
  consistencyScore: number;
}

export interface ProbabilityFactor {
  name: string;
  impact: number;
}

export interface PositionProbability {
  position: number;
  probability: number;
}

export interface TopNProbability {
  topN: number[];
  probability: number;
}

export interface ProbabilityAnalysis {
  targetTime: number;
  probability: number;
  confidenceInterval: [number, number];
  factors: ProbabilityFactor[];
  positionProbabilities: PositionProbability[];
}

export interface SimulationSettings {
  distance: number;
  basePace: number;
  variability: number;
  fatigueRate: number;
  weatherConditions: string;
  terrainType: string;
  competitionFactor: number;
  reactionTime: number;
  acceleration: number;
  maxSpeed: number;
  deceleration: number;
}

export interface RaceAthlete {
  athleteId: string;
  number: number;
  name: string;
  jerseyColor: string;
  currentPosition: number;
  currentDistance: number;
  currentSpeed: number;
  splitTimes: number[];
}

export interface LiveRaceData {
  raceId: string;
  distance: number;
  status: 'waiting' | 'starting' | 'running' | 'finished';
  athletes: RaceAthlete[];
  elapsedTime: number;
}

export interface RaceResult {
  position: number;
  number: number;
  athleteId: string;
  athleteName: string;
  jerseyColor: string;
  time: number;
  difference: number;
}
