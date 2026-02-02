export interface ProfitInputs {
  projectId: string;
  quoteId?: string;              // Link to quote_requests table
  contractValue: number;         // Revenue/contract amount
  paymentSchedule?: any;         // Payment schedule from proposal
  targetMarginPct?: number;      // Target gross margin (e.g., 0.20 for 20%)
  est: {
    laborHours?: number;         // Estimated labor hours
    laborCost: number;           // Estimated base labor cost
    materialsCost: number;       // Estimated materials cost
    overheadCost: number;        // Estimated overhead cost
  };
}

export interface Actuals {
  period: { start: string; end: string };
  labor: {
    regHours: number;
    otHours: number;
    cost: number;              // Base labor cost
    burdenCost?: number;       // Workers comp, insurance, taxes, benefits
    employees?: number;
  };
  materials: {
    items: number;
    cost: number;
    vendors?: number;
  };
  overhead: {
    cost: number;
  };
}

export interface ProfitCalculation {
  estTotal: number;
  estGP: number;
  estMargin: number;
  actTotal: number;
  actGP: number;
  actMargin: number;
  variance: {
    labor: number;
    materials: number;
    overhead: number;
    total: number;
    marginPctDelta: number;
  };
}

export interface StatusBadge {
  label: string;
  tone: 'destructive' | 'warning' | 'success';
}
