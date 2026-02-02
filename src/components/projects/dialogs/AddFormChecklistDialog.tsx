import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AddFormChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddFormChecklistDialog: React.FC<AddFormChecklistDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    form_type: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.form_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Use project_inspections table with form type for forms & checklists
      const { error } = await supabase
        .from('project_inspections')
        .insert({
          project_id: projectId,
          title: formData.title.trim(),
          inspection_type: formData.form_type,
          description: formData.description.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form/checklist created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      setFormData({ title: '', form_type: '', description: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: "Failed to create form/checklist",
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
          <DialogTitle>Add Form/Checklist</DialogTitle>
          <DialogDescription>
            Create a new form or checklist for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Pre-Installation Checklist"
            />
          </div>

          <div className="space-y-2">
            <Label>Form Type *</Label>
            <Select 
              value={formData.form_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, form_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="safety-form">Safety Form</SelectItem>
                <SelectItem value="quality-form">Quality Form</SelectItem>
                <SelectItem value="inspection-form">Inspection Form</SelectItem>
                <SelectItem value="completion-form">Completion Form</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
