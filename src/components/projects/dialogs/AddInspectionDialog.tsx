import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateInspection } from '@/hooks/useInspections';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AddInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddInspectionDialog: React.FC<AddInspectionDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    inspection_type: '',
    inspection_date: new Date(),
    agency: '',
    status: 'draft' as const,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInspection = useCreateInspection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inspection_type) {
      toast({
        title: "Validation Error",
        description: "Please select an inspection type",
        variant: "destructive",
      });
      return;
    }

    try {
      await createInspection.mutateAsync({
        project_id: projectId,
        inspection_type: formData.inspection_type,
        inspection_date: format(formData.inspection_date, 'yyyy-MM-dd'),
        agency: formData.agency || null,
        status: formData.status,
      });

      toast({
        title: "Success",
        description: "Inspection created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      setFormData({
        inspection_type: '',
        inspection_date: new Date(),
        agency: '',
        status: 'draft',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Inspection</DialogTitle>
          <DialogDescription>
            Schedule a new inspection for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Inspection Type *</Label>
            <Select 
              value={formData.inspection_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, inspection_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rough-in">Rough-In</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="framing">Framing</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Inspection Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.inspection_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.inspection_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, inspection_date: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Agency/Inspector</Label>
            <Input
              value={formData.agency}
              onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
              placeholder="e.g., City Building Department"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInspection.isPending}>
              {createInspection.isPending ? 'Creating...' : 'Schedule Inspection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
