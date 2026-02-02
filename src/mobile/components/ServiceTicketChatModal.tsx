import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useServiceTicketNotes, useAddServiceTicketNote } from '@/hooks/useServiceTickets';
import { formatDistanceToNow } from 'date-fns';

interface ServiceTicketChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
}

export const ServiceTicketChatModal: React.FC<ServiceTicketChatModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle
}) => {
  const [message, setMessage] = useState('');
  const { data: notes = [], isLoading } = useServiceTicketNotes(ticketId);
  const addNote = useAddServiceTicketNote();

  const handleSend = async () => {
    if (message.trim()) {
      await addNote.mutateAsync({ ticketId, content: message.trim() });
      setMessage('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Notes - {ticketTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notes yet. Add the first note below.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder="Add a note..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={!message.trim() || addNote.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
