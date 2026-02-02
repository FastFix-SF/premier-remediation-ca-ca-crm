import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useSafetyMeetingNotes, useCreateSafetyMeetingNote, useDeleteSafetyMeetingNote } from '@/hooks/useSafetyMeetings';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SafetyMeetingNotesTabProps {
  meetingId: string;
}

export function SafetyMeetingNotesTab({ meetingId }: SafetyMeetingNotesTabProps) {
  const { data: notes = [], isLoading } = useSafetyMeetingNotes(meetingId);
  const createNote = useCreateSafetyMeetingNote();
  const deleteNote = useDeleteSafetyMeetingNote();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    try {
      await createNote.mutateAsync({
        meeting_id: meetingId,
        title: newNote.title || null,
        content: newNote.content,
      });
      setNewNote({ title: '', content: '' });
      setShowAddNote(false);
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ id: noteId, meetingId });
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddNote(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title (optional)</Label>
              <Input 
                value={newNote.title}
                onChange={(e) => setNewNote(n => ({ ...n, title: e.target.value }))}
                placeholder="Note title..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <Textarea 
                value={newNote.content}
                onChange={(e) => setNewNote(n => ({ ...n, content: e.target.value }))}
                placeholder="Write your note here..."
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={createNote.isPending}>
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No notes yet. Click "Add Note" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="group">
              <CardContent className="pt-4">
                {note.title && (
                  <h4 className="font-semibold mb-2">{note.title}</h4>
                )}
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.created_at), 'MM/dd/yyyy h:mm a')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
