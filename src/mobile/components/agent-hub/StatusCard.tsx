import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusStep {
  name: string;
  completed: boolean;
  current?: boolean;
}

interface StatusCardProps {
  id: string;
  title: string;
  status: string;
  statusColor?: 'default' | 'warning' | 'success' | 'destructive';
  steps?: StatusStep[];
  metadata?: Record<string, string>;
  onAction?: () => void;
  actionLabel?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  id,
  title,
  status,
  statusColor = 'default',
  steps,
  metadata,
  onAction,
  actionLabel = 'View Details'
}) => {
  const statusColorClasses = {
    default: 'bg-muted text-muted-foreground',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    success: 'bg-green-500/10 text-green-600 border-green-500/30',
    destructive: 'bg-destructive/10 text-destructive border-destructive/30'
  };

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-muted-foreground">{id}</div>
            <h4 className="text-sm font-medium leading-tight">{title}</h4>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] font-medium whitespace-nowrap", statusColorClasses[statusColor])}
          >
            {status}
          </Badge>
        </div>

        {/* Progress Steps */}
        {steps && steps.length > 0 && (
          <div className="flex items-center justify-between gap-1">
            {steps.map((step, idx) => (
              <React.Fragment key={step.name}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      step.completed
                        ? "bg-green-500 text-white"
                        : step.current
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : step.current ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] text-center leading-tight",
                    step.current ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-[-12px]" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="text-[10px]">
                <span className="text-muted-foreground">{key}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {onAction && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAction}
            className="w-full h-8 text-xs justify-between hover:bg-primary/5"
          >
            {actionLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
