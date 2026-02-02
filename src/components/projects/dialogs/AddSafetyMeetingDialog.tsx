import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateSafetyMeeting } from '@/hooks/useSafetyMeetings';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AddSafetyMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddSafetyMeetingDialog: React.FC<AddSafetyMeetingDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    topic: '',
    meeting_date: new Date(),
    location: '',
    notes: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMeeting = useCreateSafetyMeeting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMeeting.mutateAsync({
        topic: formData.topic.trim(),
        meeting_date: format(formData.meeting_date, 'yyyy-MM-dd'),
        location: formData.location.trim() || undefined,
      });

      toast({
        title: "Success",
        description: "Safety meeting scheduled successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      setFormData({
        topic: '',
        meeting_date: new Date(),
        location: '',
        notes: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating safety meeting:', error);
      toast({
        title: "Error",
        description: "Failed to schedule safety meeting",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Safety Meeting</DialogTitle>
          <DialogDescription>
            Schedule a safety meeting for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Topic *</Label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Weekly Safety Briefing"
            />
          </div>

          <div className="space-y-2">
            <Label>Meeting Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.meeting_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.meeting_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, meeting_date: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Job Site Trailer"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
