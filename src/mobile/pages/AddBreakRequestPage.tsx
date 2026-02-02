import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export const AddBreakRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    breakType: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const breakTypes = [
    { value: 'Lunch Break', label: t('requests.lunchBreak') },
    { value: 'Coffee Break', label: t('requests.coffeeBreak') },
    { value: 'Personal Break', label: t('requests.personalBreak') },
    { value: 'Medical Break', label: t('requests.medicalBreak') },
    { value: 'Other', label: t('requests.other') },
  ];

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) {
      return 0;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const startDateTime = new Date(`${today}T${formData.startTime}`);
    const endDateTime = new Date(`${today}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) return 0;
    
    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes;
  };

  const durationMinutes = calculateDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.breakType || !formData.startTime || !formData.endTime) {
      toast({
        title: t('requests.missingInfo'),
        description: t('requests.fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    if (durationMinutes <= 0) {
      toast({
        title: t('requests.invalidTimeRange'),
        description: t('requests.endAfterStart'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startDateTime = new Date(`${today}T${formData.startTime}`);
      const endDateTime = new Date(`${today}T${formData.endTime}`);

      const { error } = await supabase
        .from('employee_requests')
        .insert({
          user_id: user?.id,
          request_type: 'break',
          break_type: formData.breakType,
          break_start_time: startDateTime.toISOString(),
          break_end_time: endDateTime.toISOString(),
          break_duration_minutes: durationMinutes,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: t('requests.submitted'),
        description: t('requests.breakSubmitted'),
      });

      navigate('/mobile/time-clock-old');
    } catch (error) {
      console.error('Error submitting break request:', error);
      toast({
        title: t('common.error'),
        description: t('requests.submitError'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t('timeClock.minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} ${hours > 1 ? t('requests.hours') : t('requests.hour')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mobile/time-clock-old')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{t('requests.addBreak')}</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Break Type Selection */}
          <Card className="p-4">
            <Label htmlFor="breakType" className="text-sm font-medium text-gray-700">{t('requests.breakType')} *</Label>
            <Select value={formData.breakType} onValueChange={(value) => setFormData(prev => ({ ...prev, breakType: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('requests.selectBreakType')} />
              </SelectTrigger>
              <SelectContent>
                {breakTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Time Range */}
          <Card className="p-4 space-y-4">
            <div>
              <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('requests.startTime')} *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('requests.endTime')} *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="mt-2"
                required
              />
            </div>
          </Card>

          {/* Duration Display */}
          {durationMinutes > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-sm font-medium text-blue-800">
                {t('requests.duration')}: {formatDuration(durationMinutes)}
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="p-4">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">{t('requests.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('requests.additionalInfo')}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-2 min-h-[80px]"
            />
          </Card>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t p-4 space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/mobile/time-clock-old')}
          className="w-full"
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('requests.submitting') : t('requests.sendForApproval')}
        </Button>
      </div>
    </div>
  );
};
