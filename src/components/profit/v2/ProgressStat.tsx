import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/profitMath';

interface ProgressStatProps {
  label: string;
  estimate: number;
  actual: number;
  unit?: string;
  subMetrics?: Array<{ label: string; value: string }>;
  status: 'on-track' | 'at-risk' | 'over-budget';
}

export const ProgressStat: React.FC<ProgressStatProps> = ({
  label,
  estimate,
  actual,
  unit = '$',
  subMetrics,
  status,
}) => {
  const percentage = estimate > 0 ? (actual / estimate) * 100 : 0;
  const variance = actual - estimate;
  const isOverBudget = variance > 0;

  const statusConfig = {
    'on-track': { label: 'On Track', variant: 'default' as const, color: 'bg-success' },
    'at-risk': { label: 'At Risk', variant: 'secondary' as const, color: 'bg-yellow-500' },
    'over-budget': { label: 'Over Budget', variant: 'destructive' as const, color: 'bg-destructive' },
  };

  const statusStyle = statusConfig[status];

  return (
    <Card className="transition-smooth hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <Badge variant={statusStyle.variant} className="text-xs">
            {statusStyle.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimate</span>
            <span className="font-medium">
              {unit === '$' ? formatCurrency(estimate) : `${estimate.toFixed(1)}${unit}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Actual</span>
            <span className="font-medium">
              {unit === '$' ? formatCurrency(actual) : `${actual.toFixed(1)}${unit}`}
            </span>
          </div>
        </div>

        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2"
        />

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            {percentage.toFixed(1)}% of estimate
          </span>
          <span className={isOverBudget ? 'text-destructive font-medium' : 'text-success font-medium'}>
            {isOverBudget ? '+' : ''}{unit === '$' ? formatCurrency(variance) : `${variance.toFixed(1)}${unit}`}
          </span>
        </div>

        {subMetrics && subMetrics.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            {subMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between text-xs text-muted-foreground">
                <span>{metric.label}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
