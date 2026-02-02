import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddProjectSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string) => void;
  isLoading?: boolean;
}

export const AddProjectSubtaskModal: React.FC<AddProjectSubtaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim() || undefined);
    setTitle('');
    setDescription('');
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto z-[10002]">
        <DialogHeader>
          <DialogTitle>Add Subtask</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Subtask title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
              {isLoading ? 'Adding...' : 'Add Subtask'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
