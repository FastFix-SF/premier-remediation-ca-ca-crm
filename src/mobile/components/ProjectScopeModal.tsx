import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Send, ClipboardList, Sparkles, Pencil, Trash2, Check, ClipboardPaste, FileText, Loader2 } from 'lucide-react';
import { useMobileProjectStatusUpdates } from '@/mobile/hooks/useMobileProjectDetails';
import { useMobilePhotos } from '@/mobile/hooks/useMobilePhotos';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PasteLabourReportDialog } from './PasteLabourReportDialog';

interface ProjectScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const ProjectScopeModal: React.FC<ProjectScopeModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isBuildingFromNotes, setIsBuildingFromNotes] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: notes = [], isLoading } = useMobileProjectStatusUpdates(projectId);
  const { data: photos = [] } = useMobilePhotos(projectId);

  // Auto-scroll to top when modal opens (newest notes first)
  useEffect(() => {
    if (scrollRef.current && notes.length > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleAddNote = async () => {
    if (!note.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_status_updates')
        .insert({
          project_id: projectId,
          user_id: user.id,
          notes: note.trim(),
          status: 'note'
        });

      if (error) throw error;

      setNote('');
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      toast({
        title: 'Note added! ✓',
        description: 'Your scope note has been saved.',
      });
    } catch (error) {
      console.error('Failed to add note:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to add note. Try again!',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (noteId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('project_status_updates')
        .update({ is_completed: !currentValue })
        .eq('id', noteId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to update. Try again!',
        variant: 'destructive'
      });
    }
  };

  const handleStartEdit = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId);
    setEditedText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditedText('');
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editedText.trim()) {
      toast({
        title: 'Cannot save empty note',
        description: 'Please enter some text or delete the note.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('project_status_updates')
        .update({ notes: editedText.trim() })
        .eq('id', noteId);

      if (error) throw error;

      setEditingNoteId(null);
      setEditedText('');
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      toast({
        title: 'Note updated! ✓',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to update note. Try again!',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsDeleting(true);
    try {
      console.log('[DELETE] Attempting to delete note:', noteId);
      const { error } = await supabase
        .from('project_status_updates')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('[DELETE] Supabase error:', error);
        throw error;
      }

      console.log('[DELETE] Success - note deleted');
      setPendingDeleteId(null);
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      toast({
        title: 'Note deleted! 🗑️',
        description: 'The scope note has been removed.',
      });
    } catch (error: any) {
      console.error('[DELETE] Failed to delete note:', error);
      toast({
        title: 'Oops!',
        description: error?.message || 'Failed to delete note. Try again!',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllNotes = async () => {
    setIsDeletingAll(true);
    try {
      console.log('[DELETE ALL] Attempting to delete all notes for project:', projectId);
      const { error } = await supabase
        .from('project_status_updates')
        .delete()
        .eq('project_id', projectId);

      if (error) {
        console.error('[DELETE ALL] Supabase error:', error);
        throw error;
      }

      console.log('[DELETE ALL] Success - all notes deleted');
      setPendingDeleteAll(false);
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      toast({
        title: 'All notes deleted! 🗑️',
        description: 'The entire scope has been cleared.',
      });
    } catch (error: any) {
      console.error('[DELETE ALL] Failed:', error);
      toast({
        title: 'Oops!',
        description: error?.message || 'Failed to delete notes. Try again!',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleBuildFromNotes = async () => {
    if (!user) return;
    
    // Gather all non-empty captions and recommendations from photos
    const notesToAdd: string[] = [];
    
    photos.forEach((photo: any) => {
      if (photo.caption && photo.caption.trim()) {
        notesToAdd.push(photo.caption.trim());
      }
      if (photo.recommendation && photo.recommendation.trim()) {
        notesToAdd.push(photo.recommendation.trim());
      }
    });
    
    if (notesToAdd.length === 0) {
      toast({
        title: 'No notes found',
        description: 'No photo notes or recommendations found in this project.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsBuildingFromNotes(true);
    try {
      const inserts = notesToAdd.map(noteText => ({
        project_id: projectId,
        user_id: user.id,
        notes: noteText,
        status: 'note',
        is_completed: false,
      }));
      
      const { error } = await supabase
        .from('project_status_updates')
        .insert(inserts);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      
      toast({
        title: `Added ${notesToAdd.length} items! ✓`,
        description: 'Photo notes and recommendations added to the scope.',
      });
    } catch (error) {
      console.error('Failed to build from notes:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to add notes. Try again!',
        variant: 'destructive',
      });
    } finally {
      setIsBuildingFromNotes(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarGradient = (name?: string) => {
    const gradients = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-pink-400',
      'from-orange-500 to-yellow-400',
      'from-green-500 to-emerald-400',
      'from-red-500 to-rose-400',
      'from-indigo-500 to-violet-400'
    ];
    const index = (name?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy · h:mm a');
  };

  // Sort: uncompleted first (by date desc), then completed (by date desc)
  const sortedNotes = [...notes].sort((a: any, b: any) => {
    // Completed items go to the bottom
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    // Within same completion status, sort by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md h-[85vh] flex flex-col p-0 gap-0 bg-gradient-to-b from-background to-muted/30">
          {/* Header */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ClipboardList className="w-6 h-6 text-amber-900" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Scope of Work 📋</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{projectName}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuildFromNotes}
              disabled={isBuildingFromNotes}
              className="flex-1 gap-2 rounded-xl border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              {isBuildingFromNotes ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-xs font-medium">Build from Notes</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasteDialog(true)}
              className="flex-1 gap-2 rounded-xl border-primary/50 hover:bg-primary/10"
            >
              <ClipboardPaste className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Paste Labor Report</span>
            </Button>
            {/* Delete All - with inline confirmation */}
            {pendingDeleteAll ? (
              <div className="flex-1 flex items-center gap-2 justify-between bg-destructive/10 p-2 rounded-xl border border-destructive/30">
                <span className="text-xs font-medium text-destructive">Delete all?</span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDeleteAll(false)}
                    disabled={isDeletingAll}
                    className="rounded-lg h-7 text-xs px-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAllNotes}
                    disabled={isDeletingAll}
                    className="rounded-lg h-7 text-xs px-2 gap-1"
                  >
                    {isDeletingAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingDeleteAll(true)}
                disabled={notes.length === 0}
                className="flex-1 gap-2 rounded-xl border-destructive/50 hover:bg-destructive/10 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs font-medium">Delete All</span>
              </Button>
            )}
          </div>

          {/* Notes List - Simplified Checklist */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-500/20 animate-pulse" />
                <p className="text-muted-foreground animate-pulse">Loading...</p>
              </div>
            ) : sortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400/30 to-yellow-500/20 flex items-center justify-center animate-bounce">
                    <ClipboardList className="h-12 w-12 text-amber-500" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No Scope Yet 📋</h3>
                <p className="text-muted-foreground text-lg">
                  Add the project scope below
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {sortedNotes.map((noteItem: any) => {
                  const isCompleted = noteItem.is_completed || false;
                  const isEditing = editingNoteId === noteItem.id;
                  
                  return (
                    <div 
                      key={noteItem.id}
                      className={`flex items-start gap-3 p-4 transition-all ${
                        isCompleted ? 'bg-muted/30' : 'bg-background'
                      }`}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleComplete(noteItem.id, isCompleted)}
                        className="h-6 w-6 mt-0.5 flex-shrink-0 rounded-md border-2 border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              className="min-h-[60px] resize-none rounded-xl border-2 border-amber-400/50 focus:border-amber-400 bg-muted/30 text-sm"
                              autoFocus
                            />
                            {/* Inline delete confirmation */}
                            {pendingDeleteId === noteItem.id ? (
                              <div className="flex items-center gap-2 justify-between bg-destructive/10 p-2 rounded-lg border border-destructive/30">
                                <span className="text-sm font-medium text-destructive">Delete this note?</span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDeleteId(null);
                                    }}
                                    disabled={isDeleting}
                                    className="rounded-lg h-8"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(noteItem.id);
                                    }}
                                    disabled={isDeleting}
                                    className="rounded-lg h-8 gap-1"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDeleteId(noteItem.id);
                                  }}
                                  className="rounded-lg h-8 gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="rounded-lg h-8"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(noteItem.id)}
                                  className="rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900 hover:from-amber-500 hover:to-yellow-600 h-8"
                                >
                                  Save
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="flex items-start justify-between gap-2 cursor-pointer"
                            onClick={() => handleStartEdit(noteItem.id, noteItem.notes)}
                          >
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {noteItem.notes}
                            </p>
                            <Pencil className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Note Input */}
          <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add scope or notes..."
                  className="min-h-[52px] max-h-[120px] resize-none rounded-2xl border-2 border-border/50 focus:border-amber-400/50 bg-muted/30 text-base placeholder:text-muted-foreground/60 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleAddNote}
                disabled={!note.trim() || isSubmitting}
                size="icon"
                className={`h-[52px] w-[52px] rounded-2xl shadow-lg transition-all duration-200 ${
                  note.trim() 
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 hover:scale-105 hover:shadow-xl shadow-amber-500/30' 
                    : 'bg-muted'
                }`}
              >
                <Send className={`h-6 w-6 ${note.trim() ? 'text-amber-900' : ''} ${isSubmitting ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paste Labour Report Dialog */}
      <PasteLabourReportDialog
        isOpen={showPasteDialog}
        onClose={() => setShowPasteDialog(false)}
        projectId={projectId}
      />
    </>
  );
};
