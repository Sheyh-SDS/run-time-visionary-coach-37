
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface AthletePerformanceData {
  id: string;
  color: string;
  name: string;
  number: number;
  data: {
    race: string;
    position: number;
  }[];
}

interface AthletePerformanceChartProps {
  athletes: AthletePerformanceData[];
}

const AthletePerformanceChart: React.FC<AthletePerformanceChartProps> = ({ athletes }) => {
  // Transform data for the chart
  const transformedData = athletes[0]?.data.map((_, index) => {
    const raceData: Record<string, any> = {
      race: athletes[0].data[index].race
    };
    
    // Add each athlete's position for this race
    athletes.forEach(athlete => {
      raceData[`athlete${athlete.number}`] = athlete.data[index].position;
      raceData[`color${athlete.number}`] = athlete.color;
      raceData[`name${athlete.number}`] = athlete.name;
    });
    
    return raceData;
  }) || [];

  // Custom tooltip to show athlete names and positions
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const athleteNumber = entry.dataKey.replace('athlete', '');
              const color = entry.payload[`color${athleteNumber}`];
              const name = entry.payload[`name${athleteNumber}`];
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span>{name}: {entry.value} место</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend that shows colored squares with athlete numbers
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center mt-2 gap-4">
        {athletes.map((athlete) => (
          <div key={athlete.id} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: athlete.color }}
            ></div>
            <span className="text-sm">
              №{athlete.number} {athlete.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Y-axis is inverted for positions (1 is best, 6 is worst)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={transformedData}
        margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="race" 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis 
          domain={[1, 6]}
          reversed
          ticks={[1, 2, 3, 4, 5, 6]}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
          label={{ 
            value: 'Место', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle' }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        
        {athletes.map((athlete) => (
          <Line
            key={athlete.id}
            type="monotone"
            dataKey={`athlete${athlete.number}`}
            stroke={athlete.color}
            strokeWidth={2}
            dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 7 }}
          />
        ))}
        
        <ReferenceLine y={3.5} stroke="#718096" strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AthletePerformanceChart;
