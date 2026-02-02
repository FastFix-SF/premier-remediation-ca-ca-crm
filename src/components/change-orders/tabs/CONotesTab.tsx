import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  useChangeOrderNotes, 
  useCreateChangeOrderNote, 
  useDeleteChangeOrderNote 
} from '@/hooks/useChangeOrders';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface CONotesTabProps {
  changeOrderId?: string;
}

export function CONotesTab({ changeOrderId }: CONotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const { data: notes = [], isLoading } = useChangeOrderNotes(changeOrderId);
  const createMutation = useCreateChangeOrderNote();
  const deleteMutation = useDeleteChangeOrderNote();

  if (!changeOrderId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Save the change order first to add notes.
      </div>
    );
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createMutation.mutateAsync({
      change_order_id: changeOrderId,
      content: newNote.trim(),
    });
    setNewNote('');
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            Add Note
          </div>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your note here..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddNote} 
              disabled={!newNote.trim() || createMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
          <p>No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id} className="group">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate({ id: note.id, changeOrderId })}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
