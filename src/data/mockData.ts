
import { Athlete, RunSession, PerformanceMetrics, ProbabilityAnalysis } from '../types';

export const mockAthletes: Athlete[] = [
  {
    id: "1",
    name: "Алексей Петров",
    age: 23,
    gender: "male",
    specialization: ["100м", "200м", "эстафета 4x100м"],
    personalBests: {
      "100м": 10.42,
      "200м": 20.85,
      "60м": 6.65
    },
    imageUrl: "/placeholder.svg"
  },
  {
    id: "2",
    name: "Мария Иванова",
    age: 21,
    gender: "female",
    specialization: ["400м", "800м"],
    personalBests: {
      "400м": 52.1,
      "800м": 1.59,
      "200м": 23.76
    },
    imageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    name: "Дмитрий Соколов",
    age: 25,
    gender: "male",
    specialization: ["800м", "1500м"],
    personalBests: {
      "800м": 1.47,
      "1500м": 3.42,
      "1000м": 2.21
    },
    imageUrl: "/placeholder.svg"
  },
  {
    id: "4",
    name: "Анна Козлова",
    age: 19,
    gender: "female",
    specialization: ["100м с барьерами", "200м"],
    personalBests: {
      "100м с барьерами": 12.98,
      "200м": 23.5,
      "100м": 11.68
    },
    imageUrl: "/placeholder.svg"
  }
];

export const mockRunSessions: RunSession[] = [
  {
    id: "1",
    athleteId: "1",
    date: "2025-04-01",
    type: "training",
    distance: 800,
    time: 107.2, // 1:47.2
    splits: [25.8, 26.5, 27.3, 27.6],
    pace: 2.23, // 2:23 min/km
    heartRate: {
      average: 175,
      max: 188
    },
    location: "Стадион Динамо",
    weather: {
      temperature: 18,
      conditions: "Солнечно",
      humidity: 65,
      windSpeed: 3
    },
    notes: "Хорошая тренировка, работа над финишным ускорением"
  },
  {
    id: "2",
    athleteId: "1",
    date: "2025-03-28",
    type: "training",
    distance: 1000,
    time: 144.5, // 2:24.5
    splits: [28.2, 28.8, 29.1, 29.3, 29.1],
    pace: 2.41, // 2:41 min/km
    heartRate: {
      average: 172,
      max: 184
    },
    location: "Стадион Динамо",
    weather: {
      temperature: 16,
      conditions: "Облачно",
      humidity: 70,
      windSpeed: 5
    }
  },
  {
    id: "3",
    athleteId: "1",
    date: "2025-03-25",
    type: "race",
    distance: 800,
    time: 105.8, // 1:45.8
    splits: [25.1, 26.2, 26.9, 27.6],
    pace: 2.20, // 2:20 min/km
    heartRate: {
      average: 182,
      max: 194
    },
    location: "Легкоатлетический манеж",
    weather: {
      temperature: 22,
      conditions: "В помещении",
      humidity: 55
    },
    notes: "Соревнования регионального уровня, 2-е место"
  },
  {
    id: "4",
    athleteId: "2",
    date: "2025-04-02",
    type: "training",
    distance: 1500,
    time: 275.4, // 4:35.4
    splits: [68.8, 69.3, 69.8, 67.5],
    pace: 3.05, // 3:05 min/km
    heartRate: {
      average: 171,
      max: 182
    },
    location: "Центральный парк",
    weather: {
      temperature: 17,
      conditions: "Облачно",
      humidity: 68,
      windSpeed: 4
    }
  }
];

export const mockPerformanceMetrics: Record<string, PerformanceMetrics> = {
  "1": {
    recentAvgPace: 2.24, // 2:24 min/km
    paceVariance: 0.08,
    enduranceScore: 0.82,
    recoveryRate: 0.78,
    improvementRate: 0.04,
    consistencyScore: 0.85
  },
  "2": {
    recentAvgPace: 3.03, // 3:03 min/km
    paceVariance: 0.06,
    enduranceScore: 0.89,
    recoveryRate: 0.77,
    improvementRate: 0.03,
    consistencyScore: 0.91
  }
};

export const mockProbabilityAnalysis: Record<string, ProbabilityAnalysis> = {
  "1": {
    targetTime: 104.5, // 1:44.5 for 800m
    probability: 0.75,
    confidenceInterval: [103.8, 105.7],
    factors: [
      { name: "Текущая форма", impact: 0.8 },
      { name: "Восстановление", impact: 0.65 },
      { name: "Психологический настрой", impact: 0.7 },
      { name: "История выступлений", impact: 0.85 },
      { name: "Погодные условия", impact: -0.2 }
    ]
  },
  "2": {
    targetTime: 52.0, // 52.0s for 400m
    probability: 0.68,
    confidenceInterval: [51.5, 53.1],
    factors: [
      { name: "Текущая форма", impact: 0.75 },
      { name: "Восстановление", impact: 0.6 },
      { name: "Психологический настрой", impact: 0.8 },
      { name: "История выступлений", impact: 0.72 },
      { name: "Погодные условия", impact: 0.1 }
    ]
  }
};

