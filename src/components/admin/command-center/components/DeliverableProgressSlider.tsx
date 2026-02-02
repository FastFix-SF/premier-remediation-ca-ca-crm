import React from 'react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliverableProgressSliderProps {
  deliverableId: string;
  initialProgress: number;
  onProgressChange?: (newProgress: number) => void;
}

export function DeliverableProgressSlider({
  deliverableId,
  initialProgress,
  onProgressChange,
}: DeliverableProgressSliderProps) {
  const [progress, setProgress] = React.useState(initialProgress);
  const [saving, setSaving] = React.useState(false);

  const handleProgressChange = async (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);

    // Determine status based on progress
    let status: 'pending' | 'in_progress' | 'completed' = 'pending';
    let completedAt: string | null = null;

    if (newProgress === 0) {
      status = 'pending';
    } else if (newProgress === 100) {
      status = 'completed';
      completedAt = new Date().toISOString();
    } else {
      status = 'in_progress';
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_deliverables')
        .update({
          progress_percent: newProgress,
          status,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);

      if (error) throw error;

      if (newProgress === 100) {
        toast.success('🎉 Deliverable completed!', {
          description: 'Great job finishing this item!',
        });
      }

      onProgressChange?.(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
      setProgress(initialProgress);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <Slider
        value={[progress]}
        onValueChange={handleProgressChange}
        max={100}
        step={5}
        className="flex-1"
        disabled={saving}
      />
      <span className={`text-xs font-medium min-w-[40px] text-right ${
        progress === 100 ? 'text-green-400' : progress > 0 ? 'text-blue-400' : 'text-muted-foreground'
      }`}>
        {progress}%
      </span>
    </div>
  );
}
