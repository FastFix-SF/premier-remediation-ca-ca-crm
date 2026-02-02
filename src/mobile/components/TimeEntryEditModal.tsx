import React, { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  break_time_minutes: number;
  total_hours: number | null;
}

interface TimeEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry;
  onSave: () => void;
}

export const TimeEntryEditModal: React.FC<TimeEntryEditModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Extract time from datetime string
  const getTimeValue = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return format(date, 'HH:mm');
  };
  
  const [clockIn, setClockIn] = useState(getTimeValue(entry.clock_in));
  const [clockOut, setClockOut] = useState(getTimeValue(entry.clock_out));
  const [breakMinutes, setBreakMinutes] = useState(entry.break_time_minutes.toString());

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse the original date to preserve it
      const originalDate = new Date(entry.clock_in);
      const dateStr = format(originalDate, 'yyyy-MM-dd');
      
      // Build new clock_in datetime
      const newClockIn = new Date(`${dateStr}T${clockIn}:00`);
      
      // Build new clock_out datetime if provided
      let newClockOut = null;
      if (clockOut) {
        newClockOut = new Date(`${dateStr}T${clockOut}:00`);
        // If clock out is before clock in, assume it's the next day
        if (newClockOut < newClockIn) {
          newClockOut.setDate(newClockOut.getDate() + 1);
        }
      }
      
      // Calculate total hours
      let totalHours = null;
      if (newClockOut) {
        const diffMs = newClockOut.getTime() - newClockIn.getTime();
        const breakMs = parseInt(breakMinutes || '0') * 60 * 1000;
        totalHours = Math.max(0, (diffMs - breakMs) / (1000 * 60 * 60));
      }
      
      const { error } = await supabase
        .from('time_clock')
        .update({
          clock_in: newClockIn.toISOString(),
          clock_out: newClockOut?.toISOString() || null,
          break_time_minutes: parseInt(breakMinutes || '0'),
          total_hours: totalHours
        })
        .eq('id', entry.id);
      
      if (error) throw error;
      
      toast({
        title: 'Time entry updated',
        description: 'The time entry has been successfully updated.'
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to update time entry.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clock-in">Clock In</Label>
            <Input
              id="clock-in"
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="break">Break (minutes)</Label>
            <Input
              id="break"
              type="number"
              min="0"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clock-out">Clock Out</Label>
            <Input
              id="clock-out"
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              placeholder="Leave empty if still active"
            />
            <p className="text-xs text-muted-foreground">Leave empty if shift is still active</p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
