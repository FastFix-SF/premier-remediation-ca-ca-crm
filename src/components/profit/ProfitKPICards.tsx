import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Users, Shield, Building } from 'lucide-react';

interface ProfitKPICardsProps {
  profitData: any;
  laborData: any;
  materialsData: any;
  project: any;
}

export const ProfitKPICards: React.FC<ProfitKPICardsProps> = ({
  profitData,
  laborData,
  materialsData,
  project
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

  const getGPColor = (gp: number) => {
    if (gp >= 25) return 'text-green-600';
    if (gp >= 15) return 'text-blue-600';
    if (gp >= 5) return 'text-yellow-600';
    return 'text-destructive';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.total_revenue || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Contract value
          </p>
        </CardContent>
      </Card>

      {/* Base Labor Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Base Labor</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.base_labor_cost || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Wages + Overtime
          </p>
        </CardContent>
      </Card>

      {/* Labor Burden */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Labor Burden</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.labor_burden_cost || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Insurance, Taxes, Benefits
          </p>
        </CardContent>
      </Card>

      {/* Overhead Costs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overhead</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.overhead_cost || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Office, Equipment, Facility
          </p>
        </CardContent>
      </Card>

      {/* Total Labor Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Labor</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.total_labor_cost || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {laborData?.total_hours || 0} total hours
          </p>
          <div className={`text-xs ${getVarianceColor(profitData?.total_labor_cost || 0, project?.budget_labor || 0)}`}>
            {project?.budget_labor > 0 && (
              <>
                Budget: {formatCurrency(project.budget_labor)} 
                ({((profitData?.total_labor_cost || 0) / project.budget_labor * 100 - 100).toFixed(1)}%)
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Materials Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Materials Cost</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(profitData?.total_materials_cost || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {materialsData?.items?.length || 0} line items
          </p>
          <div className={`text-xs ${getVarianceColor(profitData?.total_materials_cost || 0, project?.budget_materials || 0)}`}>
            {project?.budget_materials > 0 && (
              <>
                Budget: {formatCurrency(project.budget_materials)} 
                ({((profitData?.total_materials_cost || 0) / project.budget_materials * 100 - 100).toFixed(1)}%)
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          {(profitData?.gross_profit || 0) >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(profitData?.gross_profit || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {formatCurrency(profitData?.gross_profit || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Revenue - All Costs
          </p>
          <div className={`text-xs ${getGPColor(profitData?.gp_percentage || 0)}`}>
            {(profitData?.gp_percentage || 0).toFixed(1)}% margin
          </div>
        </CardContent>
      </Card>
    </div>
  );
};