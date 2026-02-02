import { CheckCircle, Circle, PauseCircle, Clock, FileCheck, DollarSign, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChangeOrder } from '@/hooks/useChangeOrders';

interface COStatusStepperProps {
  currentStatus: ChangeOrder['status'];
  onStatusChange: (status: ChangeOrder['status']) => void;
}

const STEPS = [
  { key: 'on_hold', label: 'On Hold', icon: PauseCircle },
  { key: 'open', label: 'Open', icon: Circle },
  { key: 'pending_approval', label: 'Pending Ap...', icon: Clock },
  { key: 'unbilled_approved', label: 'Unbilled/Ap...', icon: FileCheck },
  { key: 'billed', label: 'Billed', icon: DollarSign },
] as const;

const STATUS_ORDER = ['on_hold', 'open', 'pending_approval', 'unbilled_approved', 'billed', 'denied'];

export function COStatusStepper({ currentStatus, onStatusChange }: COStatusStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isDenied = currentStatus === 'denied';

  return (
    <div className="flex items-center justify-between py-4 px-2 bg-muted/30 rounded-lg">
      {STEPS.map((step, index) => {
        const isActive = step.key === currentStatus;
        const isPast = STATUS_ORDER.indexOf(step.key) < currentIndex && !isDenied;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => onStatusChange(step.key)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive && "scale-110",
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                isActive && "bg-primary border-primary text-primary-foreground",
                isPast && "bg-green-500 border-green-500 text-white",
                !isActive && !isPast && "border-muted-foreground/30 text-muted-foreground/50"
              )}>
                {isPast ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary",
                isPast && "text-green-600",
                !isActive && !isPast && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>
            
            {index < STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                isPast ? "bg-green-500" : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        );
      })}
      
      {/* Denied button separate */}
      <button
        onClick={() => onStatusChange('denied')}
        className={cn(
          "flex flex-col items-center gap-1 ml-4 transition-all",
          isDenied && "scale-110",
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
          isDenied ? "bg-red-500 border-red-500 text-white" : "border-red-300 text-red-300 hover:border-red-500 hover:text-red-500"
        )}>
          <XCircle className="w-4 h-4" />
        </div>
        <span className={cn(
          "text-[10px] font-medium",
          isDenied ? "text-red-600" : "text-red-300"
        )}>
          Denied
        </span>
      </button>
    </div>
  );
}
