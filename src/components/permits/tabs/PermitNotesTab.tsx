import React, { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePermitNotes, useCreatePermitNote, useDeletePermitNote } from '@/hooks/usePermits';
import { format } from 'date-fns';

interface PermitNotesTabProps {
  permitId: string;
}

export const PermitNotesTab: React.FC<PermitNotesTabProps> = ({ permitId }) => {
  const { data: notes = [], isLoading } = usePermitNotes(permitId);
  const createNote = useCreatePermitNote();
  const deleteNote = useDeletePermitNote();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return;
    
    await createNote.mutateAsync({
      permit_id: permitId,
      title: newNote.title || null,
      content: newNote.content,
    });
    
    setNewNote({ title: '', content: '' });
    setIsDialogOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote.mutateAsync({ noteId, permitId });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Notes
          </CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Note
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="relative mb-4">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <span className="text-xs">✕</span>
                </div>
              </div>
              <p>No Records Available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 relative group">
                  {note.title && (
                    <h4 className="font-medium mb-1">{note.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title (optional)"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={createNote.isPending || !newNote.content.trim()}>
              {createNote.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
