import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onIncidentAdded: () => void;
}

export const AddIncidentDialog: React.FC<AddIncidentDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  onIncidentAdded
}) => {
  const [formData, setFormData] = useState({
    incident_date: new Date(),
    incident_type: '',
    severity: 'medium',
    description: '',
    follow_up: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.incident_type || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('project_incidents')
        .insert({
          project_id: projectId,
          incident_date: formData.incident_date.toISOString().split('T')[0],
          incident_type: formData.incident_type,
          severity: formData.severity,
          description: formData.description,
          follow_up: formData.follow_up || null,
          resolved: false,
          photos: []
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Incident reported successfully",
      });

      onIncidentAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding incident:', error);
      toast({
        title: "Error",
        description: "Failed to report incident",
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
          <DialogTitle>Report Incident</DialogTitle>
          <DialogDescription>
            Document safety, quality, or other project incidents
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.incident_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.incident_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, incident_date: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.incident_type} onValueChange={(value) => setFormData(prev => ({ ...prev, incident_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what happened..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Follow-up Actions</Label>
            <Textarea
              value={formData.follow_up}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up: e.target.value }))}
              placeholder="What needs to be done to resolve this?"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Reporting...' : 'Report Incident'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};