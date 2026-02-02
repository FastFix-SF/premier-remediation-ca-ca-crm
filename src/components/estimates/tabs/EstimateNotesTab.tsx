import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Estimate, useEstimateNotes, useCreateEstimateNote, useDeleteEstimateNote } from '@/hooks/useEstimates';
import { format } from 'date-fns';

interface EstimateNotesTabProps {
  estimate: Estimate;
}

export function EstimateNotesTab({ estimate }: EstimateNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: notes = [], isLoading } = useEstimateNotes(estimate.id);
  const createNote = useCreateEstimateNote();
  const deleteNote = useDeleteEstimateNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    await createNote.mutateAsync({
      estimate_id: estimate.id,
      content: newNote.trim(),
    });
    setNewNote('');
    setIsAdding(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote.mutateAsync({ id: noteId, estimateId: estimate.id });
  };

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Notes</CardTitle>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          )}
        </CardHeader>
        {isAdding && (
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setNewNote('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || createNote.isPending}
                >
                  {createNote.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notes List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading notes...</p>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Notes Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add notes to keep track of important information about this estimate.
              </p>
              {!isAdding && (
                <Button onClick={() => setIsAdding(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Note
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-muted/50 rounded-lg group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
