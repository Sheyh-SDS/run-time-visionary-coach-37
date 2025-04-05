
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { RunSession } from '@/types';
import { formatTime } from '@/data/mockData';

interface SplitTimesChartProps {
  session: RunSession;
}

const SplitTimesChart: React.FC<SplitTimesChartProps> = ({ session }) => {
  // Calculate average split time
  const avgSplitTime = session.splits.reduce((sum, split) => sum + split, 0) / session.splits.length;
  
  // Process data for chart
  const chartData = session.splits.map((split, index) => ({
    split: `${index + 1}`,
    time: split,
    displayTime: formatTime(split),
    variance: parseFloat(((split - avgSplitTime) / avgSplitTime * 100).toFixed(1))
  }));

  return (
    <Card className="w-full h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Анализ сплитов: {formatTime(session.time)} ({session.distance}м)</CardTitle>
      </CardHeader>
      <CardContent className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
            <XAxis 
              dataKey="split" 
              label={{ value: 'Сплит', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tickFormatter={(value) => formatTime(value)}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Время") return formatTime(Number(value));
                if (name === "Отклонение") return `${value}%`;
                return value;
              }}
              labelFormatter={(label) => `Сплит ${label}`}
            />
            <Legend verticalAlign="bottom" height={36} />
            <Bar 
              dataKey="time" 
              name="Время" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine 
              y={avgSplitTime} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              label={{ value: 'Среднее', position: 'insideTopRight', fontSize: 12 }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SplitTimesChart;
