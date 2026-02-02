import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
}

export interface Update {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  title: string;
  content: string;
  backgroundColor: string;
  status: 'published' | 'archived';
  isRead?: boolean;
  likedBy?: string[];
  comments?: Comment[];
  stats: {
    viewedPercentage: number;
    notViewedPercentage: number;
    comments: number;
    likes: number;
  };
}

interface UpdatesContextType {
  updates: Update[];
  unreadCount: number;
  loading: boolean;
  addUpdate: (update: Omit<Update, 'id' | 'author' | 'date' | 'stats'>) => Promise<void>;
  deleteUpdate: (id: string) => Promise<void>;
  updateUpdate: (id: string, update: Partial<Omit<Update, 'id' | 'author' | 'date' | 'stats'>>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  likeUpdate: (id: string, userId: string) => Promise<void>;
  addComment: (id: string, comment: { userId: string; userName: string; userAvatar: string; text: string }) => Promise<void>;
  hasUserLiked: (updateId: string, userId: string) => boolean;
  getComments: (updateId: string) => Comment[];
}

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

const fetchUpdatesData = async (userId: string): Promise<Update[]> => {
  // Fetch all team updates
  const { data: teamUpdates, error: updatesError } = await supabase
    .from('team_updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (updatesError) throw updatesError;
  if (!teamUpdates) return [];

  // Get all unique user IDs from updates
  const userIds = [...new Set(teamUpdates.map(u => u.created_by))];
  
  // Fetch profiles for all authors
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Fetch interactions for all updates
  const { data: interactions } = await supabase
    .from('team_update_interactions')
    .select('*')
    .in('update_id', teamUpdates.map(u => u.id));

  // Fetch comments for all updates
  const { data: comments } = await supabase
    .from('team_update_comments')
    .select('*')
    .in('update_id', teamUpdates.map(u => u.id))
    .order('created_at', { ascending: true });

  // Build interactions map
  const interactionsMap = new Map<string, any[]>();
  interactions?.forEach(interaction => {
    const list = interactionsMap.get(interaction.update_id) || [];
    list.push(interaction);
    interactionsMap.set(interaction.update_id, list);
  });

  // Build comments map with author data
  const commentsMap = new Map<string, Comment[]>();
  if (comments) {
    const commentUserIds = [...new Set(comments.map(c => c.user_id))];
    const { data: commentProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', commentUserIds);
    
    const commentProfileMap = new Map(commentProfiles?.map(p => [p.id, p]) || []);
    
    comments.forEach(comment => {
      const profile = commentProfileMap.get(comment.user_id);
      const list = commentsMap.get(comment.update_id) || [];
      list.push({
        id: comment.id,
        userId: comment.user_id,
        userName: profile?.display_name || 'Unknown User',
        userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`,
        text: comment.content,
        timestamp: new Date(comment.created_at)
      });
      commentsMap.set(comment.update_id, list);
    });
  }

  // Count total team members for percentage calculation
  const { count: teamMemberCount } = await supabase
    .from('team_directory')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const totalMembers = teamMemberCount || 1;

  // Transform to Update format
  return teamUpdates.map(update => {
    const profile = profileMap.get(update.created_by);
    const updateInteractions = interactionsMap.get(update.id) || [];
    const updateComments = commentsMap.get(update.id) || [];
    
    const viewedCount = updateInteractions.filter(i => i.viewed_at).length;
    const likedBy = updateInteractions.filter(i => i.liked).map(i => i.user_id);
    const userInteraction = updateInteractions.find(i => i.user_id === userId);
    
    const viewedPercentage = Math.round((viewedCount / totalMembers) * 100);
    
    return {
      id: update.id,
      author: {
        name: profile?.display_name || 'Unknown User',
        avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${update.created_by}`
      },
      date: new Date(update.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      title: update.title || '',
      content: update.content,
      backgroundColor: update.background_color,
      status: update.status as 'published' | 'archived',
      isRead: !!userInteraction?.viewed_at,
      likedBy,
      comments: updateComments,
      stats: {
        viewedPercentage,
        notViewedPercentage: 100 - viewedPercentage,
        comments: updateComments.length,
        likes: likedBy.length
      }
    };
  });
};

export const UpdatesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMarkingAllReadRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['team-updates', user?.id],
    queryFn: () => fetchUpdatesData(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Debounced invalidation for real-time subscriptions
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['team-updates', user?.id] });
    }, 500);
  }, [queryClient, user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`team-updates-changes-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_updates'
        },
        () => {
          debouncedInvalidate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_update_interactions'
        },
        () => {
          debouncedInvalidate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_update_comments'
        },
        () => {
          debouncedInvalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, debouncedInvalidate]);
  
  const unreadCount = updates.filter(update => !update.isRead).length;

  const addUpdate = async (update: Omit<Update, 'id' | 'author' | 'date' | 'stats'>) => {
    if (!user) {
      toast.error('You must be logged in to create updates');
      return;
    }

    try {
      const { error } = await supabase
        .from('team_updates')
        .insert({
          title: update.title || null,
          content: update.content,
          background_color: update.backgroundColor,
          status: update.status,
          created_by: user.id
        });

      if (error) throw error;
      
      // Invalidate will be triggered by real-time subscription
    } catch (error) {
      console.error('Error creating update:', error);
      toast.error('Failed to create update');
      throw error;
    }
  };

  const deleteUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate will be triggered by real-time subscription
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Failed to delete update');
      throw error;
    }
  };

  const updateUpdate = async (id: string, updatedFields: Partial<Omit<Update, 'id' | 'author' | 'date' | 'stats'>>) => {
    try {
      const updateData: any = {};
      if (updatedFields.title !== undefined) updateData.title = updatedFields.title || null;
      if (updatedFields.content !== undefined) updateData.content = updatedFields.content;
      if (updatedFields.backgroundColor !== undefined) updateData.background_color = updatedFields.backgroundColor;
      if (updatedFields.status !== undefined) updateData.status = updatedFields.status;

      const { error } = await supabase
        .from('team_updates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate will be triggered by real-time subscription
    } catch (error) {
      console.error('Error updating update:', error);
      toast.error('Failed to update update');
      throw error;
    }
  };

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      // Optimistically update local state
      queryClient.setQueryData(['team-updates', user.id], (old: Update[] | undefined) => {
        if (!old) return old;
        return old.map(update => 
          update.id === id ? { ...update, isRead: true } : update
        );
      });

      const { error } = await supabase
        .from('team_update_interactions')
        .upsert({
          update_id: id,
          user_id: user.id,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'update_id,user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking update as read:', error);
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['team-updates', user.id] });
    }
  }, [user, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user || isMarkingAllReadRef.current) return;
    
    // Check if all are already read
    const unreadUpdates = updates.filter(u => !u.isRead);
    if (unreadUpdates.length === 0) return;
    
    isMarkingAllReadRef.current = true;

    try {
      // Optimistically update local state
      queryClient.setQueryData(['team-updates', user.id], (old: Update[] | undefined) => {
        if (!old) return old;
        return old.map(update => ({ ...update, isRead: true }));
      });

      const readPromises = unreadUpdates.map(update => 
        supabase
          .from('team_update_interactions')
          .upsert({
            update_id: update.id,
            user_id: user.id,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'update_id,user_id'
          })
      );

      await Promise.all(readPromises);
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['team-updates', user.id] });
    } finally {
      isMarkingAllReadRef.current = false;
    }
  }, [user, updates, queryClient]);

  const likeUpdate = useCallback(async (id: string, userId: string) => {
    if (!user) return;

    try {
      const update = updates.find(u => u.id === id);
      const hasLiked = update?.likedBy?.includes(userId) || false;

      const { error } = await supabase
        .from('team_update_interactions')
        .upsert({
          update_id: id,
          user_id: userId,
          liked: !hasLiked
        }, {
          onConflict: 'update_id,user_id'
        });

      if (error) throw error;
      
      // Invalidate will be triggered by real-time subscription
    } catch (error) {
      console.error('Error liking update:', error);
      toast.error('Failed to update like');
      throw error;
    }
  }, [user, updates]);

  const addComment = useCallback(async (id: string, commentData: { userId: string; userName: string; userAvatar: string; text: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_update_comments')
        .insert({
          update_id: id,
          user_id: commentData.userId,
          content: commentData.text
        });

      if (error) throw error;
      
      // Invalidate will be triggered by real-time subscription
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  }, [user]);

  const hasUserLiked = useCallback((updateId: string, userId: string): boolean => {
    const update = updates.find(u => u.id === updateId);
    return update?.likedBy?.includes(userId) || false;
  }, [updates]);

  const getComments = useCallback((updateId: string): Comment[] => {
    const update = updates.find(u => u.id === updateId);
    return update?.comments || [];
  }, [updates]);

  return (
    <UpdatesContext.Provider value={{ 
      updates, 
      unreadCount,
      loading: isLoading,
      addUpdate, 
      deleteUpdate, 
      updateUpdate,
      markAsRead,
      markAllAsRead,
      likeUpdate,
      addComment,
      hasUserLiked,
      getComments
    }}>
      {children}
    </UpdatesContext.Provider>
  );
};

export const useUpdates = () => {
  const context = useContext(UpdatesContext);
  if (context === undefined) {
    throw new Error('useUpdates must be used within an UpdatesProvider');
  }
  return context;
};
