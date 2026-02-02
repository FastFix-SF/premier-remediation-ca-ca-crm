import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notifyTaskAssignment } from '@/utils/sendSmsNotification';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectSearchable } from '@/components/ui/select-searchable';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Link, X, User, Flag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CustomerSelectPopover } from '@/components/service-tickets/CustomerSelectPopover';
import { TaskAttachmentsSection, TaskAttachment } from '../TaskAttachmentsSection';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string | null;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTask?: any;
  teamMembers: TeamMember[];
  projects: Project[];
  prefilledDate?: Date | null;
  prefilledHour?: number | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTask,
  teamMembers,
  projects,
  prefilledDate,
  prefilledHour,
}) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'>('NOT_STARTED');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>('M');
  const [currentFocus, setCurrentFocus] = useState(false);
  const [blockerNotes, setBlockerNotes] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setDescription(editTask.description || '');
      setDocumentTitle(editTask.document_title || '');
      setDocumentUrl(editTask.document_url || '');
      setOwnerId(editTask.owner_id || '');
      setCollaboratorIds(editTask.collaborator_ids || []);
      setProjectId(editTask.project_id || '');
      setClientName(editTask.client_name || '');
      // Set selectedCustomer from client_name if available
      if (editTask.client_name) {
        setSelectedCustomer({ id: '', name: editTask.client_name });
      } else {
        setSelectedCustomer(null);
      }
      setPriority(editTask.priority || 'P2');
      setStatus(editTask.status || 'NOT_STARTED');
      setDueDate(editTask.due_date ? new Date(editTask.due_date) : undefined);
      // Parse existing times from due_date and end_time
      if (editTask.due_date) {
        const dueDateTime = new Date(editTask.due_date);
        const hours = dueDateTime.getHours().toString().padStart(2, '0');
        const mins = dueDateTime.getMinutes().toString().padStart(2, '0');
        if (hours !== '00' || mins !== '00') {
          setStartTime(`${hours}:${mins}`);
        } else {
          setStartTime('');
        }
      } else {
        setStartTime('');
      }
      if (editTask.end_time) {
        const endDateTime = new Date(editTask.end_time);
        const hours = endDateTime.getHours().toString().padStart(2, '0');
        const mins = endDateTime.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hours}:${mins}`);
      } else {
        setEndTime('');
      }
      setEstimatedDuration(editTask.estimated_duration || 'M');
      setCurrentFocus(editTask.current_focus || false);
      setBlockerNotes(editTask.blocker_notes || '');
      // Load existing attachments
      loadAttachments(editTask.id);
    } else {
      resetForm();
      // Apply prefilled date and hour when creating new task
      if (prefilledDate) {
        setDueDate(prefilledDate);
      }
      if (prefilledHour !== null && prefilledHour !== undefined) {
        const hourStr = prefilledHour.toString().padStart(2, '0');
        setStartTime(`${hourStr}:00`);
        // Auto-suggest end time 1 hour later
        const endHour = (prefilledHour + 1) % 24;
        setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
      }
    }
  }, [editTask, isOpen, prefilledDate, prefilledHour]);

  const loadAttachments = async (taskId: string) => {
    const { data, error } = await (supabase
      .from('task_attachments' as any)
      .select('*')
      .eq('task_id', taskId) as any);
    
    if (!error && data) {
      setAttachments((data as any[]).map((a: any) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        type: a.type,
        size: a.size || undefined,
      })));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDocumentTitle('');
    setDocumentUrl('');
    setOwnerId('');
    setCollaboratorIds([]);
    setProjectId('');
    setClientName('');
    setSelectedCustomer(null);
    setPriority('P2');
    setStatus('NOT_STARTED');
    setDueDate(undefined);
    setStartTime('');
    setEndTime('');
    setEstimatedDuration('M');
    setCurrentFocus(false);
    setBlockerNotes('');
    setAttachments([]);
  };

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const diff = endMins - startMins;
    if (diff <= 0) return 'Invalid';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      // Combine date with start time for due_date
      let finalDueDate: Date | null = dueDate ? new Date(dueDate) : null;
      if (finalDueDate && startTime) {
        const [hours, mins] = startTime.split(':').map(Number);
        finalDueDate.setHours(hours, mins, 0, 0);
      }

      // Combine date with end time for end_time
      let finalEndTime: Date | null = null;
      if (dueDate && endTime) {
        finalEndTime = new Date(dueDate);
        const [hours, mins] = endTime.split(':').map(Number);
        finalEndTime.setHours(hours, mins, 0, 0);
      }

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        document_title: documentTitle.trim() || null,
        document_url: documentUrl.trim() || null,
        owner_id: ownerId || null,
        collaborator_ids: collaboratorIds.length > 0 ? collaboratorIds : [],
        project_id: projectId || null,
        client_name: clientName.trim() || null,
        priority,
        status,
        due_date: finalDueDate?.toISOString() || null,
        end_time: finalEndTime?.toISOString() || null,
        estimated_duration: estimatedDuration,
        current_focus: currentFocus,
        blocker_notes: status === 'BLOCKED' ? blockerNotes.trim() || null : null,
      };

      let taskId: string;

      if (editTask) {
        const { error } = await supabase
          .from('team_tasks')
          .update(taskData)
          .eq('id', editTask.id);
        if (error) throw error;
        taskId = editTask.id;
        toast.success('Task updated successfully');
      } else {
        const { data: insertedTask, error } = await supabase
          .from('team_tasks')
          .insert(taskData)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        taskId = insertedTask.id;
        toast.success('Task created successfully');

        // Send SMS notifications to assignee and collaborators (non-blocking)
        try {
          // Get current user's name
          const { data: { user } } = await supabase.auth.getUser();
          let assignerName = 'Someone';
          if (user?.id) {
            const { data: currentMember } = await supabase
              .from('team_directory')
              .select('full_name')
              .eq('user_id', user.id)
              .maybeSingle();
            if (currentMember?.full_name) {
              assignerName = currentMember.full_name;
            }
          }

          // Notify owner if assigned
          if (ownerId) {
            notifyTaskAssignment(ownerId, title.trim(), assignerName, false);
          }

          // Notify collaborators
          collaboratorIds.forEach(collabId => {
            notifyTaskAssignment(collabId, title.trim(), assignerName, true);
          });
        } catch (notifyError) {
          console.error('Failed to send task notifications:', notifyError);
          // Don't block task creation if notifications fail
        }
      }

      // Save attachments
      if (attachments.length > 0) {
        // Get existing attachment IDs to know which are already saved
        const existingIds = attachments.filter(a => a.id).map(a => a.id);
        const newAttachments = attachments.filter(a => !a.id);

        if (newAttachments.length > 0) {
          const attachmentRecords = newAttachments.map(att => ({
            task_id: taskId,
            name: att.name,
            url: att.url,
            type: att.type,
            size: att.size || null,
          }));

          const { error: attachError } = await (supabase
            .from('task_attachments' as any)
            .insert(attachmentRecords) as any);

          if (attachError) {
            console.error('Error saving attachments:', attachError);
          }
        }

        // Delete removed attachments
        if (editTask) {
          const { data: currentAttachments } = await (supabase
            .from('task_attachments' as any)
            .select('id')
            .eq('task_id', taskId) as any);
          
          if (currentAttachments) {
            const currentIds = (currentAttachments as any[]).map((a: any) => a.id);
            const idsToDelete = currentIds.filter(id => !existingIds.includes(id));
            
            if (idsToDelete.length > 0) {
              await (supabase
                .from('task_attachments' as any)
                .delete()
                .in('id', idsToDelete) as any);
            }
          }
        }
      } else if (editTask) {
        // Remove all attachments if none left
        await (supabase
          .from('task_attachments' as any)
          .delete()
          .eq('task_id', editTask.id) as any);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const toggleCollaborator = (userId: string) => {
    setCollaboratorIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'P0': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'P1': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'P2': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'P3': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getDurationLabel = (d: string) => {
    switch (d) {
      case 'XS': return '< 30m';
      case 'S': return '30m - 2h';
      case 'M': return '2h - 4h';
      case 'L': return '4h - 8h';
      case 'XL': return '> 8h';
      default: return d;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editTask ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title - Yellow/Amber focus border */}
          <div className="space-y-2">
            <Label className="text-sm text-white/80">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-slate-800/50 border-amber-500/40 text-white focus:border-amber-400 focus:ring-amber-400/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm text-white/80">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="bg-white/5 border-white/10 text-white min-h-[80px] resize-none"
            />
          </div>


          {/* Attachments Section */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <TaskAttachmentsSection
              taskId={editTask?.id || 'new'}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>

          {/* Assignee & Client - 2 columns responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-white/80">
                <User className="w-4 h-4" />
                Assign To
              </Label>
              <SelectSearchable
                value={ownerId || 'unassigned'}
                onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}
                placeholder="Select assignee"
                searchPlaceholder="Search team member..."
                className="bg-white/5 border-white/10 text-white"
                options={[
                  { value: 'unassigned', label: 'Unassigned' },
                  ...teamMembers.map(member => ({
                    value: member.user_id,
                    label: member.full_name,
                  }))
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-white/80">Client</Label>
              <CustomerSelectPopover
                selectedCustomer={selectedCustomer}
                onSelect={(customer) => {
                  setSelectedCustomer(customer);
                  setClientName(customer?.name || '');
                }}
              />
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label className="text-sm text-white/80">Project</Label>
            <SelectSearchable
              value={projectId || 'none'}
              onValueChange={(v) => setProjectId(v === 'none' ? '' : v)}
              placeholder="Select project"
              searchPlaceholder="Search project..."
              className="bg-white/5 border-white/10 text-white"
              options={[
                { value: 'none', label: 'No project' },
                ...projects.map(project => ({
                  value: project.id,
                  label: project.name || 'Untitled Project',
                }))
              ]}
            />
          </div>

          {/* Collaborators - Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm text-white/80">Collaborators</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left bg-white/5 border-white/10 text-white h-auto min-h-10 py-2"
                >
                  {collaboratorIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {collaboratorIds.map((id) => {
                        const member = teamMembers.find(m => m.user_id === id);
                        return member ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs"
                          >
                            {member.full_name}
                            <X
                              className="w-3 h-3 ml-1 cursor-pointer hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollaborator(id);
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-white/50">+ Add collaborators</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-slate-800 border-white/10 z-[10001] max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {teamMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        collaboratorIds.includes(member.user_id)
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                      onClick={() => toggleCollaborator(member.user_id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        collaboratorIds.includes(member.user_id)
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-white/30'
                      }`}>
                        {collaboratorIds.includes(member.user_id) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-sm truncate">{member.full_name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Priority & Status - 2 columns with Priority as dropdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-white/80">
                <Flag className="w-4 h-4" />
                Priority
              </Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className={`bg-white/5 border-white/10 text-white ${getPriorityColor(priority)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 z-[10001]">
                  <SelectItem value="P0" className="text-red-400">🔴 P0 - Critical</SelectItem>
                  <SelectItem value="P1" className="text-orange-400">🟠 P1 - High</SelectItem>
                  <SelectItem value="P2" className="text-blue-400">🔵 P2 - Medium</SelectItem>
                  <SelectItem value="P3" className="text-gray-400">⚪ P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-white/80">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 z-[10001]">
                  <SelectItem value="NOT_STARTED" className="text-white">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-white">In Progress</SelectItem>
                  <SelectItem value="BLOCKED" className="text-white">Blocked</SelectItem>
                  <SelectItem value="DONE" className="text-white">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blocker Notes (shown when BLOCKED) */}
          {status === 'BLOCKED' && (
            <div className="space-y-2">
              <Label className="text-orange-400 text-sm">Blocker Notes</Label>
              <Textarea
                value={blockerNotes}
                onChange={(e) => setBlockerNotes(e.target.value)}
                placeholder="What's blocking this task?"
                className="bg-orange-500/10 border-orange-500/30 text-white resize-none"
              />
            </div>
          )}

          {/* Due Date, Start Time, End Time, Size - Responsive: 2 cols mobile, 4 cols desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Due Date */}
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-white/5 border-white/10 text-white h-10 text-sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                    <span className="truncate">{dueDate ? format(dueDate, 'MM/dd/yy') : 'Date'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-white/10 z-[10001]" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    className="text-white pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Start Time</Label>
              <Select value={startTime || 'none'} onValueChange={(v) => setStartTime(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                  <Clock className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 z-[10001] max-h-60">
                  <SelectItem value="none" className="text-white/50">No time</SelectItem>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hours = Math.floor(i / 2);
                    const minutes = (i % 2) * 30;
                    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const label = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                    return (
                      <SelectItem key={value} value={value} className="text-white hover:bg-white/10">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <Label className="text-xs text-white/60">End Time</Label>
              <Select value={endTime || 'none'} onValueChange={(v) => setEndTime(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                  <Clock className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 z-[10001] max-h-60">
                  <SelectItem value="none" className="text-white/50">No time</SelectItem>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hours = Math.floor(i / 2);
                    const minutes = (i % 2) * 30;
                    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const label = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                    return (
                      <SelectItem key={value} value={value} className="text-white hover:bg-white/10">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Size (Dropdown) */}
            <div className="space-y-1">
              <Label className="text-xs text-white/60">Size</Label>
              <Select value={estimatedDuration} onValueChange={(v: any) => setEstimatedDuration(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 z-[10001]">
                  <SelectItem value="XS" className="text-white hover:bg-white/10">XS</SelectItem>
                  <SelectItem value="S" className="text-white hover:bg-white/10">S</SelectItem>
                  <SelectItem value="M" className="text-white hover:bg-white/10">M</SelectItem>
                  <SelectItem value="L" className="text-white hover:bg-white/10">L</SelectItem>
                  <SelectItem value="XL" className="text-white hover:bg-white/10">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Duration indicator */}
          {startTime && endTime && (
            <p className="text-xs text-indigo-400 -mt-2">Duration: {calculateDuration(startTime, endTime)}</p>
          )}

          {/* Current Focus - Simple checkbox style */}
          <div className="flex items-center gap-3 py-2">
            <Switch
              checked={currentFocus}
              onCheckedChange={setCurrentFocus}
              className="data-[state=checked]:bg-orange-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-orange-400">🔥</span>
              <Label className="text-sm text-white/80 cursor-pointer" onClick={() => setCurrentFocus(!currentFocus)}>
                Set as Focus
              </Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
            className="bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            {loading ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
