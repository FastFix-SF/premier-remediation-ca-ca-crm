import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/profitMath';

interface VarianceRow {
  category: string;
  estimate: number;
  actual: number;
  variance: number;
  notes?: string;
}

interface VarianceTableProps {
  rows: VarianceRow[];
}

export const VarianceTable: React.FC<VarianceTableProps> = ({ rows }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cost Variance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Estimate
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actual
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Variance
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Variance %
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const variancePct = row.estimate > 0 
                  ? (row.variance / row.estimate) * 100 
                  : 0;
                const isOverBudget = row.variance > 0;
                const isTotal = row.category === 'Total';

                return (
                  <tr 
                    key={index} 
                    className={`border-b last:border-b-0 ${isTotal ? 'font-semibold bg-muted/50' : ''}`}
                  >
                    <td className="py-3 px-4 text-sm">
                      {row.category}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatCurrency(row.estimate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {formatCurrency(row.actual)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${
                      isOverBudget ? 'text-destructive' : 'text-success'
                    }`}>
                      {isOverBudget ? '+' : ''}{formatCurrency(row.variance)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${
                      isOverBudget ? 'text-destructive' : 'text-success'
                    }`}>
                      {isOverBudget ? '+' : ''}{variancePct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
