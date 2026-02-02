import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Paperclip, X, Calendar, Clock } from 'lucide-react';
import { useDeleteJobSchedule } from '../hooks/useMobileProjects';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { notifyJobAssignment } from '@/utils/sendSmsNotification';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LabelSelectionModal } from '../components/tasks/LabelSelectionModal';
import { LocationSelectionModal } from '../components/tasks/LocationSelectionModal';
import { SubTasksModal } from '../components/tasks/SubTasksModal';
import { UserSelectionModal } from '../components/UserSelectionModal';
import { TimePicker } from '../components/TimePicker';
import { format } from 'date-fns';
import { DEFAULT_LABELS } from '@/mobile/constants/labels';
import { formatTime12Hour } from '@/utils/timezone';
export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobScheduleId = searchParams.get('scheduleId');
  const {
    mutate: deleteSchedule
  } = useDeleteJobSchedule();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [assignedUserName, setAssignedUserName] = useState('Fernanda Garcia');
  const [assignedUserAvatar, setAssignedUserAvatar] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [subTasks, setSubTasks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSubTasksModal, setShowSubTasksModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const handleDiscard = () => {
    if (jobScheduleId) {
      deleteSchedule(jobScheduleId);
    }
    navigate(-1);
  };
  const handleSaveDraft = async () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (!location.trim()) {
      toast.error('Please select a location');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_schedules')
        .insert({
          job_name: taskTitle,
          description: taskDescription,
          start_time: `${startDate}T${startTime}`,
          end_time: `${dueDate}T${dueTime}`,
          assigned_users: assignedUserId ? [assignedUserId] : [],
          location: location || null,
          status: 'draft',
          color: '#6366f1'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      navigate('/mobile/job-scheduling');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };
  const handlePublishTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (!location.trim()) {
      toast.error('Please select a location');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_schedules')
        .insert({
          job_name: taskTitle,
          description: taskDescription,
          start_time: `${startDate}T${startTime}`,
          end_time: `${dueDate}T${dueTime}`,
          assigned_users: assignedUserId ? [assignedUserId] : [],
          location: location || null,
          status: 'scheduled',
          color: '#6366f1'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Send SMS notification to assigned user
      if (assignedUserId) {
        try {
          console.log('📱 Sending task assignment notification to user:', assignedUserId);
          await notifyJobAssignment(assignedUserId, taskTitle);
        } catch (notifError) {
          console.error('Failed to send SMS notification:', notifError);
          // Don't throw - notifications are secondary
        }
      }

      navigate('/mobile/job-scheduling');
    } catch (error) {
      console.error('Error publishing task:', error);
      toast.error('Failed to publish task');
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const applyFormatting = (formatType: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = taskDescription.substring(start, end);
    if (!selectedText) return;
    let formattedText = '';
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }
    const newDescription = taskDescription.substring(0, start) + formattedText + taskDescription.substring(end);
    setTaskDescription(newDescription);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  return <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary w-8 h-8 sm:w-10 sm:h-10">
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
        <h1 className="text-base sm:text-lg md:text-xl font-semibold">Create new task</h1>
        <div className="w-8 sm:w-10" />
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 pt-0 pb-0">
        {/* Task Title */}
        <Input placeholder="Task title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="border-0 border-b rounded-none px-0 text-sm sm:text-base md:text-lg placeholder:text-muted-foreground/50" />

        {/* Task Description */}
        <div className="space-y-2">
          <Textarea ref={textareaRef} placeholder="Task description" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} className="min-h-[100px] sm:min-h-[120px] md:min-h-[150px] resize-none border rounded-lg text-sm sm:text-base" />
          <div className="flex items-center gap-3 sm:gap-4 bg-muted/30 p-2 sm:p-3 rounded-lg">
            <button onClick={() => applyFormatting('bold')} className="text-muted-foreground hover:text-foreground text-sm sm:text-base transition-colors" type="button">
              <span className="font-bold">B</span>
            </button>
            <button onClick={() => applyFormatting('italic')} className="text-muted-foreground hover:text-foreground text-sm sm:text-base transition-colors" type="button">
              <span className="italic">I</span>
            </button>
            <button onClick={() => applyFormatting('underline')} className="text-muted-foreground hover:text-foreground text-sm sm:text-base transition-colors" type="button">
              <span className="underline">U</span>
            </button>
          </div>
        </div>

        {/* Attachment Button */}
        <div className="space-y-3">
          <div className="flex justify-end">
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary text-primary">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          
          {/* Display attached files */}
          {attachments.length > 0 && <div className="space-y-2">
              {attachments.map((file, index) => <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(index)} className="w-8 h-8 flex-shrink-0">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>)}
            </div>}
        </div>

        {/* Start Time */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <span className="text-sm sm:text-base font-medium">Start time</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs sm:text-sm text-primary font-medium border-none shadow-none bg-transparent cursor-pointer" />
            <button onClick={() => setShowStartTimePicker(true)} className="text-xs sm:text-sm text-primary font-medium cursor-pointer hover:underline">
              {formatTime12Hour(startTime)}
            </button>
            <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-6 sm:h-6" onClick={() => {
            setStartDate(new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
          }}>
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Due Time */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <span className="text-sm sm:text-base font-medium">Due time</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-xs sm:text-sm text-primary font-medium border-none shadow-none bg-transparent cursor-pointer" />
            <button onClick={() => setShowDueTimePicker(true)} className="text-xs sm:text-sm text-primary font-medium cursor-pointer hover:underline">
              {formatTime12Hour(dueTime)}
            </button>
            <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-6 sm:h-6" onClick={() => {
            setDueDate(new Date().toISOString().split('T')[0]);
            setDueTime('17:00');
          }}>
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <span className="text-sm sm:text-base font-medium">Assigned to</span>
          <Button variant="outline" onClick={() => setShowUserModal(true)} className="rounded-full h-8 sm:h-9 px-2 sm:px-3">
            <Avatar className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2">
              <AvatarImage src={assignedUserAvatar || ''} />
              <AvatarFallback className="text-xs sm:text-sm">
                {assignedUserName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs sm:text-sm">{assignedUserName}</span>
          </Button>
        </div>

        {/* Labels */}
        <div className="py-2 sm:py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm sm:text-base font-medium">Labels</span>
            <Button variant="ghost" onClick={() => setShowLabelModal(true)} className="text-primary font-normal text-xs sm:text-sm h-auto p-2">
              {selectedLabels.length > 0 ? 'Edit' : 'Select'}
            </Button>
          </div>
          {selectedLabels.length > 0 && <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {selectedLabels.map(labelId => {
            const label = DEFAULT_LABELS.find(l => l.id === labelId);
            if (!label) return null;
            return <div key={labelId} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/30">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{
                backgroundColor: label.color
              }} />
                    <span className="text-xs sm:text-sm">{label.name}</span>
                  </div>;
          })}
            </div>}
        </div>

        {/* Location */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b">
          <span className="text-sm sm:text-base font-medium">Location</span>
          {location ? <Button variant="ghost" onClick={() => setShowLocationModal(true)} className="text-primary font-normal text-xs sm:text-sm h-auto p-2 max-w-[60%] text-right">
              {location}
            </Button> : <Button variant="ghost" onClick={() => setShowLocationModal(true)} className="text-primary font-normal text-xs sm:text-sm h-auto p-2">
              Select
            </Button>}
        </div>

        {/* Sub-tasks */}
        <div className="py-1 sm:py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm sm:text-base font-medium">Sub-tasks</span>
            <Button variant="ghost" onClick={() => setShowSubTasksModal(true)} className="text-primary font-normal text-xs sm:text-sm h-auto p-2">
              {subTasks.length > 0 ? 'Edit' : 'Add'}
            </Button>
          </div>
          {subTasks.length > 0 && <div className="space-y-2">
              {subTasks.map((task, index) => <div key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{task}</span>
                </div>)}
            </div>}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-2 sm:p-3 border-t bg-background">
        <Button variant="outline" onClick={handleDiscard} className="w-full sm:flex-1 rounded-full h-10 sm:h-12 text-sm sm:text-base">
          Discard
        </Button>
        <Button onClick={handleSaveDraft} className="w-full sm:flex-1 rounded-full h-10 sm:h-12 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white text-sm sm:text-base">
          <span className="mr-2">↓</span>
          Save draft
        </Button>
        <Button onClick={handlePublishTask} className="w-full sm:flex-1 rounded-full h-10 sm:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white text-sm sm:text-base">
          Publish task
        </Button>
      </div>

      {/* Modals */}
      <UserSelectionModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSelect={(userId, userName, avatarUrl) => {
      setAssignedUserId(userId);
      setAssignedUserName(userName);
      setAssignedUserAvatar(avatarUrl);
      setShowUserModal(false);
    }} />

      <LabelSelectionModal isOpen={showLabelModal} onClose={() => setShowLabelModal(false)} selectedLabels={selectedLabels} onConfirm={labels => {
      setSelectedLabels(labels);
      setShowLabelModal(false);
    }} />

      <LocationSelectionModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSelect={loc => {
      setLocation(loc);
      setShowLocationModal(false);
    }} />

      <SubTasksModal isOpen={showSubTasksModal} onClose={() => setShowSubTasksModal(false)} subTasks={subTasks} onSave={tasks => {
      setSubTasks(tasks);
      setShowSubTasksModal(false);
    }} />

      <TimePicker isOpen={showStartTimePicker} onClose={() => setShowStartTimePicker(false)} value={startTime} onSelect={setStartTime} title="Start Time" />

      <TimePicker isOpen={showDueTimePicker} onClose={() => setShowDueTimePicker(false)} value={dueTime} onSelect={setDueTime} title="Due Time" />
    </div>;
};