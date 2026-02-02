import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeamBoardItem {
  id: string;
  title: string;
  description: string | null;
  category: 'problem' | 'idea' | 'question';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_discussion' | 'approved' | 'in_progress' | 'done' | 'rejected';
  created_by: string | null;
  assigned_to: string | null;
  feedback_id: string | null;
  votes_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamBoardComment {
  id: string;
  item_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useTeamBoardItems(filters?: { status?: string; category?: string }) {
  return useQuery({
    queryKey: ['team-board-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('team_board_items')
        .select('*')
        .order('votes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamBoardItem[];
    },
  });
}

export function useTeamBoardComments(itemId: string | null) {
  return useQuery({
    queryKey: ['team-board-comments', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('team_board_comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TeamBoardComment[];
    },
    enabled: !!itemId,
  });
}

export function useCreateBoardItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: { title: string; description?: string; category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_board_items')
        .insert({
          title: item.title,
          description: item.description || null,
          category: item.category,
          created_by: user.id,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-board-items'] });
      toast.success('Item added to the board');
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateBoardItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamBoardItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('team_board_items')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-board-items'] });
      toast.success('Item updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_board_comments')
        .insert({
          item_id: itemId,
          content,
          created_by: user.id,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-board-comments', variables.itemId] });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useVoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already voted
      const { data: existingVote } = await supabase
        .from('team_board_votes')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        const { error } = await supabase
          .from('team_board_votes')
          .delete()
          .eq('id', existingVote.id);
        if (error) throw error;
        return { action: 'unvoted' };
      } else {
        // Add vote
        const { error } = await supabase
          .from('team_board_votes')
          .insert({ item_id: itemId, user_id: user.id });
        if (error) throw error;
        return { action: 'voted' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['team-board-items'] });
      toast.success(result.action === 'voted' ? 'Upvoted!' : 'Vote removed');
    },
    onError: (error) => {
      toast.error(`Failed to vote: ${error.message}`);
    },
  });
}
