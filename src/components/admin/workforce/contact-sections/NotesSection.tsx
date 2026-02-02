import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, StickyNote, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AddNoteDialog from './AddNoteDialog';
import { useContactDetails } from '@/hooks/useContactDetails';

interface NotesSectionProps {
  contactId?: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ contactId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { notes, notesLoading, deleteNote } = useContactDetails(contactId);

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote.mutate(noteId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notesLoading ? (
        <div className="bg-background rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-background rounded-lg border p-8 text-center">
          <div className="text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">No Notes Yet</h3>
            <p className="text-sm">Click "Add Note" to create a note for this contact.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-background rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{note.title || 'Untitled Note'}</h4>
                  {note.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {note.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddNoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactId={contactId}
      />
    </div>
  );
};

export default NotesSection;
