import { cn } from '@/lib/utils';
import { FileEdit, FileCheck, Send, Package, CheckCircle, Lock, XCircle } from 'lucide-react';

interface POStatusStepperProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const PO_STATUSES = [
  { key: 'draft', label: 'Draft', icon: FileEdit },
  { key: 'pricing_requested', label: 'Pricing Req.', icon: FileCheck },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'received', label: 'Received', icon: Package },
  { key: 'closed', label: 'Closed', icon: Lock },
];

export const POStatusStepper = ({ currentStatus, onStatusChange }: POStatusStepperProps) => {
  const currentIndex = PO_STATUSES.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center justify-between gap-1 p-2 bg-muted/30 rounded-lg overflow-x-auto">
      {PO_STATUSES.map((status, index) => {
        const Icon = status.icon;
        const isActive = status.key === currentStatus;
        const isCompleted = index < currentIndex;

        return (
          <button
            key={status.key}
            onClick={() => onStatusChange(status.key)}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 py-1.5 px-1 rounded-lg transition-all duration-200 min-w-[60px]',
              isActive && 'bg-primary/20',
              !isActive && 'hover:bg-muted/50'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-green-500 text-white',
                !isActive && !isCompleted && 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span
              className={cn(
                'text-[10px] font-medium text-center leading-tight',
                isActive && 'text-primary',
                isCompleted && 'text-green-500',
                !isActive && !isCompleted && 'text-muted-foreground'
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
