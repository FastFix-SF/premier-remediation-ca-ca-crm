import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FolderOpen, Clock, Link, Flag, Users, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectSearchable } from '@/components/ui/select-searchable';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyTaskAssignment } from '@/utils/sendSmsNotification';
import { 
  useMobileTaskDetail,
  useTeamMembers,
  useProjects 
} from '../hooks/useMobileTasks';
import { MobileTaskAttachments, TaskAttachment } from '../components/tasks/MobileTaskAttachments';
import { CustomerSelectPopover } from '@/components/service-tickets/CustomerSelectPopover';
import { X } from 'lucide-react';

export const AddMobileTaskPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isEditMode = !!taskId;
  
  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'>('NOT_STARTED');
  const [ownerId, setOwnerId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedDuration, setEstimatedDuration] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>('M');
  
  // Extended fields (matching desktop)
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [clientName, setClientName] = useState('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [currentFocus, setCurrentFocus] = useState(false);
  const [blockerNotes, setBlockerNotes] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  const { data: existingTask } = useMobileTaskDetail(taskId);
  const { data: teamMembers } = useTeamMembers();
  const { data: projects } = useProjects();

  const PRIORITY_OPTIONS = [
    { value: 'P0', label: 'Critical', color: 'bg-red-500 text-white' },
    { value: 'P1', label: 'High', color: 'bg-orange-500 text-white' },
    { value: 'P2', label: 'Medium', color: 'bg-blue-500 text-white' },
    { value: 'P3', label: 'Low', color: 'bg-muted text-muted-foreground' },
  ];

  const STATUS_OPTIONS = [
    { value: 'NOT_STARTED', label: t('tasks.status.toDo') },
    { value: 'IN_PROGRESS', label: t('tasks.status.inProgress') },
    { value: 'BLOCKED', label: t('tasks.status.blocked') },
    { value: 'DONE', label: t('tasks.status.done') },
  ];

  const DURATION_OPTIONS = [
    { value: 'XS', label: '< 30m' },
    { value: 'S', label: '30m - 2h' },
    { value: 'M', label: '2h - 4h' },
    { value: 'L', label: '4h - 8h' },
    { value: 'XL', label: '> 8h' },
  ];

  const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const label = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    return { value, label };
  });

  const dateLocale = language === 'es' ? es : undefined;

  // Load existing task data
  useEffect(() => {
    if (existingTask && isEditMode) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setPriority((existingTask.priority as any) || 'P2');
      setStatus((existingTask.status as any) || 'NOT_STARTED');
      setOwnerId(existingTask.owner_id || '');
      setProjectId(existingTask.project_id || '');
      setDueDate(existingTask.due_date ? new Date(existingTask.due_date) : undefined);
      setEstimatedDuration((existingTask.estimated_duration as any) || 'M');
      
      // Extended fields
      setDocumentTitle((existingTask as any).document_title || '');
      setDocumentUrl((existingTask as any).document_url || '');
      setCollaboratorIds((existingTask as any).collaborator_ids || []);
      setClientName((existingTask as any).client_name || '');
      if ((existingTask as any).client_name) {
        setSelectedCustomer({ id: '', name: (existingTask as any).client_name });
      }
      setCurrentFocus((existingTask as any).current_focus || false);
      setBlockerNotes((existingTask as any).blocker_notes || '');
      
      // Parse times
      if (existingTask.due_date) {
        const dueDateTime = new Date(existingTask.due_date);
        const hours = dueDateTime.getHours().toString().padStart(2, '0');
        const mins = dueDateTime.getMinutes().toString().padStart(2, '0');
        if (hours !== '00' || mins !== '00') {
          setStartTime(`${hours}:${mins}`);
        }
      }
      if ((existingTask as any).end_time) {
        const endDateTime = new Date((existingTask as any).end_time);
        const hours = endDateTime.getHours().toString().padStart(2, '0');
        const mins = endDateTime.getMinutes().toString().padStart(2, '0');
        setEndTime(`${hours}:${mins}`);
      }
      
      // Load attachments
      loadAttachments(existingTask.id);
    }
  }, [existingTask, isEditMode]);

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

  const toggleCollaborator = (userId: string) => {
    setCollaboratorIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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

      let savedTaskId: string;

      if (isEditMode && taskId) {
        const { error } = await supabase
          .from('team_tasks')
          .update(taskData)
          .eq('id', taskId);
        if (error) throw error;
        savedTaskId = taskId;
        toast.success('Task updated successfully');
      } else {
        const { data: insertedTask, error } = await supabase
          .from('team_tasks')
          .insert(taskData)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        savedTaskId = insertedTask.id;
        toast.success('Task created successfully');

        // Send SMS notifications (non-blocking)
        try {
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

          if (ownerId) {
            notifyTaskAssignment(ownerId, title.trim(), assignerName, false);
          }

          collaboratorIds.forEach(collabId => {
            notifyTaskAssignment(collabId, title.trim(), assignerName, true);
          });
        } catch (notifyError) {
          console.error('Failed to send task notifications:', notifyError);
        }
      }

      // Save attachments
      if (attachments.length > 0) {
        const existingIds = attachments.filter(a => a.id).map(a => a.id);
        const newAttachments = attachments.filter(a => !a.id);

        if (newAttachments.length > 0) {
          const attachmentRecords = newAttachments.map(att => ({
            task_id: savedTaskId,
            name: att.name,
            url: att.url,
            type: att.type,
            size: att.size || null,
          }));

          await (supabase
            .from('task_attachments' as any)
            .insert(attachmentRecords) as any);
        }

        if (isEditMode) {
          const { data: currentAttachments } = await (supabase
            .from('task_attachments' as any)
            .select('id')
            .eq('task_id', savedTaskId) as any);
          
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
      } else if (isEditMode && taskId) {
        await (supabase
          .from('task_attachments' as any)
          .delete()
          .eq('task_id', taskId) as any);
      }

      navigate(isEditMode ? `/mobile/tasks/${taskId}` : '/mobile/tasks', { replace: true });
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-semibold">{isEditMode ? t('tasks.form.editTask') : t('tasks.form.newTask')}</span>
        <Button 
          onClick={handleSubmit} 
          disabled={!title.trim() || loading}
          size="sm"
          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
        >
          {loading ? t('tasks.form.saving') : t('tasks.form.save')}
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4 space-y-5 pb-24">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">{t('tasks.form.taskTitle')} *</Label>
          <Input
            id="title"
            placeholder={t('tasks.form.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t('tasks.form.description')}</Label>
          <Textarea
            id="description"
            placeholder={t('tasks.form.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>


        {/* Attachments */}
        <div className="p-4 rounded-xl bg-muted/30 border">
          <MobileTaskAttachments
            taskId={taskId || 'new'}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              {t('tasks.form.priority')}
            </Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value} - {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blocker Notes */}
        {status === 'BLOCKED' && (
          <div className="space-y-2">
            <Label className="text-destructive">Blocker Notes</Label>
            <Textarea
              value={blockerNotes}
              onChange={(e) => setBlockerNotes(e.target.value)}
              placeholder="What's blocking this task?"
              className="border-destructive/30 bg-destructive/5"
            />
          </div>
        )}

        {/* Assign To */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('tasks.form.assignTo')}
          </Label>
          <SelectSearchable
            value={ownerId || 'unassigned'}
            onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}
            placeholder={t('tasks.form.selectTeamMember')}
            searchPlaceholder="Search team member..."
            options={[
              { value: 'unassigned', label: t('tasks.form.unassigned') },
              ...(teamMembers?.map(member => ({
                value: member.user_id,
                label: member.full_name,
              })) || [])
            ]}
          />
        </div>

        {/* Collaborators */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaborators
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto min-h-10 py-2"
              >
                {collaboratorIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {collaboratorIds.map((id) => {
                      const member = teamMembers?.find(m => m.user_id === id);
                      return member ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {member.full_name}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
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
                  <span className="text-muted-foreground">+ Add collaborators</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 max-h-60 overflow-y-auto">
              <div className="space-y-1">
                {teamMembers?.map((member) => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        collaboratorIds.includes(member.user_id)
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleCollaborator(member.user_id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        collaboratorIds.includes(member.user_id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}>
                      {collaboratorIds.includes(member.user_id) && (
                        <span className="text-primary-foreground text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-sm truncate">{member.full_name}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Client */}
        <div className="space-y-2">
          <Label>Client</Label>
          <CustomerSelectPopover
            selectedCustomer={selectedCustomer}
            onSelect={(customer) => {
              setSelectedCustomer(customer);
              setClientName(customer?.name || '');
            }}
          />
        </div>

        {/* Project */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            {t('tasks.form.project')}
          </Label>
          <SelectSearchable
            value={projectId || 'none'}
            onValueChange={(v) => setProjectId(v === 'none' ? '' : v)}
            placeholder={t('tasks.form.selectProject')}
            searchPlaceholder="Search project..."
            options={[
              { value: 'none', label: t('tasks.form.noProject') },
              ...(projects?.map(project => ({
                value: project.id,
                label: project.name || 'Untitled Project',
              })) || [])
            ]}
          />
        </div>

        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('tasks.form.dueDate')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-sm">
                  {dueDate ? format(dueDate, 'MM/dd/yy', { locale: dateLocale }) : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={dateLocale}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setDueDate(undefined)}
                    >
                      {t('tasks.form.clearDate')}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Size
            </Label>
            <Select value={estimatedDuration} onValueChange={(v: any) => setEstimatedDuration(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value} ({opt.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Start Time</Label>
            <Select value={startTime || 'none'} onValueChange={(v) => setStartTime(v === 'none' ? '' : v)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">No time</SelectItem>
                {TIME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">End Time</Label>
            <Select value={endTime || 'none'} onValueChange={(v) => setEndTime(v === 'none' ? '' : v)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">No time</SelectItem>
                {TIME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration indicator */}
        {startTime && endTime && (
          <p className="text-xs text-primary -mt-2">Duration: {calculateDuration(startTime, endTime)}</p>
        )}

        {/* Current Focus Toggle */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
          <Switch
            checked={currentFocus}
            onCheckedChange={setCurrentFocus}
            className="data-[state=checked]:bg-destructive"
          />
          <div className="flex items-center gap-2 flex-1">
            <Flame className="w-4 h-4 text-destructive" />
            <Label className="cursor-pointer" onClick={() => setCurrentFocus(!currentFocus)}>
              Set as Focus
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMobileTaskPage;
