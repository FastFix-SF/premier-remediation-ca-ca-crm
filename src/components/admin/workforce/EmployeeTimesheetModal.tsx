import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ChevronLeft, ChevronRight, MessageSquare, ChevronDown, X, AlertTriangle, Trash2, DollarSign, Plus, MapPin } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ScrollArea, ScrollBar } from '../../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Input } from '../../ui/input';
import JobProjectSelector from './JobProjectSelector';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import AddShiftModal from './AddShiftModal';
import { generateTimesheetPdf } from './generateTimesheetPdf';
import { sendSmsNotification } from '@/utils/sendSmsNotification';

// Location display component that fetches address from coordinates
const LocationDisplay: React.FC<{ location: string }> = ({ location }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      // Check if it looks like coordinates (contains comma and valid lat/lng numbers)
      const parts = location.split(',').map(s => s.trim());
      if (parts.length === 2) {
        const latitude = parseFloat(parts[0]);
        const longitude = parseFloat(parts[1]);
        
        // Valid latitude: -90 to 90, Valid longitude: -180 to 180
        const isValidCoords = 
          !isNaN(latitude) && !isNaN(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180;
        
        if (isValidCoords) {
          try {
            const { data, error } = await supabase.functions.invoke('reverse-geocode', {
              body: { latitude, longitude }
            });

            if (!error && data?.address) {
              setAddress(data.address);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Reverse geocode error:', err);
            // Fall through to show original location
          }
        }
      }
      
      // Not valid coordinates or geocoding failed - use as-is
      setAddress(location);
      setIsLoading(false);
    };

    fetchAddress();
  }, [location]);

  if (isLoading) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }

  return <span>{address}</span>;
};

// Inline editable time cell component
interface EditableTimeCellProps {
  value: string | undefined;
  entryId: string;
  field: 'clock_in' | 'clock_out';
  onSave: (entryId: string, field: string, value: string) => void;
  isConflicting?: boolean;
  location?: string;
}

const EditableTimeCell: React.FC<EditableTimeCellProps> = ({ value, entryId, field, onSave, isConflicting, location }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (value) {
      // Convert display time to input format (HH:mm)
      const date = parseISO(value);
      setEditValue(format(date, 'HH:mm'));
    } else {
      setEditValue('');
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue) {
      const [hours, minutes] = editValue.split(':').map(Number);
      let newDate: Date;
      
      if (value) {
        // Combine the original date with new time
        const originalDate = parseISO(value);
        newDate = new Date(originalDate);
      } else {
        // No existing value - use today's date as base
        newDate = new Date();
      }
      
      newDate.setHours(hours, minutes, 0, 0);
      onSave(entryId, field, newDate.toISOString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="time"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-24 text-sm"
      />
    );
  }

  const displayTime = value ? format(parseISO(value), 'h:mm a') : '--';

  const timeSpan = (
    <span 
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors",
        isConflicting && "text-red-700"
      )}
    >
      {displayTime}
    </span>
  );

  if (location) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {timeSpan}
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5 max-w-xs">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <LocationDisplay location={location} />
        </TooltipContent>
      </Tooltip>
    );
  }

  return timeSpan;
};

// Inline editable break cell component
interface EditableBreakCellProps {
  value: number;
  entryId: string;
  onSave: (entryId: string, value: number) => void;
  location?: string;
}

