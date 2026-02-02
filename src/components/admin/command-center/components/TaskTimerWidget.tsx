import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Pause, Square, Clock, AlertTriangle, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TimerState {
  taskId: string;
  taskTitle: string;
  startedAt: number;
  pausedAt: number | null;
  totalPausedMs: number;
  endTime: string | null;
}

interface TaskTimerWidgetProps {
  onComplete: (taskId: string, elapsedMs: number) => void;
  onDiscard: () => void;
}

const TIMER_STORAGE_KEY = 'cc_task_timer_state';

export const TaskTimerWidget: React.FC<TaskTimerWidgetProps> = ({
  onComplete,
  onDiscard,
}) => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [hasTriggeredTimeUp, setHasTriggeredTimeUp] = useState(false);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved) as TimerState;
        setTimerState(state);
      } catch (e) {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (timerState) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, [timerState]);

  // Calculate elapsed time
  useEffect(() => {
    if (!timerState) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      let pausedTime = timerState.totalPausedMs;
      
      // If currently paused, don't count time since pause
      if (timerState.pausedAt) {
        pausedTime += now - timerState.pausedAt;
      }
      
      const elapsedMs = now - timerState.startedAt - pausedTime;
      setElapsed(Math.max(0, elapsedMs));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  // Check if time is up
  useEffect(() => {
    if (!timerState?.endTime || timerState.pausedAt || hasTriggeredTimeUp) return;

    const endTimeMs = new Date(timerState.endTime).getTime();
    const now = Date.now();
    
    if (now >= endTimeMs) {
      setShowTimeUpDialog(true);
      setHasTriggeredTimeUp(true);
    }
  }, [timerState, elapsed, hasTriggeredTimeUp]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (!timerState?.endTime) return null;
    
    const endTimeMs = new Date(timerState.endTime).getTime();
    const now = Date.now();
    return Math.max(0, endTimeMs - now);
  };

  const getTimerColor = () => {
    const remaining = getRemainingTime();
    if (remaining === null) return 'bg-emerald-500';
    if (remaining <= 0) return 'bg-red-500 animate-pulse';
    if (remaining < 10 * 60 * 1000) return 'bg-yellow-500'; // Less than 10 minutes
    return 'bg-emerald-500';
  };

  const handlePause = () => {
    if (!timerState || timerState.pausedAt) return;
    
    setTimerState({
      ...timerState,
      pausedAt: Date.now(),
    });
  };

  const handleResume = () => {
    if (!timerState || !timerState.pausedAt) return;
    
    const pauseDuration = Date.now() - timerState.pausedAt;
    setTimerState({
      ...timerState,
      pausedAt: null,
      totalPausedMs: timerState.totalPausedMs + pauseDuration,
    });
  };

  const handleComplete = () => {
    if (!timerState) return;
    onComplete(timerState.taskId, elapsed);
    setTimerState(null);
    setHasTriggeredTimeUp(false);
    toast.success('Time logged successfully');
  };

  const handleDiscard = () => {
    setTimerState(null);
    setHasTriggeredTimeUp(false);
    setShowTimeUpDialog(false);
    onDiscard();
  };

  const handleAddTime = (minutes: number) => {
    if (!timerState?.endTime) return;
    
    const currentEnd = new Date(timerState.endTime);
    currentEnd.setMinutes(currentEnd.getMinutes() + minutes);
    
    setTimerState({
      ...timerState,
      endTime: currentEnd.toISOString(),
    });
    
    setShowTimeUpDialog(false);
    setHasTriggeredTimeUp(false);
    toast.success(`Added ${minutes} minutes`);
  };

  // Don't render if no active timer
  if (!timerState) return null;

  const isPaused = !!timerState.pausedAt;
  const remaining = getRemainingTime();

  return (
    <>
      {/* Floating Timer Widget */}
      <div className={`fixed bottom-4 right-4 z-50 ${getTimerColor()} text-white rounded-2xl shadow-2xl p-4 min-w-[300px]`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium opacity-80">
                {isPaused ? 'Paused' : 'Tracking'}
              </span>
            </div>
            <h4 className="font-semibold truncate text-sm">{timerState.taskTitle}</h4>
          </div>
          
          <div className="text-right">
            {/* Elapsed time - smaller */}
            <div className="text-lg font-mono opacity-80">{formatTime(elapsed)}</div>
          </div>
        </div>
        
        {/* Time remaining section - always visible, prominent */}
        <div className="mt-3 pt-3 border-t border-white/20">
          {remaining !== null ? (
            <div className={`flex items-center justify-between p-2 rounded-lg ${
              remaining <= 0 
                ? 'bg-red-900/50' 
                : remaining < 5 * 60 * 1000 
                  ? 'bg-orange-900/50 animate-pulse' 
                  : 'bg-white/10'
            }`}>
              <span className="text-xs opacity-80">Time Left</span>
              <div className="flex items-center gap-2">
                {remaining <= 0 ? (
                  <span className="flex items-center gap-1 text-lg font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    OVERTIME
                  </span>
                ) : (
                  <span className="text-xl font-mono font-bold">{formatTime(remaining)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/10">
              <span className="text-xs opacity-60">No end time set</span>
              <span className="text-xs opacity-60">∞</span>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResume}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePause}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComplete}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Check className="w-4 h-4 mr-1" />
            Complete
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiscard}
            className="bg-white/10 hover:bg-white/20 text-white border-0 h-8 w-8"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Time Up Dialog */}
      <Dialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Time's Up!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-white/70">
              The scheduled time for <strong>{timerState.taskTitle}</strong> has ended.
            </p>
            
            <div className="space-y-2">
              <p className="text-xs text-white/50">Need more time?</p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTime(mins)}
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {mins}m
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTime(60)}
                  className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  1hr
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5"
              >
                Discard
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                <Check className="w-4 h-4 mr-1" />
                Complete Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper function to start a timer from outside the component
export const startTaskTimer = (taskId: string, taskTitle: string, endTime?: string | null) => {
  const state: TimerState = {
    taskId,
    taskTitle,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    endTime: endTime || null,
  };
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('storage'));
};

// Helper to check if timer is active
export const isTimerActive = () => {
  return !!localStorage.getItem(TIMER_STORAGE_KEY);
};

// Helper to get current timer task ID
export const getActiveTimerTaskId = () => {
  const saved = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!saved) return null;
  try {
    const state = JSON.parse(saved) as TimerState;
    return state.taskId;
  } catch {
    return null;
  }
};
