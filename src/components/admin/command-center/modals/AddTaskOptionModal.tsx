import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AddTaskOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onScheduleExisting: () => void;
  selectedTime: { date: Date; hour: number } | null;
}

export const AddTaskOptionModal: React.FC<AddTaskOptionModalProps> = ({
  isOpen,
  onClose,
  onCreateNew,
  onScheduleExisting,
  selectedTime,
}) => {
  const formatTimeSlot = () => {
    if (!selectedTime) return '';
    const date = selectedTime.date;
    const hour = selectedTime.hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${format(date, 'EEEE, MMMM d')} at ${hour12}:00 ${ampm}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Add Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedTime && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-center">
              <p className="text-sm text-indigo-300">
                <Calendar className="w-4 h-4 inline-block mr-2" />
                {formatTimeSlot()}
              </p>
            </div>
          )}

          <p className="text-white/60 text-sm text-center">
            What would you like to add to this time slot?
          </p>

          <div className="space-y-3">
            {/* Create New Task Option */}
            <Button
              onClick={onCreateNew}
              className="w-full h-auto py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 flex flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Create New Task</span>
              </div>
              <span className="text-xs text-white/70 pl-7">
                Start fresh with a new task
              </span>
            </Button>

            {/* Schedule Existing Task Option */}
            <Button
              onClick={onScheduleExisting}
              variant="outline"
              className="w-full h-auto py-4 bg-white/5 border-white/10 text-white hover:bg-white/10 flex flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Schedule Existing Task</span>
              </div>
              <span className="text-xs text-white/60 pl-7">
                Pick from your unscheduled tasks
              </span>
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
