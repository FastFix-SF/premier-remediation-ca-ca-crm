import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { UserSelectionModal } from './UserSelectionModal';

interface AddTimeOffSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIME_OFF_TYPES = [
  'Vacation',
  'Sick leave',
  'Personal day',
  'Non Paid Absence',
  'Maternity/Paternity',
  'Bereavement',
  'Other'
];

export const AddTimeOffSheet: React.FC<AddTimeOffSheetProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [managerNote, setManagerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Select User',
        description: 'Please select a user for the time off request',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('employee_requests').insert({
        user_id: selectedUserId,
        request_type: 'time_off',
        time_off_type: 'Non Paid Absence',
        is_all_day: isAllDay,
        time_off_start_date: startDate,
        time_off_end_date: endDate,
        total_time_off_hours: 8, // Default to 8 hours
        notes: managerNote || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Time off request added successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      onClose();
      
      // Reset form
      setSelectedUserId(null);
      setSelectedUserName('');
      setIsAllDay(true);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setManagerNote('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add time off request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowUserSelection(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-6 h-6" />
              </Button>
              <h2 className="text-lg font-semibold">Add time off</h2>
              <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* User Selection */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-base text-foreground">User</span>
                <Button
                  variant="link"
                  className="text-blue-500 font-normal p-0 h-auto"
                  onClick={() => setShowUserSelection(true)}
                >
                  {selectedUserName || 'Select user'}
                </Button>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-base text-foreground">All day</span>
                <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-4 py-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border-none text-center text-base"
                />
                <span className="text-muted-foreground">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border-none text-center text-base"
                />
              </div>

              {/* Total Time Requested */}
              <div className="py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">
                  Total time requested
                </span>
              </div>

              {/* Manager Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add manager note (optional)"
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="min-h-32 resize-none bg-muted/20 border-border rounded-xl"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-full text-base"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-14 rounded-full text-base bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedUserId}
              >
                Add time off
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={showUserSelection}
        onClose={() => setShowUserSelection(false)}
        onSelect={handleUserSelect}
      />
    </>
  );
};
