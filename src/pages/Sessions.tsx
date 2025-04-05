
import React, { useState } from 'react';
import Layout from '../components/Layout';
import PerformanceParamsCard from '@/components/PerformanceParamsCard';
import { RunSession, Athlete } from '@/types';
import { mockAthletes, mockRunSessions, formatTime } from '@/data/mockData';
import SessionFilters from '@/components/sessions/SessionFilters';
import SessionList from '@/components/sessions/SessionList';
import SessionTabs from '@/components/sessions/SessionTabs';

// Mock performance history data - in a real app, this would come from an API
const mockPerformanceHistory = [
  {
    date: '2024-01-05',
    reactionTime: 0.23,
    acceleration: 3.2,
    maxSpeed: 9.4,
    deceleration: 2.8
  },
  {
    date: '2024-02-10',
    reactionTime: 0.21,
    acceleration: 3.4,
    maxSpeed: 9.6,
    deceleration: 2.9
  },
  {
    date: '2024-03-15',
    reactionTime: 0.20,
    acceleration: 3.6,
    maxSpeed: 9.8,
    deceleration: 3.0
  },
  {
    date: '2024-04-01',
    reactionTime: 0.19,
    acceleration: 3.8,
    maxSpeed: 10.0,
    deceleration: 3.1
  }
];

const Sessions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [athleteFilter, setAthleteFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null);

  // Filter sessions based on search and athlete filter
  const filteredSessions = mockRunSessions.filter(session => {
    const matchesSearch = 
      session.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.distance.toString().includes(searchTerm) ||
      formatTime(session.time).includes(searchTerm);
      
    const matchesAthlete = athleteFilter === 'all' || session.athleteId === athleteFilter;
    
    return matchesSearch && matchesAthlete;
  });

  // Get selected athlete
  const selectedAthlete = athleteFilter !== 'all' 
    ? mockAthletes.find(a => a.id === athleteFilter) 
    : null;

  // Sort sessions by date (newest first)
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Тренировки и забеги</h1>
          <p className="text-muted-foreground mt-1">
            Управление и анализ всех забегов и тренировок
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <SessionFilters 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              athleteFilter={athleteFilter}
              setAthleteFilter={setAthleteFilter}
              athletes={mockAthletes}
            />

            <SessionList 
              sessions={sortedSessions} 
              onSelectSession={setSelectedSession}
            />

            {selectedAthlete && (
              <PerformanceParamsCard athlete={selectedAthlete} />
            )}
          </div>

          <div className="lg:col-span-2">
            <SessionTabs 
              selectedSession={selectedSession}
              selectedAthlete={selectedAthlete}
              performanceHistoryData={mockPerformanceHistory}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sessions;
