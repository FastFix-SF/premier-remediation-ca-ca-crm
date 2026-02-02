import { ProfitInputs, Actuals, ProfitCalculation, StatusBadge } from "@/types/profitability";

/**
 * Compute all profit metrics from inputs and actuals
 */
export function compute(inputs: ProfitInputs, actuals: Actuals): ProfitCalculation {
  // Estimate totals
  const estTotal = 
    inputs.est.laborCost + 
    inputs.est.materialsCost + 
    inputs.est.overheadCost;
  const estGP = inputs.contractValue - estTotal;
  const estMargin = inputs.contractValue > 0 ? estGP / inputs.contractValue : 0;

  // Actual totals
  const actLabor = actuals.labor.cost + (actuals.labor.burdenCost ?? 0);
  const actTotal = actLabor + actuals.materials.cost + actuals.overhead.cost;
  const actGP = inputs.contractValue - actTotal;
  const actMargin = inputs.contractValue > 0 ? actGP / inputs.contractValue : 0;

  // Variances (positive = over budget, negative = under budget)
  const variance = {
    labor: actLabor - inputs.est.laborCost,
    materials: actuals.materials.cost - inputs.est.materialsCost,
    overhead: actuals.overhead.cost - inputs.est.overheadCost,
    total: actTotal - estTotal,
    marginPctDelta: (actMargin - estMargin) * 100, // % points difference
  };

  return {
    estTotal,
    estGP,
    estMargin,
    actTotal,
    actGP,
    actMargin,
    variance,
  };
}

/**
 * Determine status badge based on margin variance
 */
export function statusBadge(marginPctDelta: number): StatusBadge {
  if (marginPctDelta <= -5) {
    return { label: "Over Budget", tone: "destructive" };
  }
  if (marginPctDelta <= -2) {
    return { label: "At Risk", tone: "warning" };
  }
  return { label: "On Track", tone: "success" };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}
