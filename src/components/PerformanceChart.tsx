
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RunSession } from '@/types';
import { formatTime } from '@/data/mockData';

interface PerformanceChartProps {
  sessions: RunSession[];
  title?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ sessions, title = "Динамика результатов" }) => {
  // Process data for chart
  const chartData = sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(session => ({
      date: session.date,
      displayDate: new Date(session.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      time: session.time,
      displayTime: formatTime(session.time),
      pace: session.pace,
      displayPace: formatTime(session.pace * 60), // Convert to min:sec format
      heartRate: session.heartRate?.average || 0
    }));

  // Find min and max values for Y-axis
  const minTime = Math.min(...sessions.map(s => s.time)) * 0.95;
  const maxTime = Math.max(...sessions.map(s => s.time)) * 1.05;

  return (
    <Card className="w-full h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              domain={[minTime, maxTime]}
              tickFormatter={(value) => formatTime(value)}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Время") return formatTime(Number(value));
                if (name === "Пульс") return `${value} уд/мин`;
                return value;
              }}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Legend verticalAlign="bottom" height={36} />
            <Line 
              type="monotone" 
              dataKey="time" 
              name="Время" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            {sessions.some(s => s.heartRate) && (
              <Line 
                type="monotone" 
                dataKey="heartRate" 
                name="Пульс" 
                stroke="#ef4444" 
                strokeWidth={2}
                yAxisId="right"
                dot={{ r: 4, strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
