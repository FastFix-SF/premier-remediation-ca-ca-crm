import React, { useState } from 'react';
import { Plus, Trash2, StickyNote, FileText, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DailyLogNote,
  useAddDailyLogNote,
  useDeleteDailyLogNote,
} from '@/hooks/useDailyLogs';

interface NotesTabProps {
  dailyLogId: string;
  notes: DailyLogNote[];
}

export const NotesTab: React.FC<NotesTabProps> = ({ dailyLogId, notes }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [noteType, setNoteType] = useState<'general' | 'project' | 'safety'>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const addMutation = useAddDailyLogNote();
  const deleteMutation = useDeleteDailyLogNote();

  const generalNotes = notes.filter((n) => n.note_type === 'general');
  const projectNotes = notes.filter((n) => n.note_type === 'project');
  const safetyNotes = notes.filter((n) => n.note_type === 'safety');

  const handleAdd = async () => {
    await addMutation.mutateAsync({
      daily_log_id: dailyLogId,
      note_type: noteType,
      title: title || null,
      content,
      posted_by: null,
    });
    setTitle('');
    setContent('');
    setAddOpen(false);
  };

  const NoteCard = ({ note }: { note: DailyLogNote }) => (
    <div className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {note.title && <h4 className="font-medium text-sm">{note.title}</h4>}
          <p className="text-xs text-muted-foreground">
            {format(new Date(note.posted_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteMutation.mutate({ id: note.id, dailyLogId })}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
    </div>
  );

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FileText className="w-4 h-4" />;
      case 'safety':
        return <Shield className="w-4 h-4" />;
      default:
        return <StickyNote className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* General Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            General Notes ({generalNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generalNotes.length > 0 ? (
            <div className="space-y-3">
              {generalNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No general notes</p>
          )}
        </CardContent>
      </Card>

      {/* Project Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Project Notes ({projectNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectNotes.length > 0 ? (
            <div className="space-y-3">
              {projectNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No project notes</p>
          )}
        </CardContent>
      </Card>

      {/* Safety Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Safety Notes ({safetyNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safetyNotes.length > 0 ? (
            <div className="space-y-3">
              {safetyNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No safety notes</p>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4" />
                      General Note
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Project Note
                    </div>
                  </SelectItem>
                  <SelectItem value="safety">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Safety Note
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!content.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
