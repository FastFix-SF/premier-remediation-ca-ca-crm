import { useState } from "react";
import { SubContract, useSubContractNotes, useCreateSubContractNote, useDeleteSubContractNote } from "@/hooks/useSubContracts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface SubContractNotesTabProps {
  subContract: SubContract;
}

export function SubContractNotesTab({ subContract }: SubContractNotesTabProps) {
  const { data: notes = [], isLoading } = useSubContractNotes(subContract.id);
  const createNote = useCreateSubContractNote();
  const deleteNote = useDeleteSubContractNote();
  const [newNote, setNewNote] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate(
      { sub_contract_id: subContract.id, content: newNote },
      {
        onSuccess: () => {
          setNewNote('');
          setShowInput(false);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Note
        </Button>
      </div>

      {showInput && (
        <Card className="p-3 space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={createNote.isPending || !newNote.trim()}
            >
              {createNote.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">No Records Available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id} className="p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNote.mutate({ id: note.id, subContractId: subContract.id })}
                  disabled={deleteNote.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
