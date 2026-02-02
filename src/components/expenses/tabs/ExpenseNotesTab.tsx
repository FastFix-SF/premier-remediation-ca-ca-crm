import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExpenseNotes } from '@/hooks/useExpenses';
import { format } from 'date-fns';
import { Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';

interface ExpenseNotesTabProps {
  expenseId: string;
}

export const ExpenseNotesTab = ({ expenseId }: ExpenseNotesTabProps) => {
  const { notes, isLoading, createNote, deleteNote } = useExpenseNotes(expenseId);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync(newNote);
    setNewNote('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="min-h-[100px]"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNote.trim() || createNote.isPending}
          className="w-full"
        >
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {notes && notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                    {note.content}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNote.mutate(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No notes yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
