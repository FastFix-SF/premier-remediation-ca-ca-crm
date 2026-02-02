import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface AddSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId: string;
  editSubtask?: any;
  teamMembers: TeamMember[];
  existingCount: number;
}

export const AddSubtaskModal: React.FC<AddSubtaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskId,
  editSubtask,
  teamMembers,
  existingCount,
}) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');

  useEffect(() => {
    if (editSubtask) {
      setTitle(editSubtask.title || '');
      setDescription(editSubtask.description || '');
      setAssignedTo(editSubtask.assigned_to || 'unassigned');
    } else {
      resetForm();
    }
  }, [editSubtask, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('unassigned');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      const subtaskData = {
        parent_task_id: taskId,
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo && assignedTo !== 'unassigned' ? assignedTo : null,
        order_index: editSubtask ? editSubtask.order_index : existingCount,
      };

      if (editSubtask) {
        const { error } = await supabase
          .from('task_subtasks')
          .update(subtaskData)
          .eq('id', editSubtask.id);
        if (error) throw error;
        toast.success('Subtask updated');
      } else {
        const { error } = await supabase
          .from('task_subtasks')
          .insert(subtaskData);
        if (error) throw error;
        toast.success('Subtask created');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving subtask:', error);
      toast.error(error.message || 'Failed to save subtask');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>
            {editSubtask ? 'Edit Subtask' : 'Add Subtask'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subtask title"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="unassigned" className="text-white">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id} className="text-white">
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} className="text-white/60">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            {loading ? 'Saving...' : editSubtask ? 'Update' : 'Add Subtask'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
