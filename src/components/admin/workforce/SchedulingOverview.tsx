import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { GooglePlacesAutocomplete } from '../../ui/google-places-autocomplete';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle, 
  MapPin, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CalendarIcon,
  Send,
  ChevronDown,
  Save,
  Trash2,
  Search,
  FolderOpen,
  Paperclip,
  X,
  Coffee,
  Image as ImageIcon,
  Edit,
  Check
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO, differenceInHours, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useTeamMembers } from '../../../hooks/useTeamMembers';
import { Switch } from '../../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { useToast } from '../../../hooks/use-toast';
import { UserSelectionModal } from '../../../mobile/components/UserSelectionModal';
import { LabelSelectionModal } from '../../../mobile/components/tasks/LabelSelectionModal';
import { LocationSelectionModal } from '../../../mobile/components/tasks/LocationSelectionModal';
import { SubTasksModal } from '../../../mobile/components/tasks/SubTasksModal';
import { ProjectSelectionModal } from '../../../mobile/components/ProjectSelectionModal';
import { DEFAULT_LABELS } from '../../../mobile/constants/labels';
import { ShiftTasksSection } from './ShiftTasksSection';
import { ShiftAttachmentsSection } from './ShiftAttachmentsSection';
import { useQueryClient } from '@tanstack/react-query';

