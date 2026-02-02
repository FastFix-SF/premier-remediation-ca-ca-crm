import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileEdit, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { notifyNewEmployeeRequest } from '@/utils/sendSmsNotification';
import { useTeamMember } from '@/hooks/useTeamMember';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { WheelTimePicker } from '@/mobile/components/WheelTimePicker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export const AddTimeOffRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getCurrentUserDisplayName } = useTeamMember();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  const [formData, setFormData] = useState({
    timeOffType: '',
    isAllDay: true,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    explanation: ''
  });

  const timeOffTypes = [
    { value: 'Vacation', label: t('requests.vacation') },
    { value: 'Sick Leave', label: t('requests.sickLeave') },
    { value: 'Personal Day', label: t('requests.personalDay') },
    { value: 'Family Leave', label: t('requests.familyLeave') },
    { value: 'Medical Leave', label: t('requests.medicalLeave') },
    { value: 'Bereavement', label: t('requests.bereavement') },
    { value: 'Other', label: t('requests.other') },
  ];

  const calculateTotalTime = () => {
    if (!formData.startDate || !formData.endDate) {
      return 0;
    }

    if (formData.isAllDay) {
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const endDate = new Date(formData.endDate + 'T00:00:00');
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays * 8;
    } else {
      if (!formData.startTime || !formData.endTime) return 0;
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) return 0;
      
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return Math.round(diffHours * 100) / 100;
    }
  };

  const totalHours = calculateTotalTime();

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
    if (formData.isAllDay) {
      const days = Math.ceil(hours / 8);
      return `${days} ${days > 1 ? t('requests.days') : t('requests.day')}`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getTypeLabel = () => {
    const type = timeOffTypes.find(t => t.value === formData.timeOffType);
    return type?.label || t('requests.select');
  };

  const handleSubmit = async () => {
    if (!formData.timeOffType || !formData.startDate || !formData.endDate) {
      toast({
        title: t('requests.missingInfo'),
        description: t('requests.fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.isAllDay && (!formData.startTime || !formData.endTime)) {
      toast({
        title: t('requests.missingTimeInfo'),
        description: t('requests.specifyTimes'),
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
          request_type: 'time_off',
          time_off_type: formData.timeOffType,
          is_all_day: formData.isAllDay,
          time_off_start_date: formData.startDate,
          time_off_end_date: formData.endDate,
          time_off_start_time: formData.isAllDay ? null : formData.startTime,
          time_off_end_time: formData.isAllDay ? null : formData.endTime,
          total_time_off_hours: totalHours,
          explanation: formData.explanation || null
        });

      if (error) throw error;

      const employeeName = getCurrentUserDisplayName();
      const days = formData.isAllDay ? Math.ceil(totalHours / 8) : null;
      const details = formData.isAllDay 
        ? `${formData.timeOffType}: ${formData.startDate} to ${formData.endDate} (${days} day${days !== 1 ? 's' : ''})`
        : `${formData.timeOffType}: ${formData.startDate}, ${formData.startTime} to ${formData.endTime} (${totalHours} hrs)`;
      notifyNewEmployeeRequest('time_off', employeeName, details).catch(err => {
        console.error('Failed to send admin notification:', err);
      });

      toast({
        title: t('requests.submitted'),
        description: t('requests.timeOffSubmitted'),
      });

      navigate('/mobile/time-clock-old', { replace: true });
    } catch (error) {
      console.error('Error submitting time off request:', error);
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
                onClick={() => navigate('/mobile/time-clock-old')}
                className="text-[#0891b2] p-1"
              >
              <ChevronLeft className="w-6 h-6" strokeWidth={2} />
            </button>
              <SheetTitle className="text-xl font-bold text-left">{t('requests.requestTimeOff')}</SheetTitle>
            </div>
          </SheetHeader>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Type */}
            <div 
              className="border rounded-xl p-4 cursor-pointer"
              onClick={() => setShowTypePicker(true)}
            >
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">{t('requests.type')}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.timeOffType ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>
                  {getTypeLabel()}
                </span>
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="border rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">{t('requests.allDay')}</span>
                <Switch
                  checked={formData.isAllDay}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    isAllDay: checked 
                  }))}
                />
              </div>
            </div>

            {/* Date Selection */}
            {formData.isAllDay ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="border rounded-xl p-4 space-y-2">
                  <p className="text-muted-foreground text-sm text-center">{t('requests.start')}</p>
                  <div 
                    className="text-sm font-semibold text-center text-[#0891b2] cursor-pointer underline underline-offset-4 decoration-dashed decoration-[#0891b2]/40 active:opacity-70"
                    onClick={() => setShowStartDatePicker(true)}
                  >
                    {formatDisplayDate(formData.startDate)}
                  </div>
                </div>
                
                {/* End Date */}
                <div className="border rounded-xl p-4 space-y-2">
                  <p className="text-muted-foreground text-sm text-center">{t('requests.end')}</p>
                  <div 
                    className="text-sm font-semibold text-center text-[#0891b2] cursor-pointer underline underline-offset-4 decoration-dashed decoration-[#0891b2]/40 active:opacity-70"
                    onClick={() => setShowEndDatePicker(true)}
                  >
                    {formatDisplayDate(formData.endDate)}
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            {/* Total Time */}
            <div className="border rounded-xl p-4">
              <p className="text-muted-foreground text-sm text-center mb-2">{t('requests.totalTimeOff')}</p>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.timeOffType ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>
                  {getTypeLabel()}
                </span>
                <span className="text-2xl font-bold">{formatTotalHours(totalHours)}</span>
              </div>
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
                  {formData.explanation || t('requests.leftBlank')}
                </p>
              </div>
            </div>

            {/* Notes Textarea */}
            {showNotes && (
              <Textarea
                placeholder={t('requests.attachNote')}
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
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

      {/* Type Picker Sheet */}
      <Sheet open={showTypePicker} onOpenChange={setShowTypePicker}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
          <SheetHeader className="flex flex-row items-center justify-between pb-2">
            <SheetTitle className="text-base">{t('requests.selectType')}</SheetTitle>
            <Button variant="ghost" size="sm" className="text-sm h-8" onClick={() => setShowTypePicker(false)}>
              {t('common.cancel')}
            </Button>
          </SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-4">
            {timeOffTypes.map((type) => (
              <div
                key={type.value}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  formData.timeOffType === type.value 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, timeOffType: type.value }));
                  setShowTypePicker(false);
                }}
              >
                <span className="font-medium">{type.label}</span>
              </div>
            ))}
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
            <SheetTitle className="text-center text-base">Start Time</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <WheelTimePicker
              value={formData.startTime}
              onConfirm={(value) => {
                setFormData(prev => ({ ...prev, startTime: value }));
                setShowStartTimePicker(false);
              }}
              onCancel={() => setShowStartTimePicker(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* End Time Picker Sheet */}
      <Sheet open={showEndTimePicker} onOpenChange={setShowEndTimePicker}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-center text-base">End Time</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <WheelTimePicker
              value={formData.endTime}
              onConfirm={(value) => {
                setFormData(prev => ({ ...prev, endTime: value }));
                setShowEndTimePicker(false);
              }}
              onCancel={() => setShowEndTimePicker(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};