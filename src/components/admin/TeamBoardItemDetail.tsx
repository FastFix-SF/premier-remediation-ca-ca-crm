import React, { useState } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, Send, Clock } from 'lucide-react';
import { useTeamBoardComments, useAddComment, useVoteItem, TeamBoardItem } from '@/hooks/useTeamBoard';
import { formatDistanceToNow } from 'date-fns';

interface TeamBoardItemDetailProps {
  item: TeamBoardItem;
  onStatusChange: (itemId: string, status: string) => void;
  onPriorityChange: (itemId: string, priority: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_discussion', label: 'In Discussion' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORY_EMOJI = {
  problem: '⚠️',
  idea: '💡',
  question: '❓',
};

export default function TeamBoardItemDetail({
  item,
  onStatusChange,
  onPriorityChange,
  onClose,
}: TeamBoardItemDetailProps) {
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading: commentsLoading } = useTeamBoardComments(item.id);
  const addComment = useAddComment();
  const voteItem = useVoteItem();

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment.mutate(
      { itemId: item.id, content: newComment },
      { onSuccess: () => setNewComment('') }
    );
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{CATEGORY_EMOJI[item.category]}</span>
          <Badge variant="outline">{item.category}</Badge>
        </div>
        <DialogTitle className="text-xl">{item.title}</DialogTitle>
      </DialogHeader>

      {item.description && (
        <p className="text-muted-foreground">{item.description}</p>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Created {formatDistanceToNow(new Date(item.created_at))} ago</span>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={item.status} onValueChange={(v) => onStatusChange(item.id, v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Priority:</span>
          <Select value={item.priority} onValueChange={(v) => onPriorityChange(item.id, v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => voteItem.mutate(item.id)}
          className="ml-auto"
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          {item.votes_count} Upvotes
        </Button>
      </div>

      <Separator />

      {/* Comments Section */}
      <div>
        <h3 className="font-semibold mb-3">Discussion</h3>
        
        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : comments?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Start the discussion!</p>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(comment.created_at))} ago
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button
            onClick={handleAddComment}
            disabled={addComment.isPending || !newComment.trim()}
            size="icon"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
