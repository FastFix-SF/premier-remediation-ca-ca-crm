import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, Car, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { JobSelector } from '@/mobile/components/JobSelector';
import { notifyNewEmployeeRequest } from '@/utils/sendSmsNotification';
import { useTeamMember } from '@/hooks/useTeamMember';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { WheelTimePicker } from '@/mobile/components/WheelTimePicker';
import { BreakDurationPicker } from '@/mobile/components/BreakDurationPicker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export const AddShiftRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getCurrentUserDisplayName } = useTeamMember();

  const returnTo = (location.state as any)?.returnTo as string | undefined;
  const returnShiftData = (location.state as any)?.shiftData;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  const [formData, setFormData] = useState({
    jobName: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    endTime: format(new Date(), 'HH:mm'),
    breakTime: '00:00', // HH:mm format for break duration
    includeMileage: false,
    notes: ''
  });

  const entryId = searchParams.get('entryId');

  useEffect(() => {
    const clockIn = searchParams.get('clockIn');
    const clockOut = searchParams.get('clockOut');
    const breakMinutes = searchParams.get('breakMinutes');
    const jobName = searchParams.get('jobName');

    if (clockIn || clockOut) {
      const clockInDate = clockIn ? new Date(clockIn) : null;
      const clockOutDate = clockOut ? new Date(clockOut) : null;
      
      // Convert break minutes to HH:mm format
      const breakMins = parseInt(breakMinutes || '0');
      const breakHours = Math.floor(breakMins / 60);
      const breakRemainder = breakMins % 60;
      const breakTimeStr = `${breakHours.toString().padStart(2, '0')}:${breakRemainder.toString().padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        jobName: jobName || prev.jobName,
        startDate: clockInDate ? format(clockInDate, 'yyyy-MM-dd') : prev.startDate,
        endDate: clockOutDate ? format(clockOutDate, 'yyyy-MM-dd') : prev.endDate,
        startTime: clockInDate ? format(clockInDate, 'HH:mm') : prev.startTime,
        endTime: clockOutDate ? format(clockOutDate, 'HH:mm') : prev.endTime,
        breakTime: breakTimeStr,
      }));
    }
  }, [searchParams]);

  const handleBack = () => {
    // If we came here from the Time Clock "Shift details" modal, return there and
    // ask it to re-open the modal with the same shift data.
    if (returnTo) {
      navigate(returnTo, {
        state: {
          reopenShiftConfirmation: true,
          shiftData: returnShiftData,
        },
      });
      return;
    }

    navigate(-1);
  };

  const getBreakMinutes = () => {
    const [hours, minutes] = formData.breakTime.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const calculateTotalHours = () => {
    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      return 0;
    }
    
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) return 0;
    
    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakHours = getBreakMinutes() / 60;
    
    return Math.max(0, Math.round((diffHours - breakHours) * 100) / 100);
  };

  const totalHours = calculateTotalHours();

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return format(date, 'MMM do yyyy');
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTotalHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatBreakDisplay = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    if (h === 0 && m === 0) return '0:00';
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.jobName || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      toast({
        title: t('requests.missingInfo'),
        description: t('requests.fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('employee_requests')
        .insert({
          user_id: user?.id,
          request_type: 'shift',
          job_name: formData.jobName,
          shift_start_date: formData.startDate,
          shift_end_date: formData.endDate,
          shift_start_time: formData.startTime,
          shift_end_time: formData.endTime,
          break_duration_minutes: getBreakMinutes(),
          total_hours: totalHours,
          include_mileage: formData.includeMileage,
          notes: formData.notes || null
        });

      if (error) throw error;

      const employeeName = getCurrentUserDisplayName();
      const details = `${formData.jobName} - ${formData.startDate}, ${formData.startTime} to ${formData.endTime} (${totalHours} hrs)`;
      notifyNewEmployeeRequest('shift', employeeName, details, {
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      }).catch(err => {
        console.error('Failed to send admin notification:', err);
      });

      toast({
        title: t('requests.submitted'),
        description: t('requests.shiftSubmitted'),
      });

      // Navigate back to the time clock page
      navigate('/mobile/time-clock-old', { replace: true });
    } catch (error) {
      console.error('Error submitting shift request:', error);
      toast({
        title: t('common.error'),
        description: t('requests.submitError'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Sheet open={true}>
      <SheetContent side="bottom" className="h-full max-h-full rounded-none overflow-y-auto flex flex-col justify-center" hideClose>
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="text-[#0891b2] p-1"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2} />
            </button>
            <SheetTitle className="text-xl font-bold text-left">{t('requests.requestEdit')}</SheetTitle>
          </div>
        </SheetHeader>

        {/* Form Content */}
        <div className="space-y-4">
          {/* Job */}
          <div 
            className="border rounded-xl p-4 cursor-pointer"
            onClick={() => setShowJobSelector(true)}
          >
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">{t('requests.job')}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.jobName ? 'bg-rose-100 text-rose-800' : 'bg-muted text-muted-foreground'}`}>
                {formData.jobName || t('requests.select')}
              </span>
            </div>
          </div>

          {/* Starts / Ends */}
          <div className="grid grid-cols-2 gap-3">
            {/* Starts */}
            <div className="border rounded-xl p-4 space-y-2">
              <p className="text-muted-foreground text-sm text-center">{t('requests.starts')}</p>
              <p 
                className="text-xl font-semibold text-center text-[#0891b2] cursor-pointer underline underline-offset-4 decoration-dashed decoration-[#0891b2]/40 active:opacity-70"
                onClick={() => setShowStartTimePicker(true)}
              >
                {formatDisplayTime(formData.startTime)}
              </p>
              <div 
                className="text-xs text-[#0891b2]/70 text-center border-t pt-2 cursor-pointer underline underline-offset-2 decoration-dashed decoration-[#0891b2]/30 active:opacity-70"
                onClick={() => setShowStartDatePicker(true)}
              >
                {formatDisplayDate(formData.startDate)}
              </div>
            </div>
            
            {/* Ends */}
            <div className="border rounded-xl p-4 space-y-2">
              <p className="text-muted-foreground text-sm text-center">{t('requests.ends')}</p>
              <p 
                className="text-xl font-semibold text-center text-[#0891b2] cursor-pointer underline underline-offset-4 decoration-dashed decoration-[#0891b2]/40 active:opacity-70"
                onClick={() => setShowEndTimePicker(true)}
              >
                {formatDisplayTime(formData.endTime)}
              </p>
              <div 
                className="text-xs text-[#0891b2]/70 text-center border-t pt-2 cursor-pointer underline underline-offset-2 decoration-dashed decoration-[#0891b2]/30 active:opacity-70"
                onClick={() => setShowEndDatePicker(true)}
              >
                {formatDisplayDate(formData.endDate)}
              </div>
            </div>
          </div>

          {/* Break Time */}
          <div 
            className="border rounded-xl p-4 cursor-pointer"
            onClick={() => setShowBreakPicker(true)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">{t('requests.breakTime')}</span>
              </div>
              <span className="font-medium text-[#0891b2] underline underline-offset-4 decoration-dashed decoration-[#0891b2]/40">{formatBreakDisplay(formData.breakTime)}</span>
            </div>
          </div>

          {/* Total Hours */}
          <div className="border rounded-xl p-4">
            <p className="text-muted-foreground text-sm text-center mb-2">{t('requests.totalHours')}</p>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.jobName ? 'bg-rose-100 text-rose-800' : 'bg-muted text-muted-foreground'}`}>
                {formData.jobName || t('requests.noJob')}
              </span>
              <span className="text-2xl font-bold">{formatTotalHours(totalHours)}</span>
            </div>
          </div>

          {/* Mileage */}
          <div 
            className="flex items-center gap-3 px-2 py-3 border-b cursor-pointer"
            onClick={() => setFormData(prev => ({ ...prev, includeMileage: !prev.includeMileage }))}
          >
            <Car className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{t('requests.mileage')}</p>
              <p className="text-sm text-muted-foreground">
                {formData.includeMileage ? t('requests.willBeIncluded') : t('requests.leftBlank')}
              </p>
            </div>
            {formData.includeMileage && (
              <span className="text-[#0891b2] text-sm">✓</span>
            )}
          </div>

          {/* Note */}
          <div 
            className="flex items-center gap-3 px-2 py-3 border-b cursor-pointer"
            onClick={() => setShowNotes(!showNotes)}
          >
            <FileEdit className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{t('requests.note')}</p>
              <p className="text-sm text-muted-foreground">
                {formData.notes || t('requests.leftBlank')}
              </p>
            </div>
          </div>

          {/* Notes Textarea */}
          {showNotes && (
            <Textarea
              placeholder={t('requests.attachNote')}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[80px] resize-none border rounded-xl text-sm"
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 mt-6 pb-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('requests.submitting') : t('requests.sendForApproval')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {/* Job Selector Sheet */}
      <Sheet open={showJobSelector} onOpenChange={setShowJobSelector}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          <SheetHeader className="flex flex-row items-center justify-between pb-2">
            <SheetTitle className="text-base">{t('requests.selectJob')}</SheetTitle>
            <Button variant="ghost" size="sm" className="text-sm h-8" onClick={() => setShowJobSelector(false)}>
              {t('common.cancel')}
            </Button>
          </SheetHeader>
          <div className="overflow-y-auto">
            <JobSelector
              value={formData.jobName}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, jobName: value }));
                setShowJobSelector(false);
              }}
              placeholder="Select job"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Start Date Picker Sheet */}
      <Sheet open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl px-2">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">{t('requests.startDate')}</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center py-2">
            <Calendar
              mode="single"
              selected={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                }
              }}
              className="rounded-md"
            />
          </div>
          <div className="flex gap-2 pb-4 px-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={() => setShowStartDatePicker(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-[#0891b2] bg-transparent hover:bg-[#0891b2]/10 border-0 font-medium text-sm" onClick={() => setShowStartDatePicker(false)}>
              {t('requests.confirm')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* End Date Picker Sheet */}
      <Sheet open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl px-2">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">{t('requests.endDate')}</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center py-2">
            <Calendar
              mode="single"
              selected={formData.endDate ? new Date(formData.endDate + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                }
              }}
              className="rounded-md"
            />
          </div>
          <div className="flex gap-2 pb-4 px-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" onClick={() => setShowEndDatePicker(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-[#0891b2] bg-transparent hover:bg-[#0891b2]/10 border-0 font-medium text-sm" onClick={() => setShowEndDatePicker(false)}>
              {t('requests.confirm')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Start Time Picker Sheet */}
      <Sheet open={showStartTimePicker} onOpenChange={setShowStartTimePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">{t('requests.startTime')}</SheetTitle>
          </SheetHeader>
          <WheelTimePicker
            value={formData.startTime}
            onConfirm={(value) => {
              setFormData(prev => ({ ...prev, startTime: value }));
              setShowStartTimePicker(false);
            }}
            onCancel={() => setShowStartTimePicker(false)}
          />
        </SheetContent>
      </Sheet>

      {/* End Time Picker Sheet */}
      <Sheet open={showEndTimePicker} onOpenChange={setShowEndTimePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">{t('requests.endTime')}</SheetTitle>
          </SheetHeader>
          <WheelTimePicker
            value={formData.endTime}
            onConfirm={(value) => {
              setFormData(prev => ({ ...prev, endTime: value }));
              setShowEndTimePicker(false);
            }}
            onCancel={() => setShowEndTimePicker(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Break Time Picker Sheet */}
      <Sheet open={showBreakPicker} onOpenChange={setShowBreakPicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">{t('requests.duration')}</SheetTitle>
          </SheetHeader>
          <BreakDurationPicker
            value={formData.breakTime}
            onConfirm={(value) => {
              setFormData(prev => ({ ...prev, breakTime: value }));
              setShowBreakPicker(false);
            }}
            onCancel={() => setShowBreakPicker(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
