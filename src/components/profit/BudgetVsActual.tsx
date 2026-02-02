import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetVsActualProps {
  project: any;
  actualLabor: number;
  actualMaterials: number;
}

export const BudgetVsActual: React.FC<BudgetVsActualProps> = ({
  project,
  actualLabor,
  actualMaterials
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (actual: number, budget: number) => {
    if (budget === 0) return 'text-muted-foreground';
    const variance = ((actual - budget) / budget) * 100;
    if (variance > 10) return 'text-destructive';
    if (variance > 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVarianceIcon = (actual: number, budget: number) => {
    if (budget === 0) return null;
    const variance = ((actual - budget) / budget) * 100;
    return variance > 0 ? (
      <TrendingUp className="h-4 w-4 text-destructive" />
    ) : (
      <TrendingDown className="h-4 w-4 text-green-600" />
    );
  };

  const calculateProgress = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  const laborBudget = project?.budget_labor || 0;
  const materialsBudget = project?.budget_materials || 0;
  const laborVariance = laborBudget > 0 ? ((actualLabor - laborBudget) / laborBudget) * 100 : 0;
  const materialsVariance = materialsBudget > 0 ? ((actualMaterials - materialsBudget) / materialsBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Budget vs Actual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Labor Budget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Labor</span>
            {getVarianceIcon(actualLabor, laborBudget)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget</span>
              <span>{formatCurrency(laborBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual</span>
              <span className="font-medium">{formatCurrency(actualLabor)}</span>
            </div>
            <Progress 
              value={calculateProgress(actualLabor, laborBudget)} 
              className="h-2"
            />
            <div className={`text-xs ${getVarianceColor(actualLabor, laborBudget)}`}>
              {laborBudget > 0 ? (
                <>
                  {laborVariance >= 0 ? '+' : ''}{laborVariance.toFixed(1)}% variance
                </>
              ) : (
                'No budget set'
              )}
            </div>
          </div>
        </div>

        {/* Materials Budget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Materials</span>
            {getVarianceIcon(actualMaterials, materialsBudget)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget</span>
              <span>{formatCurrency(materialsBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual</span>
              <span className="font-medium">{formatCurrency(actualMaterials)}</span>
            </div>
            <Progress 
              value={calculateProgress(actualMaterials, materialsBudget)} 
              className="h-2"
            />
            <div className={`text-xs ${getVarianceColor(actualMaterials, materialsBudget)}`}>
              {materialsBudget > 0 ? (
                <>
                  {materialsVariance >= 0 ? '+' : ''}{materialsVariance.toFixed(1)}% variance
                </>
              ) : (
                'No budget set'
              )}
            </div>
          </div>
        </div>

        {/* Total Budget */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget</span>
              <span>{formatCurrency(laborBudget + materialsBudget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual</span>
              <span className="font-medium">{formatCurrency(actualLabor + actualMaterials)}</span>
            </div>
            <Progress 
              value={calculateProgress(actualLabor + actualMaterials, laborBudget + materialsBudget)} 
              className="h-2"
            />
            <div className={`text-xs ${getVarianceColor(actualLabor + actualMaterials, laborBudget + materialsBudget)}`}>
              {(laborBudget + materialsBudget) > 0 ? (
                <>
                  {(((actualLabor + actualMaterials) - (laborBudget + materialsBudget)) / (laborBudget + materialsBudget) * 100) >= 0 ? '+' : ''}
                  {(((actualLabor + actualMaterials) - (laborBudget + materialsBudget)) / (laborBudget + materialsBudget) * 100).toFixed(1)}% variance
                </>
              ) : (
                'No budget set'
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};