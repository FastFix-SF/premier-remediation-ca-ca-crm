import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
}

interface TaskCommentsProps {
  taskId?: string;
  subtaskId?: string;
  teamMembers: TeamMember[];
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  subtaskId,
  teamMembers,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Collect all author IDs for avatar fetching
  const authorIds = useMemo(() => {
    return [...new Set(comments.map(c => c.author_id).filter(Boolean))];
  }, [comments]);

  const { data: avatarMap = {} } = useAvatars(authorIds);

  useEffect(() => {
    if (taskId || subtaskId) {
      fetchComments();
    }
  }, [taskId, subtaskId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('task_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (taskId) {
        query = query.eq('task_id', taskId);
      } else if (subtaskId) {
        query = query.eq('subtask_id', subtaskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('You must be logged in to comment');
        return;
      }

      const commentData: any = {
        content: newComment.trim(),
        author_id: userData.user.id,
      };

      if (taskId) {
        commentData.task_id = taskId;
      } else if (subtaskId) {
        commentData.subtask_id = subtaskId;
      }

      const { error } = await supabase
        .from('task_comments')
        .insert(commentData);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthorName = (authorId: string) => {
    const member = teamMembers.find(m => m.user_id === authorId);
    return member?.full_name || 'Unknown';
  };

  const getAuthorInitial = (authorId: string) => {
    const name = getAuthorName(authorId);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <ScrollArea className="flex-1 h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            No comments yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4 pr-4 py-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={avatarMap[comment.author_id]} alt={getAuthorName(comment.author_id)} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                    {getAuthorInitial(comment.author_id)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {getAuthorName(comment.author_id)}
                    </span>
                    <span className="text-xs text-white/40">
                      {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Comment Input */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="bg-white/5 border-white/10 text-white min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            size="icon"
            className="bg-indigo-500 hover:bg-indigo-600 h-[60px] w-[60px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-white/40 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
