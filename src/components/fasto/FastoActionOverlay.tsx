import React, { useState, useEffect } from 'react';
import { FastoOrb } from './FastoOrb';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, AlertCircle, MousePointer2, Keyboard, Navigation } from 'lucide-react';

interface VisualStep {
  action: string;
  step: string;
  status?: 'running' | 'success' | 'error';
  element?: string;
}

/**
 * Fasto Action Overlay
 * Shows real-time visual feedback of what Fasto is doing
 * Displays when Fasto is performing UI automation
 */
export const FastoActionOverlay: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<VisualStep | null>(null);
  const [stepHistory, setStepHistory] = useState<VisualStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleVisualStep = (event: Event) => {
      const customEvent = event as CustomEvent<VisualStep>;
      const step = customEvent.detail;
      
      console.log('[FastoOverlay] Received step:', step);
      
      setCurrentStep(step);
      setIsVisible(true);
      
      // Add to history (keep last 5)
      setStepHistory(prev => [...prev.slice(-4), step]);
      
      // Auto-hide after completion or error
      if (step.status === 'success' || step.status === 'error') {
        setTimeout(() => {
          setIsVisible(false);
          setCurrentStep(null);
          setStepHistory([]);
        }, 2000);
      }
    };

    const handleActionComplete = () => {
      // Fade out after a short delay
      setTimeout(() => {
        setIsVisible(false);
        setCurrentStep(null);
        setStepHistory([]);
      }, 1500);
    };

    window.addEventListener('fasto-visual-step', handleVisualStep);
    window.addEventListener('fasto-action-complete', handleActionComplete);
    
    return () => {
      window.removeEventListener('fasto-visual-step', handleVisualStep);
      window.removeEventListener('fasto-action-complete', handleActionComplete);
    };
  }, []);

  const getStepIcon = (step: VisualStep) => {
    if (step.status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (step.status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
    
    const action = step.action.toLowerCase();
    if (action.includes('click')) return <MousePointer2 className="h-4 w-4 text-primary animate-bounce" />;
    if (action.includes('type') || action.includes('fill')) return <Keyboard className="h-4 w-4 text-primary animate-pulse" />;
    if (action.includes('navigate')) return <Navigation className="h-4 w-4 text-primary" />;
    
    return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  };

  if (!isVisible || !currentStep) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 right-4 z-[9999] bg-card/95 backdrop-blur-lg border shadow-xl rounded-xl overflow-hidden",
        "animate-in slide-in-from-top-2 duration-300",
        "max-w-sm w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/50">
        <FastoOrb size="sm" isActive className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Fasto is working...</p>
          <p className="text-xs text-muted-foreground truncate">
            Performing UI automation
          </p>
        </div>
      </div>
      
      {/* Current Step */}
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {getStepIcon(currentStep)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">
              {currentStep.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStep.step}
            </p>
            {currentStep.element && (
              <p className="text-xs text-muted-foreground/70 font-mono mt-1 truncate">
                → {currentStep.element}
              </p>
            )}
          </div>
        </div>
        
        {/* Step History */}
        {stepHistory.length > 1 && (
          <div className="mt-3 pt-2 border-t space-y-1.5">
            {stepHistory.slice(0, -1).map((step, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-xs text-muted-foreground/70"
              >
                <CheckCircle2 className="h-3 w-3 text-green-500/70 shrink-0" />
                <span className="truncate">{step.step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-muted overflow-hidden">
        <div 
          className={cn(
            "h-full bg-primary transition-all duration-300",
            currentStep.status === 'success' ? "w-full bg-green-500" :
            currentStep.status === 'error' ? "w-full bg-destructive" :
            "w-2/3 animate-pulse"
          )}
        />
      </div>
    </div>
  );
};

export default FastoActionOverlay;
