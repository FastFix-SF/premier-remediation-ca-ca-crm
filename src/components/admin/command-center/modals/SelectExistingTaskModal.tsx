import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Calendar, CheckSquare, Clock } from 'lucide-react';
import { format, setHours } from 'date-fns';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  owner_name?: string;
  project_name?: string;
}

interface SelectExistingTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tasks: Task[];
  selectedTime: { date: Date; hour: number } | null;
}

export const SelectExistingTaskModal: React.FC<SelectExistingTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tasks,
  selectedTime,
}) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter to only unscheduled tasks (no due_date or due_date at midnight)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => {
      // Include tasks with no due_date
      if (!task.due_date) return true;
      // Include tasks with due_date at midnight (00:00 = unscheduled for day)
      const taskDate = new Date(task.due_date);
      return taskDate.getHours() === 0 && taskDate.getMinutes() === 0;
    }).filter(task => 
      task.status !== 'DONE' && 
      task.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'P1': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'P2': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatTimeSlot = () => {
    if (!selectedTime) return '';
    const date = selectedTime.date;
    const hour = selectedTime.hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${format(date, 'MMM d')} at ${hour12}:00 ${ampm}`;
  };

  const handleSelectTask = async (task: Task) => {
    if (!selectedTime) return;

    setLoading(true);
    try {
      // Create the new due_date with the selected hour
      const newDueDate = setHours(new Date(selectedTime.date), selectedTime.hour);
      newDueDate.setMinutes(0, 0, 0);

      const { error } = await supabase
        .from('team_tasks')
        .update({ due_date: newDueDate.toISOString() })
        .eq('id', task.id);

      if (error) throw error;

      toast.success(`Scheduled "${task.title}" for ${formatTimeSlot()}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error scheduling task:', error);
      toast.error(error.message || 'Failed to schedule task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Schedule Existing Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedTime && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-center">
              <p className="text-sm text-indigo-300">
                <Clock className="w-4 h-4 inline-block mr-2" />
                Scheduling for: {formatTimeSlot()}
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Task List */}
          <ScrollArea className="h-[300px]">
            {unscheduledTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-10 h-10 mx-auto text-white/20 mb-3" />
                <p className="text-white/60">No unscheduled tasks found</p>
                <p className="text-white/40 text-sm mt-1">
                  All your tasks are already scheduled or completed
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unscheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => !loading && handleSelectTask(task)}
                    className={`p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-indigo-500/30 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge className={`${getPriorityColor(task.priority)} border`}>
                        {task.priority}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          {task.project_name && (
                            <span>📁 {task.project_name}</span>
                          )}
                          {task.owner_name && (
                            <span>👤 {task.owner_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
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
