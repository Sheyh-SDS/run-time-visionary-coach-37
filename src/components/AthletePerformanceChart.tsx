
import React from 'react';
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
        <div className="bg-white border border-gray-200 rounded-md shadow-md p-3 text-sm">
          <p className="font-medium mb-2 text-gray-800">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const athleteNumber = entry.dataKey.replace('athlete', '');
              const color = entry.payload[`color${athleteNumber}`];
              const name = entry.payload[`name${athleteNumber}`];
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-gray-700">{name}: {entry.value} место</span>
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
            <span className="text-sm text-gray-700">
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
        margin={{ top: 10, right: 30, left: 10, bottom: 35 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis 
          dataKey="race" 
          tick={{ fontSize: 12, fill: "#4b5563" }}
          axisLine={{ stroke: '#9ca3af' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis 
          domain={[1, 6]}
          reversed
          ticks={[1, 2, 3, 4, 5, 6]}
          tick={{ fontSize: 12, fill: "#4b5563" }}
          axisLine={{ stroke: '#9ca3af' }}
          tickLine={{ stroke: '#9ca3af' }}
          label={{ 
            value: 'Место', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#4b5563', fontSize: 12, fontWeight: 500 }
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
            strokeWidth={2.5}
            dot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: athlete.color }}
            activeDot={{ r: 7, strokeWidth: 2 }}
          />
        ))}
        
        <ReferenceLine y={3.5} stroke="#94a3b8" strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AthletePerformanceChart;
