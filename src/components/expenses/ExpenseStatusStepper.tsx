import { cn } from '@/lib/utils';
import { Check, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ExpenseStatusStepperProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const EXPENSE_STATUSES = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'paid', label: 'Paid', icon: Check },
  { key: 'rejected', label: 'Rejected', icon: AlertCircle },
];

export const ExpenseStatusStepper = ({ currentStatus, onStatusChange }: ExpenseStatusStepperProps) => {
  const currentIndex = EXPENSE_STATUSES.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
      {EXPENSE_STATUSES.map((status, index) => {
        const Icon = status.icon;
        const isActive = status.key === currentStatus;
        const isCompleted = index < currentIndex && currentStatus !== 'rejected';
        const isRejected = status.key === 'rejected' && currentStatus === 'rejected';

        return (
          <button
            key={status.key}
            onClick={() => onStatusChange(status.key)}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all duration-200',
              isActive && 'bg-primary/20',
              isRejected && 'bg-destructive/20',
              !isActive && !isRejected && 'hover:bg-muted/50'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-green-500 text-white',
                isRejected && 'bg-destructive text-destructive-foreground',
                !isActive && !isCompleted && !isRejected && 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                isActive && 'text-primary',
                isCompleted && 'text-green-500',
                isRejected && 'text-destructive',
                !isActive && !isCompleted && !isRejected && 'text-muted-foreground'
              )}
            >
              {status.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
