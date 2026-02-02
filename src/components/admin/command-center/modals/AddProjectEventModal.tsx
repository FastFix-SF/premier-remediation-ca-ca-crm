import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Target, Users, Flag, Truck, Clock, Rocket, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  end_date?: string | null;
  description?: string | null;
  project_id?: string | null;
  assignee_ids?: string[] | null;
  reminder_days?: number;
  is_recurring?: boolean;
  recurrence_type?: string | null;
  recurrence_interval?: number;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  color_code?: string | null;
}

interface AddProjectEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamMembers: TeamMember[];
  projects: Project[];
  editEvent?: CalendarEvent | null;
  prefilledDate?: Date | null;
}

const EVENT_TYPES = [
  { value: 'milestone', label: 'Milestone', icon: Target, color: 'bg-purple-500' },
  { value: 'review', label: 'Review', icon: Users, color: 'bg-cyan-500' },
  { value: 'deadline', label: 'Deadline', icon: Flag, color: 'bg-red-500' },
  { value: 'kickoff', label: 'Kickoff', icon: Rocket, color: 'bg-green-500' },
  { value: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-yellow-500' },
  { value: 'meeting', label: 'Meeting', icon: Clock, color: 'bg-indigo-500' },
];

const RECURRENCE_TYPES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const WEEKDAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];

export const AddProjectEventModal: React.FC<AddProjectEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamMembers,
  projects,
  editEvent,
  prefilledDate,
}) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('milestone');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [reminderDays, setReminderDays] = useState(3);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();

  // Populate form when editing
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setEventType(editEvent.event_type);
      setDescription(editEvent.description || '');
      setProjectId(editEvent.project_id || null);
      setEventDate(new Date(editEvent.event_date));
      setEndDate(editEvent.end_date ? new Date(editEvent.end_date) : undefined);
      setAssigneeIds(editEvent.assignee_ids || []);
      setReminderDays(editEvent.reminder_days || 3);
      setRecurrenceType(editEvent.is_recurring ? (editEvent.recurrence_type || 'daily') : 'none');
      setRecurrenceInterval(editEvent.recurrence_interval || 1);
      setRecurrenceDays(editEvent.recurrence_days || []);
      setRecurrenceEndDate(editEvent.recurrence_end_date ? new Date(editEvent.recurrence_end_date) : undefined);
    } else {
      resetForm();
      if (prefilledDate) {
        setEventDate(prefilledDate);
      }
    }
  }, [editEvent, prefilledDate, isOpen]);

  const resetForm = () => {
    setTitle('');
    setEventType('milestone');
    setDescription('');
    setProjectId(null);
    setEventDate(undefined);
    setEndDate(undefined);
    setAssigneeIds([]);
    setReminderDays(3);
    setRecurrenceType('none');
    setRecurrenceInterval(1);
    setRecurrenceDays([]);
    setRecurrenceEndDate(undefined);
  };

  const toggleAssignee = (userId: string) => {
    setAssigneeIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!eventDate) {
      toast.error('Event date is required');
      return;
    }

    setLoading(true);

    const eventData = {
      title: title.trim(),
      event_type: eventType,
      description: description.trim() || null,
      project_id: projectId,
      event_date: format(eventDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : null,
      reminder_days: reminderDays,
      is_recurring: recurrenceType !== 'none',
      recurrence_type: recurrenceType !== 'none' ? recurrenceType : null,
      recurrence_interval: recurrenceType !== 'none' ? recurrenceInterval : null,
      recurrence_days: recurrenceType === 'weekly' && recurrenceDays.length > 0 ? recurrenceDays : null,
      recurrence_end_date: recurrenceEndDate ? format(recurrenceEndDate, 'yyyy-MM-dd') : null,
    };

    let error;
    if (editEvent) {
      const result = await supabase
        .from('project_calendar_events')
        .update(eventData)
        .eq('id', editEvent.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('project_calendar_events')
        .insert(eventData);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
      return;
    }

    toast.success(editEvent ? 'Event updated' : 'Event created');
    onSuccess();
    onClose();
  };

  const selectedEventType = EVENT_TYPES.find(t => t.value === eventType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedEventType && (
              <div className={`w-6 h-6 rounded ${selectedEventType.color} flex items-center justify-center`}>
                <selectedEventType.icon className="w-4 h-4 text-white" />
              </div>
            )}
            {editEvent ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-white/80">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="text-white/80">Event Type</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setEventType(type.value)}
                  className={`${
                    eventType === type.value
                      ? `${type.color} text-white`
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <type.icon className="w-3 h-3 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label className="text-white/80">Project (Optional)</Label>
            <Select value={projectId || 'none'} onValueChange={(v) => setProjectId(v === 'none' ? null : v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="none" className="text-white/60">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white">
                    {project.name || 'Untitled Project'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/80">Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-white/40" />
                    {eventDate ? format(eventDate, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    className="bg-slate-900 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-white/40" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="bg-slate-900 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white/80">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
            />
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label className="text-white/80">Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <Badge
                  key={member.user_id}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    assigneeIds.includes(member.user_id)
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                  onClick={() => toggleAssignee(member.user_id)}
                >
                  {assigneeIds.includes(member.user_id) && (
                    <X className="w-3 h-3 mr-1" />
                  )}
                  {member.full_name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <Label className="text-white/80">Reminder (days before)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={reminderDays}
              onChange={(e) => setReminderDays(parseInt(e.target.value) || 0)}
              className="bg-white/5 border-white/10 text-white w-24"
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-3 p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-white/40" />
              <Label className="text-white/80">Recurrence</Label>
            </div>
            
            <Select value={recurrenceType} onValueChange={setRecurrenceType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {RECURRENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {recurrenceType !== 'none' && (
              <div className="space-y-3">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">Every</span>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white w-16"
                  />
                  <span className="text-white/60 text-sm">
                    {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}
                  </span>
                </div>

                {/* Weekdays for weekly */}
                {recurrenceType === 'weekly' && (
                  <div className="flex gap-1">
                    {WEEKDAYS.map((day) => (
                      <Button
                        key={day.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecurrenceDay(day.value)}
                        className={`w-8 h-8 p-0 ${
                          recurrenceDays.includes(day.value)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* End Date */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">End date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2 text-white/40" />
                        {recurrenceEndDate ? format(recurrenceEndDate, 'MMM d, yyyy') : 'No end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        className="bg-slate-900 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
          >
            {loading ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
