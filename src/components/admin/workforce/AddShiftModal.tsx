import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { X, Plus, AlertCircle } from 'lucide-react';
import { format, parse, differenceInMinutes, isValid, parseISO, isBefore, isEqual } from 'date-fns';
import { supabase } from '../../../integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import JobProjectSelector from './JobProjectSelector';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    user_id: string;
    full_name: string;
    email?: string;
  } | null;
  defaultDate?: Date;
  defaultJobName?: string;
}

// Helper to safely format a date to yyyy-MM-dd
const formatDateSafe = (date: Date | undefined): string => {
  if (!date || !isValid(date)) {
    return format(new Date(), 'yyyy-MM-dd');
  }
  return format(date, 'yyyy-MM-dd');
};

// Helper to parse date string safely and create a datetime
const createDateTime = (dateStr: string, timeStr: string): Date | null => {
  try {
    // Parse using ISO format to avoid browser inconsistencies
    const parsed = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  employee,
  defaultDate = new Date(),
  defaultJobName
}) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobName, setJobName] = useState<string | undefined>(defaultJobName);
  const [startDate, setStartDate] = useState(() => formatDateSafe(defaultDate));
  const [startTime, setStartTime] = useState('07:00');
  const [endDate, setEndDate] = useState(() => formatDateSafe(defaultDate));
  const [endTime, setEndTime] = useState('17:00');
  const [isActiveShift, setIsActiveShift] = useState(false); // New: toggle for clock-in only

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      setJobName(defaultJobName);
      const formattedDate = formatDateSafe(defaultDate);
      setStartDate(formattedDate);
      setEndDate(formattedDate);
      // Reset times to defaults
      setStartTime('07:00');
      setEndTime('17:00');
      setIsActiveShift(false);
    }
  }, [defaultDate, defaultJobName, isOpen]);

  // Auto-update end date when start date changes (if end date is before start date)
  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
    // If end date is before new start date, update end date
    if (value > endDate) {
      setEndDate(value);
    }
  }, [endDate]);

  // Validate end date/time is after start date/time
  const { totalHours, dateError } = useMemo(() => {
    // If active shift (clock-in only), no end time validation needed
    if (isActiveShift) {
      const start = createDateTime(startDate, startTime);
      if (!start) {
        return { totalHours: 0, dateError: 'Invalid date or time format' };
      }
      return { totalHours: 0, dateError: null };
    }

    const start = createDateTime(startDate, startTime);
    const end = createDateTime(endDate, endTime);
    
    if (!start || !end) {
      return { totalHours: 0, dateError: 'Invalid date or time format' };
    }
    
    const minutes = differenceInMinutes(end, start);
    
    if (minutes < 0) {
      return { totalHours: 0, dateError: 'End time must be after start time' };
    }
    
    if (minutes === 0) {
      return { totalHours: 0, dateError: 'Start and end time cannot be the same' };
    }
    
    // Warn if shift is over 24 hours (unusual)
    if (minutes > 24 * 60) {
      return { totalHours: minutes / 60, dateError: 'Warning: Shift is over 24 hours' };
    }
    
    return { totalHours: minutes / 60, dateError: null };
  }, [startDate, startTime, endDate, endTime, isActiveShift]);

  const formatHoursDisplay = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatTimeForDisplay = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    if (isActiveShift) {
      // For active shifts, only need valid start time
      const start = createDateTime(startDate, startTime);
      return !!start;
    } else {
      // For completed shifts, need valid total hours
      return totalHours > 0 && !dateError?.includes('must be');
    }
  }, [isActiveShift, startDate, startTime, totalHours, dateError]);

  const handleSubmit = async () => {
    if (!employee?.user_id) {
      toast.error('No employee selected');
      return;
    }
    
    const clockIn = createDateTime(startDate, startTime);
    
    if (!clockIn) {
      toast.error('Invalid start date or time format');
      return;
    }

    // For completed shifts, validate clock out
    if (!isActiveShift) {
      const clockOut = createDateTime(endDate, endTime);
      
      if (!clockOut) {
        toast.error('Invalid end date or time format');
        return;
      }
      
      if (totalHours <= 0) {
        toast.error('End time must be after start time');
        return;
      }
      
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('time_clock').insert({
          user_id: employee.user_id,
          employee_name: employee.full_name,
          clock_in: clockIn.toISOString(),
          clock_out: clockOut.toISOString(),
          total_hours: totalHours,
          project_name: jobName,
          status: 'completed',
          break_time_minutes: 0
        });
        
        if (error) throw error;
        
        toast.success('Shift added successfully');
        invalidateQueries();
        onClose();
      } catch (error) {
        console.error('Error adding shift:', error);
        toast.error('Failed to add shift');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Active shift - clock in only, no clock out
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('time_clock').insert({
          user_id: employee.user_id,
          employee_name: employee.full_name,
          clock_in: clockIn.toISOString(),
          clock_out: null,
          total_hours: null,
          project_name: jobName,
          status: 'active',
          break_time_minutes: 0
        });
        
        if (error) throw error;
        
        toast.success('Employee clocked in successfully');
        invalidateQueries();
        onClose();
      } catch (error) {
        console.error('Error clocking in:', error);
        toast.error('Failed to clock in employee');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const invalidateQueries = () => {
    // Invalidate all timesheet-related queries to ensure UI updates everywhere
    queryClient.invalidateQueries({ queryKey: ['employee-timesheet'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
    queryClient.invalidateQueries({ queryKey: ['today-timesheets'] });
    queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    queryClient.invalidateQueries({ queryKey: ['workforce-timesheets-summary'] });
  };

  return <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[580px] p-0 gap-0 overflow-visible">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <Plus className="h-4 w-4 text-muted-foreground" />
            <DialogTitle className="text-base font-medium">Add Shift</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-5">
          <div className="flex gap-6 items-stretch">
            {/* Left side - Form fields */}
            <div className="flex-1 space-y-4">
              {/* Active shift toggle */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="active-shift"
                  checked={isActiveShift}
                  onCheckedChange={setIsActiveShift}
                />
                <Label htmlFor="active-shift" className="text-sm cursor-pointer">
                  Clock in only (still working)
                </Label>
              </div>

              {/* Job selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-14 shrink-0">Job</label>
                <div className="flex-1 min-w-0">
                  <JobProjectSelector value={jobName} onChange={(v) => setJobName(v || undefined)} />
                </div>
              </div>

              {/* Start date/time */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-14 shrink-0">
                  {isActiveShift ? 'Clock In' : 'Starts'}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => handleStartDateChange(e.target.value)} 
                    className="px-2.5 py-1 border rounded-full text-sm bg-background w-[130px]" 
                  />
                  <span className="text-sm text-muted-foreground">At:</span>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    className="px-2.5 py-1 border rounded-full text-sm bg-background w-[90px]" 
                  />
                </div>
              </div>

              {/* End date/time - Only show if not active shift */}
              {!isActiveShift && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-14 shrink-0">Ends</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input 
                      type="date" 
                      value={endDate} 
                      min={startDate}
                      onChange={e => setEndDate(e.target.value)} 
                      className="px-2.5 py-1 border rounded-full text-sm bg-background w-[130px]" 
                    />
                    <span className="text-sm text-muted-foreground">At:</span>
                    <input 
                      type="time" 
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                      className="px-2.5 py-1 border rounded-full text-sm bg-background w-[90px]" 
                    />
                  </div>
                </div>
              )}
              
              {/* Date validation error */}
              {dateError && !isActiveShift && (
                <div className={`flex items-center gap-2 text-sm ${dateError.includes('Warning') ? 'text-amber-600' : 'text-destructive'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>{dateError}</span>
                </div>
              )}

              {/* Active shift info message */}
              {isActiveShift && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Employee will be shown as currently clocked in</span>
                </div>
              )}
            </div>

            {/* Right side - Total hours display */}
            <div className="w-32 shrink-0 flex flex-col items-center justify-center bg-primary/5 rounded-xl p-3">
              {isActiveShift ? (
                <>
                  <span className="text-xs text-primary font-medium mb-1">Status</span>
                  <span className="text-lg font-bold text-green-600">Active</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-primary font-medium mb-1">Total hours</span>
                  <span className="text-3xl font-bold text-primary">
                    {formatHoursDisplay(totalHours)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mt-4 pt-3">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !isFormValid} 
                className="bg-primary bg-lime-950 hover:bg-lime-800"
              >
                {isSubmitting ? 'Adding...' : isActiveShift ? 'Clock In' : 'Add Shift'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default AddShiftModal;
