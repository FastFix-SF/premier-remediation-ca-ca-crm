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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddDailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onReportAdded: () => void;
}

export const AddDailyReportDialog: React.FC<AddDailyReportDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  onReportAdded
}) => {
  const [formData, setFormData] = useState({
    report_date: new Date(),
    crew_count: 0,
    hours_total: 0,
    summary: '',
    weather: { condition: 'sunny', temperature: 70 }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('project_daily_reports')
        .insert({
          project_id: projectId,
          report_date: formData.report_date.toISOString().split('T')[0],
          crew_count: formData.crew_count,
          hours_total: formData.hours_total,
          summary: formData.summary,
          weather: formData.weather,
          photos: [],
          materials_used: []
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily report added successfully",
      });

      onReportAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding report:', error);
      toast({
        title: "Error",
        description: "Failed to add daily report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Daily Report</DialogTitle>
          <DialogDescription>
            Document daily progress and activities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.report_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.report_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, report_date: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crew Count</Label>
              <Input
                type="number"
                min="0"
                value={formData.crew_count}
                onChange={(e) => setFormData(prev => ({ ...prev, crew_count: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.hours_total}
                onChange={(e) => setFormData(prev => ({ ...prev, hours_total: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Work Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="What was accomplished today?"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};