// Utility function to generate realistic running data
export function generateRunningSession(
  athleteId: string,
  distance: number,
  baseTime: number,
  variability: number = 0.05
): RunSession {
  // Calculate number of splits (e.g., for 400m we might want 4 splits of 100m each)
  const numSplits = distance <= 400 ? 4 : (distance <= 1500 ? 4 : Math.ceil(distance / 400));
  
  // Generate splits with some variability and a slight fade at the end
  const splitDistance = distance / numSplits;
  const targetSplitTime = baseTime / numSplits;
  
  const splits = [];
  for (let i = 0; i < numSplits; i++) {
    // Add variability and a slight fatigue effect toward the end
    const fatigueEffect = i / numSplits * 0.1; // Gradually increases fatigue
    const randomVariation = (Math.random() * 2 - 1) * variability; // Between -variability and +variability
    
    let splitTime = targetSplitTime * (1 + randomVariation + fatigueEffect);
    // Make sure split time isn't negative
    splitTime = Math.max(0.1, splitTime);
    
    splits.push(parseFloat(splitTime.toFixed(1)));
  }
  
  // Calculate total time (might differ slightly from baseTime due to splits randomization)
  const actualTime = parseFloat(splits.reduce((sum, time) => sum + time, 0).toFixed(1));
  
  // Calculate pace in seconds per kilometer
  const pacePerKm = (actualTime / (distance / 1000)).toFixed(2);
  
  return {
    id: `sim-${Date.now()}`,
    athleteId,
    date: new Date().toISOString().split('T')[0],
    type: 'simulation',
    distance,
    time: actualTime,
    splits,
    pace: parseFloat(pacePerKm),
    heartRate: {
      average: Math.floor(160 + Math.random() * 25),
      max: Math.floor(180 + Math.random() * 20)
    },
    location: "Симуляция",
    notes: "Автоматически сгенерированная симуляция забега"
  };
}

// Function to format time in MM:SS.ms format
export function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const ms = Math.round((timeInSeconds % 1) * 10);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
}

// Function to calculate probability of achieving target time
export function calculateProbability(
  athlete: Athlete,
  distance: number,
  targetTime: number,
  recentPerformances: RunSession[]
): ProbabilityAnalysis {
  // This would be a complex calculation in real life
  // Here we'll use a simplified model for demonstration
  
  // Base probability based on how close the target is to personal best
  let baseProbability = 0.5;
  const eventKey = `${distance}м`;
  
  if (athlete.personalBests[eventKey]) {
    const pb = athlete.personalBests[eventKey];
    const improvement = (pb - targetTime) / pb; // Positive if target is better than PB
    
    if (improvement > 0.05) {
      // Target is >5% better than PB, very challenging
      baseProbability = 0.2;
    } else if (improvement > 0) {
      // Target is better than PB but within 5%
      baseProbability = 0.4;
    } else if (improvement > -0.03) {
      // Target is within 3% of PB
      baseProbability = 0.7;
    } else {
      // Target is easier than PB
      baseProbability = 0.85;
    }
  }
  
  // Adjust based on recent performances
  const recentFactor = 0.1;
  let recentPerformanceImpact = 0;
  
  if (recentPerformances.length > 0) {
    const relevantPerformances = recentPerformances.filter(p => 
      p.distance === distance || Math.abs(p.distance - distance) / distance < 0.2);
      
    if (relevantPerformances.length > 0) {
      const avgTime = relevantPerformances.reduce((sum, p) => sum + p.time, 0) / 
                     relevantPerformances.length;
      const recentToPB = (avgTime - targetTime) / avgTime;
      
      if (recentToPB > 0.05) {
        recentPerformanceImpact = -0.2; // Recent performances much worse than target
      } else if (recentToPB > 0) {
        recentPerformanceImpact = -0.1; // Recent performances worse than target
      } else {
        recentPerformanceImpact = 0.1; // Recent performances better than target
      }
    }
  }
  
  // Final probability calculation
  let probability = Math.min(0.95, Math.max(0.05, baseProbability + (recentFactor * recentPerformanceImpact)));
  
  // Generate confidence interval (simplistic approach)
  const confidenceRange = 0.02 * targetTime; // 2% range
  const confidenceInterval: [number, number] = [
    parseFloat((targetTime - confidenceRange).toFixed(1)),
    parseFloat((targetTime + confidenceRange).toFixed(1))
  ];
  
  // Generate impact factors
  const factors = [
    { name: "Текущая форма", impact: Math.random() * 0.4 + 0.4 }, // 0.4 to 0.8
    { name: "Восстановление", impact: Math.random() * 0.4 + 0.3 }, // 0.3 to 0.7
    { name: "Психологический настрой", impact: Math.random() * 0.6 + 0.2 }, // 0.2 to 0.8
    { name: "История выступлений", impact: Math.random() * 0.3 + 0.5 }, // 0.5 to 0.8
    { name: "Погодные условия", impact: Math.random() * 0.6 - 0.3 } // -0.3 to 0.3
  ];
  
  return {
    targetTime,
    probability,
    confidenceInterval,
    factors
  };
}
