import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, differenceInDays } from 'date-fns';
import { CalendarIcon, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useCreateScheduleTask } from '@/hooks/useScheduleTasks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TASK_COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Cyan', value: '#06b6d4' },
];

interface AddScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  projectId?: string;
}

export const AddScheduleTaskDialog: React.FC<AddScheduleTaskDialogProps> = ({
  open,
  onOpenChange,
  defaultDate,
  projectId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [startDate, setStartDate] = useState<Date | undefined>(defaultDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultDate);
  const [color, setColor] = useState('#3b82f6');

  const createTask = useCreateScheduleTask();

  const { data: projects } = useQuery({
    queryKey: ['projects-for-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedProjectId || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const durationDays = endDate
      ? differenceInDays(endDate, startDate) + 1
      : 1;

    try {
      await createTask.mutateAsync({
        project_id: selectedProjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd'),
        duration_days: durationDays,
        color,
      });

      toast.success('Task scheduled successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedProjectId(projectId || '');
    setStartDate(defaultDate);
    setEndDate(defaultDate);
    setColor('#3b82f6');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform',
                    color === c.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional task description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Scheduling...' : 'Schedule Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
