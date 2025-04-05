
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PerformanceHistory, Athlete } from '@/types';

interface PerformanceParamsChartProps {
  data: PerformanceHistory[];
  athlete: Athlete;
}

const PerformanceParamsChart: React.FC<PerformanceParamsChartProps> = ({ data, athlete }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Динамика характеристик</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[340px]">
          <div className="text-muted-foreground">Нет данных о характеристиках спортсмена</div>
        </CardContent>
      </Card>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format dates for display
  const chartData = sortedData.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <Card className="w-full h-[400px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Динамика характеристик: {athlete.name}</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 25, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
              height={40}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              yAxisId="time" 
              label={{ value: 'Время (с)', angle: -90, position: 'insideLeft', offset: 0 }}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <YAxis 
              yAxisId="speed" 
              orientation="right" 
              label={{ value: 'Скорость (м/с)', angle: 90, position: 'insideRight', offset: 0 }}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Время реакции") return `${value} с`;
                if (name === "Макс. скорость" || name === "Ускорение" || name === "Замедление") return `${value} м/с²`;
                return value;
              }}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Legend verticalAlign="bottom" height={36} />
            <Line 
              type="monotone" 
              dataKey="reactionTime" 
              name="Время реакции" 
              stroke="#8884d8" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              yAxisId="time"
            />
            <Line 
              type="monotone" 
              dataKey="acceleration" 
              name="Ускорение" 
              stroke="#82ca9d" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              yAxisId="speed"
            />
            <Line 
              type="monotone" 
              dataKey="maxSpeed" 
              name="Макс. скорость" 
              stroke="#ff7300" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              yAxisId="speed" 
            />
            <Line 
              type="monotone" 
              dataKey="deceleration" 
              name="Замедление" 
              stroke="#0088fe" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              yAxisId="speed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceParamsChart;
