
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
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12, fill: "#4b5563" }}
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <YAxis 
              domain={[minTime, maxTime]}
              tickFormatter={(value) => formatTime(value)}
              tick={{ fontSize: 12, fill: "#4b5563" }}
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={{ stroke: '#9ca3af' }}
              yAxisId="left"
            />
            {sessions.some(s => s.heartRate) && (
              <YAxis 
                orientation="right"
                yAxisId="right"
                tick={{ fontSize: 12, fill: "#4b5563" }}
                axisLine={{ stroke: '#9ca3af' }}
                tickLine={{ stroke: '#9ca3af' }}
              />
            )}
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Время") return formatTime(Number(value));
                if (name === "Пульс") return `${value} уд/мин`;
                return value;
              }}
              labelFormatter={(label) => `Дата: ${label}`}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.375rem' }}
              itemStyle={{ color: '#1f2937' }}
              labelStyle={{ color: '#4b5563', fontWeight: 'bold' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-gray-700">{value}</span>}
            />
            <Line 
              type="monotone" 
              dataKey="time" 
              name="Время" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 6, fill: "#2563eb" }}
              yAxisId="left"
            />
            {sessions.some(s => s.heartRate) && (
              <Line 
                type="monotone" 
                dataKey="heartRate" 
                name="Пульс" 
                stroke="#ef4444" 
                strokeWidth={2}
                yAxisId="right"
                dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
