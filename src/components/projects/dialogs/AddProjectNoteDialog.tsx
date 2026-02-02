import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AddProjectNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddProjectNoteDialog: React.FC<AddProjectNoteDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('project_status_updates')
        .insert({
          project_id: projectId,
          notes: notes.trim(),
          status: 'note',
          user_id: user.user?.id || '',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
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
          <DialogTitle>Add Project Note</DialogTitle>
          <DialogDescription>
            Add a note or status update for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Note *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your note..."
              rows={5}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
