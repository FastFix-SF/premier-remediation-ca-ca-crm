import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePunchlist } from '@/hooks/usePunchlists';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AddPunchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddPunchlistDialog: React.FC<AddPunchlistDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPunchlist = useCreatePunchlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPunchlist.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      toast({
        title: "Success",
        description: "Punchlist created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['project-document-counts'] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items'] });
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating punchlist:', error);
      toast({
        title: "Error",
        description: "Failed to create punchlist",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Punchlist</DialogTitle>
          <DialogDescription>
            Create a new punchlist to track items needing completion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Final Walkthrough Items"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPunchlist.isPending}>
              {createPunchlist.isPending ? 'Creating...' : 'Create Punchlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
