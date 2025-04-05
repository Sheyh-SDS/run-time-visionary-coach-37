
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProbabilityAnalysis } from '@/types';
import { formatTime } from '@/data/mockData';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from './ErrorBoundary';

interface ProbabilityChartProps {
  analysis: ProbabilityAnalysis;
}

const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ analysis }) => {
  // Validate input data
  if (!analysis || !analysis.factors || !Array.isArray(analysis.factors) || analysis.factors.length === 0) {
    return (
      <Card className="w-full h-[350px]">
        <CardContent className="h-full flex items-center justify-center p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Недостаточно данных для построения графика вероятностей
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Process data for chart
  const chartData = analysis.factors.map(factor => ({
    name: factor.name,
    impact: factor.impact,
    // Color logic: positive impact = green, negative impact = red, neutral = gray
    color: factor.impact > 0.3 ? '#22c55e' : factor.impact > 0 ? '#3b82f6' : factor.impact > -0.3 ? '#f97316' : '#ef4444'
  }));

  // Sort by impact for better visualization
  chartData.sort((a, b) => b.impact - a.impact);

  return (
    <ErrorBoundary>
      <Card className="w-full h-[350px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Анализ факторов влияния: {formatTime(analysis.targetTime)}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Вероятность достижения: {Math.round(analysis.probability * 100)}%
          </div>
        </CardHeader>
        <CardContent className="h-[290px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#eaeaea" />
              <XAxis 
                type="number" 
                domain={[-1, 1]}
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value) => `Влияние: ${Math.round(Number(value) * 100)}%`}
              />
              <Bar 
                dataKey="impact" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default ProbabilityChart;