interface Attachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface JobSchedule {
  id: string;
  job_name: string;
  assigned_users: string[];
  start_time: string;
  end_time: string;
  status: string;
  location?: string;
  description?: string;
  priority: string;
  estimated_hours?: number;
  actual_hours?: number;
  color?: string;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

interface ScheduleConflict {
  type: 'overlap' | 'overallocation' | 'gap';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affected_jobs: string[];
  affected_users: string[];
}

const SchedulingOverview = () => {
  const [searchParams] = useSearchParams();
  
  const initialDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }, []);

  const [schedules, setSchedules] = useState<JobSchedule[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConflictsExpanded, setIsConflictsExpanded] = useState(false);
  const [selectedShift, setSelectedShift] = useState<JobSchedule | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Edit mode state for view dialog
  const [isEditing, setIsEditing] = useState(false);
  const [editableShift, setEditableShift] = useState<JobSchedule | null>(null);
  const [editableDescription, setEditableDescription] = useState('');
  const [editableStatus, setEditableStatus] = useState('scheduled');
  const [editablePriority, setEditablePriority] = useState('normal');
  const [editableAssignedUsers, setEditableAssignedUsers] = useState<string[]>([]);
  const [editableAttachments, setEditableAttachments] = useState<Attachment[]>([]);
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const queryClient = useQueryClient();
  
  const [newShift, setNewShift] = useState({
    job_name: '',
    location: '',
    start_time: '08:00',
    end_time: '16:00',
    description: '',
    priority: 'normal',
    color: '#dc2626',
    is_all_day: false,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    assigned_user_ids: [] as string[],
    project_id: null as string | null,
    project_name: null as string | null
  });
  const [activeShiftTab, setActiveShiftTab] = useState('details');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [shiftAttachments, setShiftAttachments] = useState<File[]>([]);
  const shiftFileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: teamMembers } = useTeamMembers();
  const { toast } = useToast();

  // Task-related state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStartDate, setTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskStartTime, setTaskStartTime] = useState('09:00');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('17:00');
  const [taskAssignedUserId, setTaskAssignedUserId] = useState('');
  const [taskAssignedUserName, setTaskAssignedUserName] = useState('');
  const [taskAssignedUserAvatar, setTaskAssignedUserAvatar] = useState<string | null>(null);
  const [taskSelectedLabels, setTaskSelectedLabels] = useState<string[]>([]);
  const [taskLocation, setTaskLocation] = useState('');
  const [taskSubTasks, setTaskSubTasks] = useState<string[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<File[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSubTasksModal, setShowSubTasksModal] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('TeamMembers data:', teamMembers);
    console.log('Schedules data:', schedules);
    if (schedules.length > 0) {
      console.log('First schedule assigned_users:', schedules[0].assigned_users);
    }
  }, [teamMembers, schedules]);

  useEffect(() => {
    fetchScheduleData();
  }, [currentDate]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .gte('start_time', startOfWeek.toISOString())
        .lte('start_time', endOfWeek.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      const schedulesData: JobSchedule[] = (data || []).map(item => ({
        id: item.id,
        job_name: item.job_name,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status || 'scheduled',
        location: item.location,
        description: item.description,
        priority: item.priority || 'normal',
        estimated_hours: item.estimated_hours,
        actual_hours: item.actual_hours,
        color: item.color,
        created_at: item.created_at,
        updated_at: item.updated_at,
        assigned_users: Array.isArray(item.assigned_users) 
          ? item.assigned_users.map((user: any) => {
              // Handle both formats: strings (user IDs) and objects with id property
              if (typeof user === 'string') return user;
              if (typeof user === 'object' && user !== null) return user.id || user.user_id || String(user);
              return String(user);
            })
          : [],
        attachments: Array.isArray(item.attachments) 
          ? (item.attachments as unknown as Attachment[])
          : []
      }));
      setSchedules(schedulesData);
      setConflicts(detectScheduleConflicts(schedulesData));
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectScheduleConflicts = (schedules: JobSchedule[]): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];
    
    // Check for overlapping schedules for same users
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const schedule1 = schedules[i];
        const schedule2 = schedules[j];
        
        // Check if they have common assigned users
        const commonUsers = schedule1.assigned_users.filter(user => 
          schedule2.assigned_users.includes(user)
        );
        
        if (commonUsers.length > 0) {
          const start1 = new Date(schedule1.start_time);
          const end1 = new Date(schedule1.end_time);
          const start2 = new Date(schedule2.start_time);
          const end2 = new Date(schedule2.end_time);
          
          // Check for time overlap
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              type: 'overlap',
              severity: 'high',
              description: `Scheduling conflict: ${getUsersDisplayNames(commonUsers)} assigned to overlapping jobs`,
              affected_jobs: [schedule1.job_name, schedule2.job_name],
              affected_users: commonUsers
            });
          }
        }
      }
    }

    // Check for overallocation (too many hours per day)
    const userHoursByDay: { [key: string]: { [date: string]: number } } = {};
    
    schedules.forEach(schedule => {
      const date = format(parseISO(schedule.start_time), 'yyyy-MM-dd');
      const hours = schedule.estimated_hours || differenceInHours(
        parseISO(schedule.end_time),
        parseISO(schedule.start_time)
      );
      
      schedule.assigned_users.forEach(user => {
        if (!userHoursByDay[user]) userHoursByDay[user] = {};
        if (!userHoursByDay[user][date]) userHoursByDay[user][date] = 0;
        userHoursByDay[user][date] += hours;
      });
    });

    Object.entries(userHoursByDay).forEach(([user, dayHours]) => {
      Object.entries(dayHours).forEach(([date, hours]) => {
        if (hours > 10) {
          conflicts.push({
            type: 'overallocation',
            severity: hours > 12 ? 'high' : 'medium',
            description: `${getUserDisplayName(user)} scheduled for ${hours.toFixed(1)} hours on ${format(parseISO(date), 'MMM d')}`,
            affected_jobs: schedules
              .filter(s => 
                format(parseISO(s.start_time), 'yyyy-MM-dd') === date && 
                s.assigned_users.includes(user)
              )
              .map(s => s.job_name),
            affected_users: [user]
          });
        }
      });
    });

    return conflicts;
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'scheduled': 'default',
      'in_progress': 'secondary',
      'completed': 'outline',
      'cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'normal': 'bg-blue-100 text-blue-800',
      'low': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors] || colors.normal}>
        {priority}
      </Badge>
    );
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-amber-500 bg-amber-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getUserDisplayName = (userId: string): string => {
    console.log('Getting display name for userId:', userId, 'teamMembers:', teamMembers);
    const member = teamMembers?.find(m => m.user_id === userId);
    console.log('Found member:', member);
    return member?.full_name || member?.email || 'Unknown User';
  };

  const getUsersDisplayNames = (userIds: string[]): string => {
    return userIds.map(id => getUserDisplayName(id)).join(', ');
  };

  const renderUserWithAvatar = (userId: string) => {
    const member = teamMembers?.find(m => m.user_id === userId);
    if (!member) return <span className="text-muted-foreground">Unknown User</span>;
    
    return (
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
             member.email?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span>{member.full_name || member.email}</span>
      </div>
    );
  };

  const renderUsersWithAvatars = (userIds: string[]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {userIds.map(userId => (
          <div key={userId}>{renderUserWithAvatar(userId)}</div>
        ))}
      </div>
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const getWeekDays = () => {
    const week = [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      week.push(addDays(start, i));
    }
    return week;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const hasScheduleOnDay = (date: Date) => {
    return schedules.some(item => 
      format(parseISO(item.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  };

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(item => 
      format(parseISO(item.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const handleAddShift = async () => {
    try {
      if (!newShift.job_name.trim()) {
        toast({
          title: "Error",
          description: "Please enter a job name.",
          variant: "destructive",
        });
        return;
      }

      if (newShift.assigned_user_ids.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one team member.",
          variant: "destructive",
        });
        return;
      }

      const startDateTime = newShift.is_all_day
        ? new Date(`${newShift.start_date}T00:00:00`)
        : new Date(`${newShift.start_date}T${newShift.start_time}`);
      
      const endDateTime = newShift.is_all_day
        ? new Date(`${newShift.end_date}T23:59:59`)
        : new Date(`${newShift.end_date}T${newShift.end_time}`);

      const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      const selectedMembers = teamMembers?.filter(m => 
        newShift.assigned_user_ids.includes(m.user_id)
      ) || [];

      const { error } = await supabase
        .from('job_schedules')
        .insert({
          job_name: newShift.job_name,
          location: newShift.location || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          description: newShift.description || null,
          priority: newShift.priority,
          color: newShift.color,
          status: 'scheduled',
          estimated_hours: hours,
          assigned_users: newShift.assigned_user_ids // Store as array of user IDs
        });

      if (error) throw error;

      toast({
        title: "Shift Created",
        description: "New shift has been added to the schedule.",
      });

      setIsAddDialogOpen(false);
      setNewShift({
        job_name: '',
        location: '',
        start_time: '08:00',
        end_time: '16:00',
        description: '',
        priority: 'normal',
        color: '#dc2626',
        is_all_day: false,
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        end_date: format(selectedDate, 'yyyy-MM-dd'),
        assigned_user_ids: [],
        project_id: null,
        project_name: null
      });
      setShiftAttachments([]);
      fetchScheduleData();
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: "Failed to create shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalHours = () => {
    if (newShift.is_all_day) return '24:00';
    if (!newShift.start_time || !newShift.end_time) return '0:00';
    
    const from = new Date(`${newShift.start_date}T${newShift.start_time}`);
    const to = new Date(`${newShift.end_date}T${newShift.end_time}`);
    const diff = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    const hours = Math.floor(diff);
    const minutes = Math.round((diff - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const colorOptions = [
    { color: '#dc2626', label: 'Red' },
    { color: '#7c3aed', label: 'Purple' },
    { color: '#2563eb', label: 'Blue' },
    { color: '#059669', label: 'Green' },
    { color: '#ea580c', label: 'Orange' },
  ];

  const selectedTeamMembers = teamMembers?.filter(m => 
    newShift.assigned_user_ids.includes(m.user_id)
  ) || [];

  const toggleUserSelection = (userId: string) => {
    setNewShift(prev => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.includes(userId)
        ? prev.assigned_user_ids.filter(id => id !== userId)
        : [...prev.assigned_user_ids, userId]
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setTaskAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setTaskAttachments(prev => prev.filter((_, i) => i !== index));
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
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const exportScheduleData = () => {
    const csvData = schedules.map(schedule => ({
      'Job Name': schedule.job_name,
      'Start Time': format(parseISO(schedule.start_time), 'MMM d, yyyy h:mm a'),
      'End Time': format(parseISO(schedule.end_time), 'MMM d, yyyy h:mm a'),
      'Location': schedule.location || '',
      'Status': schedule.status,
      'Priority': schedule.priority,
      'Assigned Users': getUsersDisplayNames(schedule.assigned_users),
      'Estimated Hours': schedule.estimated_hours || '',
      'Description': schedule.description || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${format(currentDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scheduling Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate time slots for the day (7 AM to 9 PM in 1-hour blocks)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get schedule position and height based on time
  const getScheduleStyle = (schedule: JobSchedule) => {
    const startTime = parseISO(schedule.start_time);
    const endTime = parseISO(schedule.end_time);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Calculate position from 7 AM
    const top = ((startHour - 7) * 60); // 60px per hour
    const height = ((endHour - startHour) * 60);
    
    return { top: `${top}px`, height: `${Math.max(height, 40)}px` };
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Job Scheduling
              </CardTitle>
              <CardDescription>
                Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')} • {schedules.length} jobs scheduled
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Shift
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg">Create New Shift</DialogTitle>
                    <DialogDescription className="text-sm">
                      Schedule a new job for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Shift Details Content */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
                      {/* All Day Toggle */}
                      <div className="flex items-center justify-between py-2 border-b">
                        <Label htmlFor="all-day" className="text-sm font-medium">All day</Label>
                        <Switch
                          id="all-day"
                          checked={newShift.is_all_day}
                          onCheckedChange={(checked) => setNewShift({ ...newShift, is_all_day: checked })}
                        />
                      </div>

                      {/* From Date/Time */}
                      <div className="flex items-center justify-between py-2 border-b">
                        <Label className="text-sm">From</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={newShift.start_date}
                            onChange={(e) => setNewShift({ ...newShift, start_date: e.target.value })}
                            className="w-[130px] h-8 text-xs border-none shadow-none text-right p-1"
                          />
                          {!newShift.is_all_day && (
                            <Input
                              type="time"
                              value={newShift.start_time}
                              onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                              className="w-[90px] h-8 text-xs text-primary font-medium"
                            />
                          )}
                        </div>
                      </div>

                      {/* To Date/Time */}
                      <div className="flex items-center justify-between py-2 border-b">
                        <Label className="text-sm">To</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={newShift.end_date}
                            onChange={(e) => setNewShift({ ...newShift, end_date: e.target.value })}
                            className="w-[130px] h-8 text-xs border-none shadow-none text-right p-1"
                          />
                          {!newShift.is_all_day && (
                            <Input
                              type="time"
                              value={newShift.end_time}
                              onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                              className="w-[90px] h-8 text-xs text-primary font-medium"
                            />
                          )}
                        </div>
                      </div>

                      {/* Breaks */}
                      <div className="flex items-center justify-between py-2 border-b">
                        <Label className="text-sm">Breaks</Label>
                        <Button variant="ghost" size="sm" className="text-primary h-8">
                          <Coffee className="w-3 h-3 mr-1" />
                          Add breaks
                        </Button>
                      </div>

                      {/* Total Hours Display */}
                      <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-md">
                        <Label className="text-sm font-medium">Total shift hours</Label>
                        <span className="text-base font-bold">{calculateTotalHours()}</span>
                      </div>

                      {/* Shift Title with Color Selector */}
                      <div className="space-y-1 py-2 border-b">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="job_name" className="text-sm font-medium">Shift title *</Label>
                          <div className="flex gap-1.5">
                            {colorOptions.map((option) => (
                              <button
                                key={option.color}
                                type="button"
                                onClick={() => setNewShift({ ...newShift, color: option.color })}
                                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                                  newShift.color === option.color ? 'border-foreground scale-110 ring-1 ring-offset-1' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: option.color }}
                                aria-label={option.label}
                              />
                            ))}
                          </div>
                        </div>
                        <Input
                          id="job_name"
                          value={newShift.job_name}
                          onChange={(e) => setNewShift({ ...newShift, job_name: e.target.value })}
                          placeholder="Type here"
                          className="h-9"
                        />
                      </div>

                      {/* Job/Project Selection */}
                      <div 
                        className="flex items-center justify-between py-2 border-b cursor-pointer hover:bg-muted/50 rounded"
                        onClick={() => setIsProjectSelectionOpen(true)}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm cursor-pointer">Job</Label>
                        </div>
                        {newShift.project_name && (
                          <span className="text-sm text-foreground font-medium">
                            {newShift.project_name}
                          </span>
                        )}
                      </div>

                      {/* Team Members Selection */}
                      <div className="space-y-2 py-2 border-b">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            <Users className="w-3 h-3 inline mr-1" />
                            Users *
                          </Label>
                          {selectedTeamMembers.length > 0 && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {selectedTeamMembers.length} selected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="border rounded-md p-2 max-h-28 overflow-y-auto space-y-1">
                          {teamMembers && teamMembers.length > 0 ? (
                            teamMembers.map((member) => (
                              <div
                                key={member.user_id}
                                className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer transition-colors"
                                onClick={() => toggleUserSelection(member.user_id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={newShift.assigned_user_ids.includes(member.user_id)}
                                  onChange={() => {}}
                                  className="w-3 h-3 rounded border-gray-300"
                                />
                                <Avatar className="h-5 w-5">
                                  {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                                  <AvatarFallback className="bg-primary/10 text-primary text-[8px]">
                                    {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-xs font-medium truncate flex-1">{member.full_name || member.email}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No team members available
                            </p>
                          )}
                        </div>

                        {/* Selected Members Display */}
                        {selectedTeamMembers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedTeamMembers.map((member) => (
                              <div
                                key={member.user_id}
                                className="flex items-center gap-1 bg-muted rounded-full pl-0.5 pr-2 py-0.5"
                              >
                                <Avatar className="h-5 w-5">
                                  {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                                  <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                                    {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{member.full_name?.split(' ')[0] || member.email.split('@')[0]}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="space-y-1 py-2 border-b">
                        <Label htmlFor="location" className="text-sm">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Location
                        </Label>
                        <GooglePlacesAutocomplete
                          value={newShift.location}
                          onChange={(value) => setNewShift({ ...newShift, location: value })}
                          placeholder="Enter job location"
                        />
                      </div>

                      {/* Attachments */}
                      <div className="py-2 border-b space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-muted-foreground" />
                            <Label className="text-sm">Attachments</Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-primary h-8 w-8"
                            onClick={() => shiftFileInputRef.current?.click()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <input
                          ref={shiftFileInputRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setShiftAttachments(prev => [...prev, ...files]);
                          }}
                          className="hidden"
                        />

                        {shiftAttachments.length > 0 && (
                          <div className="space-y-1">
                            {shiftAttachments.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <ImageIcon className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs flex-1 truncate">{file.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => setShiftAttachments(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Priority and Description */}
                      <div className="grid grid-cols-2 gap-2 py-2">
                        <div className="space-y-1">
                          <Label htmlFor="priority" className="text-xs">Priority</Label>
                          <Select 
                            value={newShift.priority} 
                            onValueChange={(value) => setNewShift({ ...newShift, priority: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="description" className="text-xs">Notes</Label>
                          <Input
                            id="description"
                            value={newShift.description}
                            onChange={(e) => setNewShift({ ...newShift, description: e.target.value })}
                            placeholder="Add notes..."
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <ProjectSelectionModal
                      open={isProjectSelectionOpen}
                      onClose={() => setIsProjectSelectionOpen(false)}
                      onSelectProject={(projectId, projectName, projectAddress) => {
                        setNewShift({ 
                          ...newShift, 
                          project_id: projectId, 
                          project_name: projectName,
                          location: projectAddress || newShift.location
                        });
                        setIsProjectSelectionOpen(false);
                      }}
                    />
                  </div>

                  {/* Footer with Delete, Save Draft, and Publish buttons */}
                  <DialogFooter className="flex-row gap-2 sm:gap-2 border-t pt-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this draft?')) {
                          setIsAddDialogOpen(false);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        toast({
                          title: "Draft Saved",
                          description: "Shift draft has been saved successfully.",
                        });
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save draft
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleAddShift}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publish shift
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportScheduleData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mini Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-6">
            {/* Mini Calendar */}
            <div className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    const prev = new Date(currentDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentDate(prev);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold text-sm">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const next = new Date(currentDate);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentDate(next);
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-xs text-muted-foreground font-medium py-1">{day}</div>
                ))}
                {(() => {
                  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
                  const days = [];
                  
                  // Empty cells before first day
                  for (let i = 0; i < startDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-8" />);
                  }
                  
                  // Days of month
                  for (let d = 1; d <= lastDay.getDate(); d++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const hasSchedule = schedules.some(s => 
                      format(parseISO(s.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    );
                    
                    days.push(
                      <button
                        key={d}
                        onClick={() => setSelectedDate(date)}
                        className={`h-8 w-8 rounded-full text-sm relative flex items-center justify-center transition-colors
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isToday && !isSelected ? 'border-2 border-primary text-primary font-semibold' : ''}
                          ${!isSelected && !isToday ? 'hover:bg-muted' : ''}
                        `}
                      >
                        {d}
                        {hasSchedule && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
            
            {/* Week Schedule View */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date, index) => {
                  const daySchedules = getSchedulesForDate(date);
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-2 min-h-[180px] cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-center mb-2">
                        <span className="text-xs text-muted-foreground font-medium block">
                          {dayNames[index]}
                        </span>
                        <span className={`text-lg font-semibold ${
                          isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                        }`}>
                          {date.getDate()}
                        </span>
                      </div>
                      
                      {/* Schedules as compact rows */}
                      <div className="space-y-1">
                        {daySchedules.slice(0, 5).map((schedule) => {
                          const assignedUsers = Array.isArray(schedule.assigned_users) ? schedule.assigned_users : [];
                          
                          return (
                            <div
                              key={schedule.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShift(schedule);
                                setIsViewDialogOpen(true);
                              }}
                              className="rounded px-2 py-1 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1"
                              style={{ backgroundColor: schedule.color || '#dc2626' }}
                            >
                              <span className="font-medium shrink-0">
                                {format(parseISO(schedule.start_time), 'h:mma').toLowerCase()}
                              </span>
                              <span className="truncate flex-1">{schedule.job_name}</span>
                              {assignedUsers.length > 0 && (
                                <div className="flex -space-x-1">
                                  {assignedUsers.slice(0, 2).map(userId => {
                                    const member = teamMembers?.find(m => m.user_id === userId);
                                    return member ? (
                                      <Avatar key={userId} className="w-4 h-4 border border-white">
                                        <AvatarImage src={member.avatar_url || undefined} />
                                        <AvatarFallback className="text-[6px] bg-white/30 text-white">
                                          {member.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {daySchedules.length > 5 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{daySchedules.length - 5} more
                          </div>
                        )}
                        {daySchedules.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-4">
                            No jobs
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View/Edit Shift Details Dialog */}
      <Dialog 
        open={isViewDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setEditableShift(null);
          }
          setIsViewDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {isEditing ? 'Edit Shift' : 'Shift Details'}
              </div>
              {!isEditing && selectedShift && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                    setEditableShift(selectedShift);
                    setEditableDescription(selectedShift.description || '');
                    setEditableStatus(selectedShift.status);
                    setEditablePriority(selectedShift.priority);
                    setEditableAssignedUsers([...selectedShift.assigned_users]);
                    setEditableAttachments(selectedShift.attachments || []);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Shift Header with Color */}
              <div 
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: selectedShift.color || '#dc2626' }}
              >
                <h3 className="text-xl font-bold mb-2">{selectedShift.job_name}</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Clock className="w-4 h-4" />
                  {format(parseISO(selectedShift.start_time), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90 mt-1">
                  <Clock className="w-4 h-4" />
                  {format(parseISO(selectedShift.start_time), 'h:mm a')} - {format(parseISO(selectedShift.end_time), 'h:mm a')}
                  {selectedShift.estimated_hours && (
                    <span className="ml-2">• {selectedShift.estimated_hours}h estimated</span>
                  )}
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status</Label>
                  {isEditing ? (
                    <Select value={editableStatus} onValueChange={setEditableStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getStatusBadge(selectedShift.status)}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Priority</Label>
                  {isEditing ? (
                    <Select value={editablePriority} onValueChange={setEditablePriority}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getPriorityBadge(selectedShift.priority)}</div>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedShift.location && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <p className="text-sm text-muted-foreground pl-6">{selectedShift.location}</p>
                </div>
              )}

              {/* Work Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Work Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    placeholder="Enter work description, notes, or instructions..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedShift.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Tasks Section */}
              <div className="border rounded-lg p-3">
                <ShiftTasksSection shiftId={selectedShift.id} isEditing={isEditing} />
              </div>

              {/* Attachments Section */}
              <div className="border rounded-lg p-3">
                <ShiftAttachmentsSection 
                  shiftId={selectedShift.id}
                  attachments={isEditing ? editableAttachments : (selectedShift.attachments || [])}
                  isEditing={isEditing}
                  onAttachmentsChange={setEditableAttachments}
                />
              </div>

              {/* Assigned Team Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assigned Team Members ({isEditing ? editableAssignedUsers.length : selectedShift.assigned_users.length})
                  </Label>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMemberSelectModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {(isEditing ? editableAssignedUsers : selectedShift.assigned_users).map(userId => {
                    const member = teamMembers?.find(m => m.user_id === userId);
                    return member ? (
                      <div key={userId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.full_name || member.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setEditableAssignedUsers(prev => prev.filter(id => id !== userId))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div key={userId} className="text-sm text-muted-foreground">Unknown user</div>
                    );
                  })}
                  {(isEditing ? editableAssignedUsers : selectedShift.assigned_users).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No team members assigned</p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created: {format(parseISO(selectedShift.created_at), 'MMM d, yyyy h:mm a')}</span>
                  <span>Updated: {format(parseISO(selectedShift.updated_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditableShift(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!selectedShift) return;
                    setSavingShift(true);
                    try {
                      const { error } = await supabase
                        .from('job_schedules')
                        .update({
                          description: editableDescription,
                          status: editableStatus,
                          priority: editablePriority,
                          assigned_users: editableAssignedUsers,
                          attachments: JSON.parse(JSON.stringify(editableAttachments))
                        })
                        .eq('id', selectedShift.id);
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Shift Updated",
                        description: "Shift has been successfully updated."
                      });
                      
                      // Update local state
                      setSelectedShift({
                        ...selectedShift,
                        description: editableDescription,
                        status: editableStatus,
                        priority: editablePriority,
                        assigned_users: editableAssignedUsers,
                        attachments: editableAttachments
                      });
                      
                      setIsEditing(false);
                      fetchScheduleData();
                      queryClient.invalidateQueries({ queryKey: ['shift-tasks', selectedShift.id] });
                    } catch (error) {
                      console.error('Error updating shift:', error);
                      toast({
                        title: "Error",
                        description: "Failed to update shift.",
                        variant: "destructive"
                      });
                    } finally {
                      setSavingShift(false);
                    }
                  }}
                  disabled={savingShift}
                >
                  {savingShift ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Selection Modal for Edit Mode */}
      <UserSelectionModal 
        isOpen={showMemberSelectModal} 
        onClose={() => setShowMemberSelectModal(false)} 
        onSelect={(userId, userName, avatarUrl) => {
          if (!editableAssignedUsers.includes(userId)) {
            setEditableAssignedUsers(prev => [...prev, userId]);
          }
          setShowMemberSelectModal(false);
        }} 
      />

      {/* Conflicts Alert */}
      <Card className={conflicts.length > 0 ? "border-amber-500 bg-amber-50" : "border-green-500 bg-green-50"}>
        <CardHeader 
          className={`cursor-pointer transition-colors ${conflicts.length > 0 ? 'hover:bg-amber-100/50' : 'hover:bg-green-100/50'}`}
          onClick={() => setIsConflictsExpanded(!isConflictsExpanded)}
        >
          <CardTitle className={`flex items-center justify-between ${conflicts.length > 0 ? 'text-amber-800' : 'text-green-800'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {conflicts.length > 0 
                ? `Schedule Conflicts Detected (${conflicts.length})` 
                : 'No Schedule Conflicts'}
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${isConflictsExpanded ? 'rotate-180' : ''}`} />
          </CardTitle>
        </CardHeader>
        {isConflictsExpanded && (
          <CardContent>
            {conflicts.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <div className="w-6 h-8 border-green-600 border-r-2 border-b-2 transform rotate-45 -translate-y-1" />
                </div>
                <p className="text-green-800 font-medium">All clear!</p>
                <p className="text-sm text-green-700/70">No scheduling conflicts detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getConflictSeverityColor(conflict.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{conflict.description}</p>
                      <Badge variant={conflict.severity === 'high' ? 'destructive' : 'secondary'}>
                        {conflict.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <p>Affected jobs: {conflict.affected_jobs.join(', ')}</p>
                      <div>
                        <p className="mb-1">Affected users:</p>
                        {renderUsersWithAvatars(conflict.affected_users)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Task Modals */}
      <UserSelectionModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
        onSelect={(userId, userName, avatarUrl) => {
          setTaskAssignedUserId(userId);
          setTaskAssignedUserName(userName);
          setTaskAssignedUserAvatar(avatarUrl);
          setShowUserModal(false);
        }} 
      />

      <LabelSelectionModal 
        isOpen={showLabelModal} 
        onClose={() => setShowLabelModal(false)} 
        selectedLabels={taskSelectedLabels} 
        onConfirm={(labels) => {
          setTaskSelectedLabels(labels);
          setShowLabelModal(false);
        }} 
      />

      <LocationSelectionModal 
        isOpen={showLocationModal} 
        onClose={() => setShowLocationModal(false)} 
        onSelect={(loc) => {
          setTaskLocation(loc);
          setShowLocationModal(false);
        }} 
      />

      <SubTasksModal 
        isOpen={showSubTasksModal} 
        onClose={() => setShowSubTasksModal(false)} 
        subTasks={taskSubTasks} 
        onSave={(tasks) => {
          setTaskSubTasks(tasks);
          setShowSubTasksModal(false);
        }} 
      />
    </div>
  );
};

export default SchedulingOverview;