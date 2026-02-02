import { useState } from 'react';
import { Bill, useBillNotes, useCreateBillNote, useDeleteBillNote } from '@/hooks/useBills';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, StickyNote, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BillNotesTabProps {
  bill: Bill;
}

export function BillNotesTab({ bill }: BillNotesTabProps) {
  const { data: notes = [], isLoading } = useBillNotes(bill.id);
  const createNote = useCreateBillNote();
  const deleteNote = useDeleteBillNote();
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync({
        bill_id: bill.id,
        content: newNote.trim(),
      });
      toast.success('Note added');
      setNewNote('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ id: noteId, billId: bill.id });
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          Notes
        </h4>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Note
        </Button>
      </div>

      {isAdding && (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note..."
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddNote} disabled={createNote.isPending || !newNote.trim()}>
              {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No Records Available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.created_at), 'MM/dd/yyyy h:mm a')}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
