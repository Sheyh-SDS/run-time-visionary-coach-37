
import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { TopNProbability, PositionProbability } from '@/types';

interface ProbabilityTableProps {
  probabilities: (TopNProbability | PositionProbability)[];
  type: 'position' | 'topn';
}

const ProbabilityTable: React.FC<ProbabilityTableProps> = ({ probabilities, type }) => {
  if (!probabilities.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Нет данных о вероятностях
        </CardContent>
      </Card>
    );
  }

  // Format position description
  const formatPositionDescription = (
    item: TopNProbability | PositionProbability
  ): string => {
    if (type === 'position') {
      return `Место ${(item as PositionProbability).position}`;
    } else {
      const topN = (item as TopNProbability).topN;
      if (topN.length === 1) {
        return `Место ${topN[0]}`;
      } else if (topN.length === 2) {
        return `Места ${topN[0]} или ${topN[1]}`;
      } else {
        const last = topN[topN.length - 1];
        const rest = topN.slice(0, -1).join(', ');
        return `Места ${rest} или ${last}`;
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Позиция</TableHead>
              <TableHead className="text-right">Вероятность</TableHead>
              <TableHead className="text-right">Процент</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {probabilities.map((item, index) => {
              // Get a unique key
              const key = type === 'position' 
                ? `pos-${(item as PositionProbability).position}` 
                : `topn-${(item as TopNProbability).topN.join('-')}`;
              
              // Get probability
              const probability = 'probability' in item ? item.probability : 0;
              
              return (
                <TableRow key={key}>
                  <TableCell>{formatPositionDescription(item)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {probability.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(probability * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProbabilityTable;
