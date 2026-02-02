import { cn } from '@/lib/utils';
import { Download, ClipboardCheck, CheckCircle } from 'lucide-react';

interface PaymentStatusStepperProps {
  currentStatus: string;
  onStatusChange?: (status: string) => void;
}

const PAYMENT_STATUSES = [
  { key: 'received', label: 'Received', icon: Download },
  { key: 'in_review', label: 'In Review', icon: ClipboardCheck },
  { key: 'verified', label: 'Verified', icon: CheckCircle },
];

export function PaymentStatusStepper({ currentStatus, onStatusChange }: PaymentStatusStepperProps) {
  const currentIndex = PAYMENT_STATUSES.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex items-center gap-2">
      {PAYMENT_STATUSES.map((status, index) => {
        const Icon = status.icon;
        const isActive = status.key === currentStatus;
        const isPast = index < currentIndex;
        
        return (
          <div key={status.key} className="flex items-center">
            <button
              onClick={() => onStatusChange?.(status.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isActive && "bg-primary text-primary-foreground",
                isPast && "bg-primary/20 text-primary",
                !isActive && !isPast && "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{status.label}</span>
            </button>
            {index < PAYMENT_STATUSES.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                index < currentIndex ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
