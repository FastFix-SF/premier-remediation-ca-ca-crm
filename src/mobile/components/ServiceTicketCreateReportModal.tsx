import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceTicketCreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
}

export const ServiceTicketCreateReportModal: React.FC<ServiceTicketCreateReportModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    setCreating(true);
    try {
      // For now, show a placeholder message
      // In production, this would create a report document
      toast.success('Report feature coming soon');
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      toast.error('Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input
              placeholder="e.g., Service Completion Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Enter report details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="flex-1" disabled={creating}>
              {creating ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