const EditableBreakCell: React.FC<EditableBreakCellProps> = ({ value, entryId, onSave, location }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const minutes = parseInt(editValue) || 0;
    onSave(entryId, minutes);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          min="0"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 w-16 text-sm"
        />
        <span className="text-xs text-muted-foreground">m</span>
      </div>
    );
  }

  const breakSpan = (
    <span 
      onClick={handleClick}
      className="cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors text-muted-foreground text-sm"
    >
      {value > 0 ? `${value}m` : '--'}
    </span>
  );

  if (location && value > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {breakSpan}
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5 max-w-xs">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <LocationDisplay location={location} />
        </TooltipContent>
      </Tooltip>
    );
  }

  return breakSpan;
};
interface EmployeeTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    user_id: string;
    full_name: string | null;
    avatar_url?: string | null;
    email?: string;
    class_code?: string | null;
  } | null;
  initialWeekStart?: Date;
}
interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  break_time_minutes: number;
  project_name?: string;
  status: string;
  notes?: string;
  location?: string;
}
const EmployeeTimesheetModal: React.FC<EmployeeTimesheetModalProps> = ({
  isOpen,
  onClose,
  employee,
  initialWeekStart
}) => {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => 
    initialWeekStart ? startOfWeek(initialWeekStart, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // Update week when initialWeekStart changes (e.g., clicking different employee from different week view)
  React.useEffect(() => {
    if (initialWeekStart) {
      setSelectedWeekStart(startOfWeek(initialWeekStart, { weekStartsOn: 1 }));
    }
  }, [initialWeekStart]);
  const [dayFilter, setDayFilter] = useState('all');
  const weekEnd = endOfWeek(selectedWeekStart, {
    weekStartsOn: 1
  });
  const daysInWeek = eachDayOfInterval({
    start: selectedWeekStart,
    end: weekEnd
  });
  const {
    data: timeEntries = []
  } = useQuery({
    queryKey: ['employee-timesheet', employee?.user_id, selectedWeekStart],
    queryFn: async () => {
      if (!employee?.user_id) return [];
      const {
        data,
        error
      } = await supabase.from('time_clock').select('*').eq('user_id', employee.user_id).gte('clock_in', selectedWeekStart.toISOString()).lte('clock_in', weekEnd.toISOString()).order('clock_in', {
        ascending: true
      });
      if (error) throw error;
      return (data || []) as TimeEntry[];
    },
    enabled: !!employee?.user_id && isOpen
  });

  // Fetch approved employee requests for this week to show notes
  const { data: approvedRequests = [] } = useQuery({
    queryKey: ['employee-approved-requests', employee?.user_id, selectedWeekStart],
    queryFn: async () => {
      if (!employee?.user_id) return [];
      const weekStartStr = format(selectedWeekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('employee_requests')
        .select('id, shift_start_date, shift_start_time, notes, explanation, request_type')
        .eq('user_id', employee.user_id)
        .eq('status', 'approved')
        .gte('shift_start_date', weekStartStr)
        .lte('shift_start_date', weekEndStr);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.user_id && isOpen
  });

  // Helper to get employee notes for a specific entry date
  const getEmployeeNotes = (entryDate: Date): string | null => {
    const dateStr = format(entryDate, 'yyyy-MM-dd');
    const matchingRequest = approvedRequests.find(
      req => req.shift_start_date === dateStr
    );
    if (matchingRequest) {
      return matchingRequest.notes || matchingRequest.explanation || null;
    }
    return null;
  };

  // Fetch employee's saved pay rate and class code from database
  const { data: savedEmployeeData } = useQuery({
    queryKey: ['employee-settings-timesheet', employee?.user_id],
    queryFn: async () => {
      if (!employee?.user_id) return null;
      
      // Fetch class_code and hourly_rate from team_directory
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('class_code, hourly_rate')
        .eq('user_id', employee.user_id)
        .maybeSingle();
      
      return {
        class_code: teamData?.class_code || null,
        hourly_rate: teamData?.hourly_rate || 25
      };
    },
    enabled: !!employee?.user_id && isOpen,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const [hourlyRate, setHourlyRate] = useState<number>(25);
  const [rateInputValue, setRateInputValue] = useState<string>('25');
  const [showRatePopover, setShowRatePopover] = useState(false);
  const [showEmployeePopover, setShowEmployeePopover] = useState(false);
  const [classCodeValue, setClassCodeValue] = useState('');
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [addShiftDefaults, setAddShiftDefaults] = useState<{ date: Date; jobName?: string } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [showSmsPopover, setShowSmsPopover] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  
  // Sync with saved data from database
  useEffect(() => {
    if (savedEmployeeData) {
      if (savedEmployeeData.hourly_rate) {
        setHourlyRate(savedEmployeeData.hourly_rate);
        setRateInputValue(savedEmployeeData.hourly_rate.toString());
      }
      if (savedEmployeeData.class_code) {
        setClassCodeValue(savedEmployeeData.class_code);
      }
    }
  }, [savedEmployeeData]);
  
  const totalRegularHours = timeEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
  const totalBreakMinutes = timeEntries.reduce((sum, e) => sum + (e.break_time_minutes || 0), 0);
  const workedDays = new Set(timeEntries.map(e => format(parseISO(e.clock_in), 'yyyy-MM-dd'))).size;
  const totalPay = totalRegularHours * hourlyRate;
  const queryClient = useQueryClient();
  
  const handleSaveRate = async () => {
    const rate = parseFloat(rateInputValue);
    if (!isNaN(rate) && rate >= 0 && employee?.user_id) {
      try {
        const { error } = await supabase
          .from('team_directory')
          .update({ hourly_rate: rate })
          .eq('user_id', employee.user_id);
        
        if (error) throw error;
        
        setHourlyRate(rate);
        setShowRatePopover(false);
        queryClient.invalidateQueries({ queryKey: ['employee-settings-timesheet'] });
        toast.success(`Rate saved: $${rate.toFixed(2)}/hr`);
      } catch (error) {
        console.error('Error saving rate:', error);
        toast.error('Failed to save rate');
      }
    }
  };

  const CLASS_CODES = [
    'Carpentry',
    'Clerical Office',
    'Painting',
    'Roofing All Kinds',
    'Sheet Metal',
  ];

  const handleSaveEmployeeSettings = async () => {
    if (!employee?.user_id) return;
    
    const rate = parseFloat(rateInputValue);
    const validRate = !isNaN(rate) && rate >= 0 ? rate : 25;
    
    try {
      // Save both class code and hourly rate to team_directory
      const { error } = await supabase
        .from('team_directory')
        .update({ 
          class_code: classCodeValue || null,
          hourly_rate: validRate
        })
        .eq('user_id', employee.user_id);
      
      if (error) throw error;
      
      setHourlyRate(validRate);
      setShowEmployeePopover(false);
      queryClient.invalidateQueries({ queryKey: ['employee-settings-timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleSendSms = async () => {
    if (!employee?.user_id || !smsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setIsSendingSms(true);
    try {
      const result = await sendSmsNotification({
        userId: employee.user_id,
        title: '📋 Timesheet Message',
        body: smsMessage.trim(),
        data: { type: 'timesheet_message' }
      });
      
      if (result.success) {
        toast.success(`SMS sent to ${employee.full_name}`);
        setSmsMessage('');
        setShowSmsPopover(false);
      } else {
        toast.error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleApprove = async () => {
    if (timeEntries.length === 0) {
      toast.error('No time entries to approve');
      return;
    }
    
    setIsApproving(true);
    try {
      const entryIds = timeEntries.map(e => e.id);
      const { error } = await supabase
        .from('time_clock')
        .update({ status: 'approved' })
        .in('id', entryIds);
      
      if (error) throw error;
      
      toast.success(`Approved ${entryIds.length} time entries`);
      queryClient.invalidateQueries({ queryKey: ['employee-timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['today-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['workforce-timesheets-summary'] });
    } catch (error) {
      console.error('Error approving entries:', error);
      toast.error('Failed to approve time entries');
    } finally {
      setIsApproving(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  const formatTime = (dateString?: string) => {
    if (!dateString) return '--';
    return format(parseISO(dateString), 'h:mm a');
  };
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(selectedWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(startOfWeek(newDate, {
      weekStartsOn: 1
    }));
  };

  const handleExportPdf = () => {
    if (!employee) return;
    generateTimesheetPdf({
      employeeName: employee.full_name || 'Unknown',
      classCode: employee.class_code,
      weekStart: selectedWeekStart,
      entries: timeEntries,
      totalRegularHours,
      totalBreakMinutes
    });
  };

  const handleExportCsv = () => {
    if (!employee) return;
    
    const headers = ['Date', 'Clock In', 'Clock Out', 'Break (min)', 'Total Hours', 'Job/Project'];
    const rows = timeEntries.map(entry => {
      const clockIn = entry.clock_in ? format(parseISO(entry.clock_in), 'h:mm a') : '-';
      const clockOut = entry.clock_out ? format(parseISO(entry.clock_out), 'h:mm a') : '-';
      const date = format(parseISO(entry.clock_in), 'MMM dd, yyyy');
      return [
        date,
        clockIn,
        clockOut,
        entry.break_time_minutes?.toString() || '0',
        entry.total_hours?.toFixed(2) || '0.00',
        entry.project_name || '-'
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timesheet_${employee.full_name?.replace(/\s+/g, '_') || 'employee'}_${format(selectedWeekStart, 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('CSV exported successfully');
  };

  const handleExportXlsx = () => {
    if (!employee) return;
    
    // Create a simple XLSX-compatible format using CSV with .xlsx extension
    // For a proper XLSX, you'd use a library like xlsx or exceljs
    const headers = ['Date', 'Clock In', 'Clock Out', 'Break (min)', 'Total Hours', 'Job/Project'];
    const rows = timeEntries.map(entry => {
      const clockIn = entry.clock_in ? format(parseISO(entry.clock_in), 'h:mm a') : '-';
      const clockOut = entry.clock_out ? format(parseISO(entry.clock_out), 'h:mm a') : '-';
      const date = format(parseISO(entry.clock_in), 'MMM dd, yyyy');
      return [date, clockIn, clockOut, entry.break_time_minutes?.toString() || '0', entry.total_hours?.toFixed(2) || '0.00', entry.project_name || '-'];
    });
    
    // Add summary row
    rows.push([]);
    rows.push(['Total Hours:', '', '', '', totalRegularHours.toFixed(2), '']);
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join('\t')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timesheet_${employee.full_name?.replace(/\s+/g, '_') || 'employee'}_${format(selectedWeekStart, 'yyyy-MM-dd')}.xlsx`;
    link.click();
    toast.success('XLSX exported successfully');
  };

  const entriesByDate = daysInWeek.map((day, index) => {
    const dayEntries = timeEntries.filter(e => isSameDay(parseISO(e.clock_in), day));
    const dailyTotal = dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    const dailyPay = dailyTotal * hourlyRate;
    return {
      date: day,
      entries: dayEntries,
      dailyTotal,
      dailyPay
    };
  });

  // Calculate running weekly totals (cumulative from start of week)
  let runningTotal = 0;
  let runningPay = 0;
  const entriesWithRunningTotal = entriesByDate.map(dayData => {
    runningTotal += dayData.dailyTotal;
    runningPay += dayData.dailyPay;
    return {
      ...dayData,
      weeklyTotal: runningTotal,
      weeklyPay: runningPay
    };
  });

  // Detect overlapping time entries (conflicts)
  const conflicts = useMemo(() => {
    const conflictList: { date: Date; entries: [TimeEntry, TimeEntry] }[] = [];
    
    entriesByDate.forEach(dayData => {
      const entries = dayData.entries;
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const entry1 = entries[i];
          const entry2 = entries[j];
          
          const start1 = parseISO(entry1.clock_in).getTime();
          const end1 = entry1.clock_out ? parseISO(entry1.clock_out).getTime() : Date.now();
          const start2 = parseISO(entry2.clock_in).getTime();
          const end2 = entry2.clock_out ? parseISO(entry2.clock_out).getTime() : Date.now();
          
          // Check if ranges overlap
          if (start1 < end2 && start2 < end1) {
            conflictList.push({ date: dayData.date, entries: [entry1, entry2] });
          }
        }
      }
    });
    
    return conflictList;
  }, [entriesByDate]);

  const hasConflicts = conflicts.length > 0;
  const [showConflicts, setShowConflicts] = useState(false);
  const conflictEntryIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach(c => {
      ids.add(c.entries[0].id);
      ids.add(c.entries[1].id);
    });
    return ids;
  }, [conflicts]);

  // Selection state for delete functionality
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  // Mutation for updating time entries
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, updates }: { entryId: string; updates: Partial<TimeEntry> }) => {
      // If updating clock_in or clock_out, recalculate total_hours
      let finalUpdates = { ...updates };
      
      if (updates.clock_in || updates.clock_out) {
        const entry = timeEntries.find(e => e.id === entryId);
        if (entry) {
          const clockIn = updates.clock_in ? parseISO(updates.clock_in) : parseISO(entry.clock_in);
          const clockOut = updates.clock_out ? parseISO(updates.clock_out) : (entry.clock_out ? parseISO(entry.clock_out) : null);
          
          if (clockOut) {
            const diffMs = clockOut.getTime() - clockIn.getTime();
            const breakMs = (entry.break_time_minutes || 0) * 60 * 1000;
            const totalHours = (diffMs - breakMs) / (1000 * 60 * 60);
            finalUpdates.total_hours = Math.max(0, totalHours);
          }
        }
      }
      
      const { error } = await supabase
        .from('time_clock')
        .update(finalUpdates)
        .eq('id', entryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all timesheet-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['employee-timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['today-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['workforce-timesheets-summary'] });
      toast.success('Time entry updated');
    },
    onError: (error) => {
      console.error('Error updating entry:', error);
      toast.error('Failed to update time entry');
    }
  });

  const handleTimeUpdate = (entryId: string, field: string, value: string) => {
    updateEntryMutation.mutate({ entryId, updates: { [field]: value } });
  };

  const handleBreakUpdate = (entryId: string, minutes: number) => {
    // Also recalculate total_hours when break changes
    const entry = timeEntries.find(e => e.id === entryId);
    if (entry && entry.clock_out) {
      const clockIn = parseISO(entry.clock_in);
      const clockOut = parseISO(entry.clock_out);
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const breakMs = minutes * 60 * 1000;
      const totalHours = Math.max(0, (diffMs - breakMs) / (1000 * 60 * 60));
      
      updateEntryMutation.mutate({ 
        entryId, 
        updates: { 
          break_time_minutes: minutes,
          total_hours: totalHours
        } 
      });
    } else {
      updateEntryMutation.mutate({ entryId, updates: { break_time_minutes: minutes } });
    }
  };

  const handleRowClick = (entryId: string, e: React.MouseEvent) => {
    // Ignore clicks on buttons/interactive elements
    if ((e.target as HTMLElement).closest('button, [role="combobox"], [data-radix-popper-content-wrapper]')) {
      return;
    }
    setSelectedEntryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleDateClick = (dayEntries: TimeEntry[], e: React.MouseEvent) => {
    e.stopPropagation();
    const entryIds = dayEntries.map(e => e.id);
    setSelectedEntryIds(prev => {
      const newSet = new Set(prev);
      const allSelected = entryIds.every(id => prev.has(id));
      if (allSelected) {
        entryIds.forEach(id => newSet.delete(id));
      } else {
        entryIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedEntryIds.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('time_clock')
        .delete()
        .in('id', Array.from(selectedEntryIds));
      
      if (error) throw error;
      
      toast.success(`Deleted ${selectedEntryIds.size} time ${selectedEntryIds.size === 1 ? 'entry' : 'entries'}`);
      setSelectedEntryIds(new Set());
      // Invalidate all timesheet-related queries
      queryClient.invalidateQueries({ queryKey: ['employee-timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['today-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['workforce-timesheets-summary'] });
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error('Failed to delete entries');
    }
  };

  const clearSelection = () => {
    setSelectedEntryIds(new Set());
  };
  if (!employee) return null;
  const initials = (employee.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[98vw] !max-w-[2200px] h-[95vh] max-h-[95vh] p-0 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-background flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Employee info with popover */}
            <Popover open={showEmployeePopover} onOpenChange={setShowEmployeePopover}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                  <div className="relative">
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                      {employee.avatar_url && <AvatarImage src={employee.avatar_url} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{employee.full_name || 'Unknown'}</h2>
                    {(classCodeValue || employee.class_code) && (
                      <p className="text-xs text-muted-foreground">{classCodeValue || employee.class_code}</p>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4" align="start">
                <div className="space-y-4">
                  <div className="font-semibold text-sm">Employee Settings</div>
                  
                  {/* Class Code Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Class Code</label>
                    <Select value={classCodeValue} onValueChange={setClassCodeValue}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class code" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_CODES.map((code) => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Hourly Rate */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Hourly Rate</label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={rateInputValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d*$/.test(val)) {
                            setRateInputValue(val);
                          }
                        }}
                        className="h-9"
                        placeholder="25"
                      />
                      <span className="text-muted-foreground text-sm">/hr</span>
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full" onClick={handleSaveEmployeeSettings}>
                    Save Settings
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover open={showSmsPopover} onOpenChange={setShowSmsPopover}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">
                    Send SMS to {employee?.full_name}
                  </div>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full h-24 p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    maxLength={300}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {smsMessage.length}/300
                    </span>
                    <Button 
                      size="sm" 
                      onClick={handleSendSms}
                      disabled={!smsMessage.trim() || isSendingSms}
                    >
                      {isSendingSms ? 'Sending...' : 'Send SMS'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Pay period selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium">Pay period:</span>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-1 py-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold px-2">
                  {format(selectedWeekStart, 'MM/dd')} to {format(weekEnd, 'MM/dd')}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                <SelectItem value="worked">Worked</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Set Rate Button */}
            <Popover open={showRatePopover} onOpenChange={setShowRatePopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  ${hourlyRate.toFixed(2)}/hr
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Set Hourly Rate</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      value={rateInputValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                          setRateInputValue(val);
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRate()}
                      className="h-8"
                      placeholder="25.00"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: ${(totalRegularHours * parseFloat(rateInputValue || '0')).toFixed(2)}
                  </div>
                  <Button size="sm" className="w-full" onClick={handleSaveRate}>
                    Apply Rate
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Popover open={showConflicts} onOpenChange={setShowConflicts}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5",
                    hasConflicts && "bg-red-50 border-red-400 animate-emergency-blink"
                  )}
                >
                  {hasConflicts && <AlertTriangle className="h-3.5 w-3.5" />}
                  Conflicts {hasConflicts && `(${conflicts.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0 bg-background" align="end">
                <div className="p-3 border-b bg-red-50">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Time Conflicts Detected
                  </h4>
                  <p className="text-xs text-red-600 mt-1">
                    {conflicts.length} overlapping time {conflicts.length === 1 ? 'entry' : 'entries'} found
                  </p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {conflicts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No conflicts found
                    </div>
                  ) : (
                    conflicts.map((conflict, idx) => (
                      <div key={idx} className="p-3 border-b last:border-0 hover:bg-muted/30">
                        <div className="font-medium text-sm mb-2">
                          {format(conflict.date, 'EEE M/d')}
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 p-1.5 rounded bg-red-50 border border-red-200">
                            <span className="font-medium text-red-700">Entry 1:</span>
                            <span>{formatTime(conflict.entries[0].clock_in)} - {formatTime(conflict.entries[0].clock_out)}</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded bg-red-50 border border-red-200">
                            <span className="font-medium text-red-700">Entry 2:</span>
                            <span>{formatTime(conflict.entries[1].clock_in)} - {formatTime(conflict.entries[1].clock_out)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Add <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover">
                <DropdownMenuItem onSelect={() => {
                  setAddShiftDefaults({ date: selectedWeekStart });
                  setShowAddShiftModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Export <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover">
                <DropdownMenuItem onSelect={handleExportPdf}>
                  Timesheets PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportCsv}>
                  Timesheets CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportXlsx}>
                  Timesheets XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={handleApprove}
              disabled={isApproving || timeEntries.length === 0}
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats Bar */}
        <div className="px-6 py-2 border-b bg-muted/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-background/60 rounded-md px-3 py-1.5">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-foreground">{formatHours(totalRegularHours)}</span>
                <span className="text-muted-foreground">Regular</span>
              </div>
              <span className="text-muted-foreground">+</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">00:00</span>
                <span className="text-muted-foreground">PTO</span>
              </div>
              <span className="text-muted-foreground">=</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-primary">{formatHours(totalRegularHours)}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="font-bold text-sm text-foreground">{workedDays}</span>
                <span className="text-muted-foreground ml-1">Days</span>
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm">00:00</span>
                <span className="text-muted-foreground ml-1">Paid Break</span>
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm">{formatHours(totalBreakMinutes / 60)}</span>
                <span className="text-muted-foreground ml-1">Unpaid Break</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-1.5">
            <span className="text-muted-foreground">Est. Pay:</span>
            <span className="font-bold text-sm text-foreground">${totalPay.toLocaleString('en-US', {
              minimumFractionDigits: 2
            })}</span>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          <TooltipProvider>
          <Table className="min-w-[1800px]">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[100px] font-semibold text-foreground">Date</TableHead>
                <TableHead className="w-[120px] font-semibold text-foreground">Job/Tasks</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Start</TableHead>
                <TableHead className="w-[70px] font-semibold text-foreground">Break</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">End</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Total hours</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Daily total</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Daily pay</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Scheduled</TableHead>
                
                <TableHead className="w-[90px] font-semibold text-foreground">Weekly total</TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground">Weekly pay</TableHead>
                <TableHead className="w-[120px] font-semibold text-foreground border-l-2 border-border">Employee notes</TableHead>
                <TableHead className="w-[120px] font-semibold text-foreground">Manager notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Week header row */}
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={13} className="text-center font-semibold py-2 text-sm text-muted-foreground">
                  {format(selectedWeekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
                </TableCell>
              </TableRow>
              
              {entriesWithRunningTotal.map((dayData, dayIndex) => {
              const showDay = dayFilter === 'all' || dayData.entries.length > 0;
              if (!showDay) return null;
              const scheduledHours = 8;
              const difference = dayData.dailyTotal - scheduledHours;
              // Show weekly total only on the middle day (Wednesday = index 3)
              const isMiddleDay = dayIndex === 3;
              return dayData.entries.length === 0 ? <TableRow key={dayData.date.toISOString()} className="hover:bg-muted/30">
                    <TableCell className="py-3 font-semibold text-foreground">
                      {format(dayData.date, 'EEE M/d')}
                    </TableCell>
                    <TableCell className="py-3">
                      <JobProjectSelector
                        value={undefined}
                        onChange={(value) => {
                          // Allow manual creation for missing days
                          setAddShiftDefaults({ date: dayData.date, jobName: value || undefined });
                          setShowAddShiftModal(true);
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                    <TableCell className="py-3">08:00</TableCell>
                    <TableCell className="py-3 font-bold text-primary">
                      {isMiddleDay ? formatHours(totalRegularHours) : ''}
                    </TableCell>
                    <TableCell className="py-3 font-bold text-green-600">
                      {isMiddleDay ? `$${totalPay.toFixed(2)}` : ''}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground border-l-2 border-border">
                      {getEmployeeNotes(dayData.date) || '--'}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">--</TableCell>
                  </TableRow> : dayData.entries.map((entry, entryIndex) => {
                const isLastEntry = entryIndex === dayData.entries.length - 1;
                const isConflicting = conflictEntryIds.has(entry.id);
                const isSelected = selectedEntryIds.has(entry.id);
                return <TableRow 
                  key={entry.id} 
                  className={cn(
                    "hover:bg-muted/30 border-b border-border/50",
                    isConflicting && "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500",
                    isSelected && "bg-primary/10 hover:bg-primary/15"
                  )}
                >
                        <TableCell 
                          className="py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50"
                          onClick={(e) => handleDateClick(dayData.entries, e)}
                        >
                          {entryIndex === 0 ? (
                            <span className="hover:text-primary hover:underline">
                              {format(dayData.date, 'EEE M/d')}
                            </span>
                          ) : ''}
                          {isConflicting && entryIndex === 0 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline ml-1" />
                          )}
                        </TableCell>
                        <TableCell 
                          className="py-3 cursor-pointer hover:bg-muted/50"
                          onClick={(e) => {
                            // Only trigger if not clicking on the JobProjectSelector button
                            if (!(e.target as HTMLElement).closest('button, [role="combobox"], [data-radix-popper-content-wrapper]')) {
                              handleRowClick(entry.id, e);
                            }
                          }}
                        >
                          <JobProjectSelector
                            value={entry.project_name}
                            onChange={(value) => {
                              updateEntryMutation.mutate({ 
                                entryId: entry.id, 
                                updates: { project_name: value } 
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <EditableTimeCell 
                            value={entry.clock_in}
                            entryId={entry.id}
                            field="clock_in"
                            onSave={handleTimeUpdate}
                            isConflicting={isConflicting}
                            location={entry.location}
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <EditableBreakCell
                            value={entry.break_time_minutes || 0}
                            entryId={entry.id}
                            onSave={handleBreakUpdate}
                            location={entry.location}
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <EditableTimeCell 
                            value={entry.clock_out}
                            entryId={entry.id}
                            field="clock_out"
                            onSave={handleTimeUpdate}
                            isConflicting={isConflicting}
                            location={entry.location}
                          />
                        </TableCell>
                        <TableCell className="py-3 font-medium">{entry.total_hours ? formatHours(entry.total_hours) : '--'}</TableCell>
                        <TableCell className="py-3 font-bold">
                          {isLastEntry && dayData.dailyTotal > 0 ? formatHours(dayData.dailyTotal) : ''}
                        </TableCell>
                        <TableCell className="py-3 font-bold text-green-600">
                          {isLastEntry && dayData.dailyPay > 0 ? `$${dayData.dailyPay.toFixed(2)}` : ''}
                        </TableCell>
                        <TableCell className="py-3">{isLastEntry ? '08:00' : ''}</TableCell>
                        <TableCell className="py-3 font-bold text-primary">
                          {isLastEntry && isMiddleDay ? formatHours(totalRegularHours) : ''}
                        </TableCell>
                        <TableCell className="py-3 font-bold text-green-600">
                          {isLastEntry && isMiddleDay ? `$${totalPay.toFixed(2)}` : ''}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground border-l-2 border-border">
                          {getEmployeeNotes(dayData.date) || entry.notes || '--'}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground">
                          --
                        </TableCell>
                      </TableRow>;
              });
            })}
            </TableBody>
          </Table>
          </TooltipProvider>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Selection Action Bar */}
        {selectedEntryIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-4 z-50">
            <button 
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="font-medium text-sm">
              {selectedEntryIds.size} Selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              Delete entries
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    
    <AddShiftModal
      isOpen={showAddShiftModal}
      onClose={() => {
        setShowAddShiftModal(false);
        setAddShiftDefaults(null);
      }}
      employee={employee}
      defaultDate={addShiftDefaults?.date || selectedWeekStart}
      defaultJobName={addShiftDefaults?.jobName}
    />
  </>;
};
export default EmployeeTimesheetModal;