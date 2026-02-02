import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { usePaymentNotes, useCreatePaymentNote, useDeletePaymentNote } from '@/hooks/usePayments';
import { format } from 'date-fns';

interface PaymentNotesTabProps {
  paymentId: string;
}

export function PaymentNotesTab({ paymentId }: PaymentNotesTabProps) {
  const { data: notes = [], isLoading } = usePaymentNotes(paymentId);
  const createNote = useCreatePaymentNote();
  const deleteNote = useDeletePaymentNote();
  
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    await createNote.mutateAsync({
      payment_id: paymentId,
      title: newNoteTitle.trim() || undefined,
      content: newNoteContent.trim()
    });
    
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading notes...</div>;

  return (
    <div className="space-y-4">
      {/* Add Note Button/Form */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAddingNote(true)} size="sm" disabled={isAddingNote}>
          <Plus className="h-4 w-4 mr-2" />
          Note
        </Button>
      </div>

      {isAddingNote && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Title (optional)"
            />
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Enter note..."
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 && !isAddingNote ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {note.title && (
                      <p className="font-medium text-sm mb-1">{note.title}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Posted: {format(new Date(note.created_at || ''), 'MM/dd/yyyy')} at {format(new Date(note.created_at || ''), 'hh:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => deleteNote.mutate({ id: note.id, paymentId })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
