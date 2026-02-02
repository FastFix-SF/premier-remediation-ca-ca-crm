import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateDailyLog } from '@/hooks/useDailyLogs';
import { supabase } from '@/integrations/supabase/client';

interface CreateDailyLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
}

export const CreateDailyLogDialog: React.FC<CreateDailyLogDialogProps> = ({
  open,
  onOpenChange,
  projectId: initialProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [arrivalTime, setArrivalTime] = useState('07:00');
  const [departureTime, setDepartureTime] = useState('17:00');
  const [tasksPerformed, setTasksPerformed] = useState('');
  const [siteCondition, setSiteCondition] = useState<'good' | 'fair' | 'poor'>('good');

  const createMutation = useCreateDailyLog();

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  const handleSubmit = async () => {
    if (!selectedProjectId) return;

    await createMutation.mutateAsync({
      project_id: selectedProjectId,
      log_date: format(logDate, 'yyyy-MM-dd'),
      arrival_time: arrivalTime,
      departure_time: departureTime,
      tasks_performed: tasksPerformed,
      site_condition: siteCondition,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setLogDate(new Date());
    setArrivalTime('07:00');
    setDepartureTime('17:00');
    setTasksPerformed('');
    setSiteCondition('good');
    if (!initialProjectId) {
      setSelectedProjectId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Daily Log</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selection */}
          {!initialProjectId && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !logDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {logDate ? format(logDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={logDate}
                  onSelect={(date) => date && setLogDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arrival Time</Label>
              <Input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Departure Time</Label>
              <Input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </div>
          </div>

          {/* Site Condition */}
          <div className="space-y-2">
            <Label>Site Condition</Label>
            <Select value={siteCondition} onValueChange={(v) => setSiteCondition(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <Label>Tasks Performed</Label>
            <Textarea
              value={tasksPerformed}
              onChange={(e) => setTasksPerformed(e.target.value)}
              placeholder="Describe the work completed today..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedProjectId || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
