import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { useInvoiceNotes, useCreateInvoiceNote, useDeleteInvoiceNote } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface InvoiceNotesTabProps {
  invoiceId: string;
}

export function InvoiceNotesTab({ invoiceId }: InvoiceNotesTabProps) {
  const { data: notes = [], isLoading } = useInvoiceNotes(invoiceId);
  const createNote = useCreateInvoiceNote();
  const deleteNote = useDeleteInvoiceNote();
  
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    await createNote.mutateAsync({
      invoice_id: invoiceId,
      content: newNoteContent.trim()
    });
    
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading notes...</div>;

  return (
    <div className="space-y-4">
      {/* Add Note Button/Form */}
      {isAddingNote ? (
        <Card>
          <CardContent className="p-4 space-y-3">
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
      ) : (
        <Button onClick={() => setIsAddingNote(true)} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
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
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.created_at || ''), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => deleteNote.mutate({ id: note.id, invoiceId })}
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
