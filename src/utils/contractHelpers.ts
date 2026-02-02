import { format } from 'date-fns';

export interface MilestonePayment {
  id: string;
  label: string;
  percent: number;
  amount: number;
  timing: string;
  isDeposit?: boolean;
  isFinal?: boolean;
  isEditable?: boolean;
}

export interface PaymentSchedule {
  milestones: MilestonePayment[];
  deposit_percent: number;
  deposit_amount: number;
  material_percent: number;
  material_amount: number;
  progress_percent: number;
  progress_amount: number;
  final_amount: number;
}

/**
 * Calculate deposit amount per CSLB regulations:
 * Deposit cannot exceed $1,000 or 10% of contract price, whichever is less
 */
export function calculateDeposit(contractPrice: number): number {
  if (!contractPrice || contractPrice <= 0) return 0;
  const tenPercent = contractPrice * 0.10;
  return Math.min(1000, tenPercent);
}

/**
 * Calculate complete payment schedule with milestones
 */
export function calculatePaymentSchedule(
  contractPrice: number,
  materialPercent: number = 30,
  progressPercent: number = 0
): PaymentSchedule {
  if (!contractPrice || contractPrice <= 0) {
    return {
      milestones: [],
      deposit_percent: 0,
      deposit_amount: 0,
      material_percent: 0,
      material_amount: 0,
      progress_percent: 0,
      progress_amount: 0,
      final_amount: 0,
    };
  }

  const depositAmount = calculateDeposit(contractPrice);
  const depositPercent = (depositAmount / contractPrice) * 100;
  
  const materialAmount = contractPrice * (materialPercent / 100);
  const progressAmount = contractPrice * (progressPercent / 100);
  
  const finalAmount = contractPrice - depositAmount - materialAmount - progressAmount;

  const milestones: MilestonePayment[] = [
    {
      id: 'deposit',
      label: 'Deposit',
      percent: Number(depositPercent.toFixed(2)),
      amount: Number(depositAmount.toFixed(2)),
      timing: 'Upon signing',
      isDeposit: true,
      isEditable: false,
    },
    {
      id: 'material',
      label: 'Material Payment',
      percent: materialPercent,
      amount: Number(materialAmount.toFixed(2)),
      timing: 'Upon delivery',
      isEditable: true,
    },
  ];

  if (progressPercent > 0) {
    milestones.push({
      id: 'progress',
      label: 'Progress Payment',
      percent: progressPercent,
      amount: Number(progressAmount.toFixed(2)),
      timing: 'Upon milestone',
      isEditable: true,
    });
  }

  milestones.push({
    id: 'final',
    label: 'Final Payment',
    percent: Number(((finalAmount / contractPrice) * 100).toFixed(2)),
    amount: Number(finalAmount.toFixed(2)),
    timing: 'Upon completion',
    isFinal: true,
    isEditable: false,
  });

  return {
    milestones,
    deposit_percent: Number(depositPercent.toFixed(2)),
    deposit_amount: Number(depositAmount.toFixed(2)),
    material_percent: materialPercent,
    material_amount: Number(materialAmount.toFixed(2)),
    progress_percent: progressPercent,
    progress_amount: Number(progressAmount.toFixed(2)),
    final_amount: Number(finalAmount.toFixed(2)),
  };
}

/**
 * Calculate milestones from existing list, updating amounts/percents and final payment
 */
export function recalculateMilestones(
  milestones: MilestonePayment[],
  contractPrice: number,
  isFinalLocked: boolean = true
): MilestonePayment[] {
  if (!contractPrice || contractPrice <= 0) return milestones;

  const updated = [...milestones];
  
  if (isFinalLocked) {
    // Recalculate final as remainder
    const nonFinalTotal = updated
      .filter(m => !m.isFinal)
      .reduce((sum, m) => sum + m.amount, 0);
    
    const finalIndex = updated.findIndex(m => m.isFinal);
    if (finalIndex >= 0) {
      const finalAmount = contractPrice - nonFinalTotal;
      updated[finalIndex] = {
        ...updated[finalIndex],
        amount: Number(finalAmount.toFixed(2)),
        percent: Number(((finalAmount / contractPrice) * 100).toFixed(2)),
      };
    }
  }
  
  return updated;
}

/**
 * Validate milestones for errors
 */
export function validateMilestones(
  milestones: MilestonePayment[],
  contractPrice: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check deposit limit
  const deposit = milestones.find(m => m.isDeposit);
  if (deposit) {
    const limit = Math.min(1000, contractPrice * 0.10);
    if (deposit.amount > limit + 0.01) {
      errors.push(`Deposit ($${deposit.amount.toFixed(2)}) exceeds CSLB limit of $${limit.toFixed(2)}`);
    }
  }

  // Check total equals contract price
  const total = milestones.reduce((sum, m) => sum + m.amount, 0);
  if (Math.abs(total - contractPrice) > 0.01) {
    errors.push(`Payment total ($${total.toFixed(2)}) must equal contract price ($${contractPrice.toFixed(2)})`);
  }

  // Check for negative amounts
  const negativePayments = milestones.filter(m => m.amount < 0);
  if (negativePayments.length > 0) {
    errors.push(`Payment amounts cannot be negative (${negativePayments.map(m => m.label).join(', ')})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment schedule to ensure no negative final payment and total doesn't exceed 100%
 */
export function validatePaymentSchedule(payments: PaymentSchedule): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (payments.final_amount < 0) {
    errors.push('Final payment cannot be negative. Please adjust the payment percentages.');
  }

  const totalPercent = 
    payments.deposit_percent + 
    payments.material_percent + 
    payments.progress_percent;

  if (totalPercent > 100) {
    errors.push(`Total payment percentages (${totalPercent.toFixed(1)}%) exceed 100%.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate agreement number in format: PROP-{proposalId}-{yyyyMMdd}
 */
export function generateAgreementNumber(proposalId: string): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  // Take first 8 characters of UUID for brevity
  const shortId = proposalId.substring(0, 8);
  return `PROP-${shortId}-${dateStr}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
