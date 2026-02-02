import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useServiceTicketNotes, useAddServiceTicketNote } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';

interface ServiceTicketNotesTabProps {
  ticketId: string;
}

export const ServiceTicketNotesTab: React.FC<ServiceTicketNotesTabProps> = ({ ticketId }) => {
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: notes = [] } = useServiceTicketNotes(ticketId);
  const addNote = useAddServiceTicketNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await addNote.mutateAsync({
      ticketId,
      content: newNote.trim(),
    });

    setNewNote('');
    setShowAddNote(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-500 rounded" />
            Notes
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddNote(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddNote && (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || addNote.isPending}>
                Save Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showAddNote && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No Records Available</p>
          </div>
        )}

        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-3">
              <p className="text-sm">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(note.created_at), 'MM/dd/yyyy hh:mm a')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
