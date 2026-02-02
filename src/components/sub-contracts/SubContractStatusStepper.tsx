import { cn } from "@/lib/utils";
import { FileText, FileCheck, Send, CheckCircle2, Lock } from "lucide-react";

interface SubContractStatusStepperProps {
  status: string;
  onStatusChange?: (status: string) => void;
}

const steps = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'committed', label: 'Committed', icon: FileCheck },
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'closed', label: 'Closed', icon: Lock },
];

export function SubContractStatusStepper({ status, onStatusChange }: SubContractStatusStepperProps) {
  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => onStatusChange?.(step.key)}
              className={cn(
                "flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg transition-all",
                onStatusChange && "hover:bg-muted cursor-pointer",
                !onStatusChange && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-primary border-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium",
                isCurrent && "text-primary",
                isCompleted && "text-green-600",
                !isCompleted && !isCurrent && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-4 sm:w-8 h-0.5 mx-0.5",
                index < currentIndex ? "bg-green-500" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
