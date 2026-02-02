import React from 'react';
import { Check, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  name: string;
  description?: string;
  completed: boolean;
  current?: boolean;
  timestamp?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  orientation = 'horizontal',
  size = 'sm'
}) => {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <div key={step.name} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center flex-shrink-0",
                  size === 'sm' ? 'w-6 h-6' : 'w-8 h-8',
                  step.completed
                    ? "bg-green-500 text-white"
                    : step.current
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {step.completed ? (
                  <Check className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
                ) : step.current ? (
                  <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
                ) : (
                  <Circle className={size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} />
                )}
              </div>
              {idx < steps.length - 1 && (
                <div 
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    step.completed ? "bg-green-500" : "bg-border"
                  )} 
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-4", idx === steps.length - 1 && "pb-0")}>
              <div className={cn(
                "font-medium leading-none",
                size === 'sm' ? 'text-xs' : 'text-sm',
                step.current ? "text-foreground" : step.completed ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.name}
              </div>
              {step.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
              )}
              {step.timestamp && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.timestamp}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, idx) => (
        <React.Fragment key={step.name}>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn(
                "rounded-full flex items-center justify-center",
                size === 'sm' ? 'w-6 h-6' : 'w-8 h-8',
                step.completed
                  ? "bg-green-500 text-white"
                  : step.current
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
              ) : step.current ? (
                <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
              ) : (
                <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{idx + 1}</span>
              )}
            </div>
            <span className={cn(
              "text-center leading-tight",
              size === 'sm' ? 'text-[10px]' : 'text-xs',
              step.current ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {step.name}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div 
              className={cn(
                "h-0.5 flex-1 max-w-[40px] mt-[-16px]",
                step.completed ? "bg-green-500" : "bg-border"
              )} 
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
