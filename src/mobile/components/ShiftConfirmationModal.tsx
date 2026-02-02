import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, Coffee, Edit2, Car, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShiftData {
  id: string;
  clock_in: string;
  clock_out: string;
  clock_in_location: string | null;
  clock_out_location: string | null;
  break_location: string | null;
  break_time_minutes: number;
  total_hours: number | null;
  project_name: string | null;
  notes: string | null;
}

interface ShiftConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftData | null;
  onConfirm: () => void;
  onEdit: () => void;
}

export const ShiftConfirmationModal: React.FC<ShiftConfirmationModalProps> = ({
  isOpen,
  onClose,
  shiftData,
  onConfirm,
  onEdit
}) => {
  const { t } = useLanguage();
  const [clockInAddress, setClockInAddress] = useState<string>('');
  const [clockOutAddress, setClockOutAddress] = useState<string>('');
  const [breakAddress, setBreakAddress] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const getAddressFromLocation = useCallback(async (location: string): Promise<string> => {
    try {
      const coords = location.split(',').map(s => parseFloat(s.trim()));
      if (coords.length !== 2 || coords.some(isNaN)) {
        return location;
      }
      const [latitude, longitude] = coords;
      const { data, error } = await supabase.functions.invoke('reverse-geocode', {
        body: { latitude, longitude }
      });
      if (error || !data?.address) {
        return location;
      }
      return data.address;
    } catch {
      return location;
    }
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!shiftData) return;
      setLoadingAddresses(true);
      
      const [inAddr, outAddr, brkAddr] = await Promise.all([
        shiftData.clock_in_location ? getAddressFromLocation(shiftData.clock_in_location) : '',
        shiftData.clock_out_location ? getAddressFromLocation(shiftData.clock_out_location) : '',
        shiftData.break_location ? getAddressFromLocation(shiftData.break_location) : ''
      ]);
      
      setClockInAddress(inAddr);
      setClockOutAddress(outAddr);
      setBreakAddress(brkAddr);
      setLoadingAddresses(false);
    };
    
    if (isOpen && shiftData) {
      fetchAddresses();
    }
  }, [isOpen, shiftData, getAddressFromLocation]);

  if (!shiftData) return null;

  const clockInDate = new Date(shiftData.clock_in);
  const clockOutDate = new Date(shiftData.clock_out);
  
  const formatTime = (date: Date) => format(date, 'h:mm a');
  const formatDate = (date: Date) => format(date, 'EEE, MMM d');
  
  const formatHours = (hours: number | null) => {
    if (!hours) return '00:00';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={isOpen}>
      <SheetContent side="bottom" className="h-full max-h-full rounded-none overflow-y-auto flex flex-col justify-center" hideClose>
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold text-left">Shift details</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          {/* Shift Date */}
          <div className="border rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Shift date</span>
              <span className="font-medium">{formatDate(clockInDate)}</span>
            </div>
          </div>

          {/* Clock In / Clock Out */}
          <div className="grid grid-cols-2 gap-3">
            {/* Clock In */}
            <div className="border rounded-xl p-4 space-y-2">
              <p className="text-muted-foreground text-sm text-center">Clock In</p>
              <p className="text-xl font-semibold text-center">{formatTime(clockInDate)}</p>
              {shiftData.clock_in_location && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground border-t pt-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {loadingAddresses ? 'Getting address...' : clockInAddress}
                  </span>
                </div>
              )}
            </div>
            
            {/* Clock Out */}
            <div className="border rounded-xl p-4 space-y-2">
              <p className="text-muted-foreground text-sm text-center">Clock Out</p>
              <p className="text-xl font-semibold text-center">{formatTime(clockOutDate)}</p>
              {shiftData.clock_out_location && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground border-t pt-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {loadingAddresses ? 'Getting address...' : clockOutAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Break Time */}
          <div className="border rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coffee className="w-4 h-4" />
                <span className="text-sm">Break time</span>
              </div>
              <span className="font-medium">
                {shiftData.break_time_minutes > 0 
                  ? `${shiftData.break_time_minutes} min` 
                  : '0 min'}
              </span>
            </div>
            {shiftData.break_location && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground border-t pt-2 mt-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {loadingAddresses ? 'Getting address...' : breakAddress}
                </span>
              </div>
            )}
          </div>

          {/* Total Hours */}
          <div className="border rounded-xl p-4">
            <p className="text-muted-foreground text-sm text-center mb-2">Total hours</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                {shiftData.project_name || 'Office Work'}
              </Badge>
              <span className="text-2xl font-bold">{formatHours(shiftData.total_hours)}</span>
            </div>
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-3 px-2 py-3 border-b">
            <Car className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Mileage</p>
              <p className="text-sm text-muted-foreground">(left blank)</p>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-center gap-3 px-2 py-3 border-b">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Note</p>
              <p className="text-sm text-muted-foreground">
                {shiftData.notes || '(left blank)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pb-4">
          <Button 
            onClick={onConfirm}
            className="flex-1 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-medium"
          >
            Confirm hours
          </Button>
          <Button 
            onClick={onEdit}
            className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-medium"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit shift
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
