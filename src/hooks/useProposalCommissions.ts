import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProposalCommission {
  id: string;
  proposal_id: string;
  team_member_id: string;
  team_member_name: string;
  commission_amount: number;
  created_at: string;
  updated_at: string;
}

export const useProposalCommissions = (proposalId?: string) => {
  const queryClient = useQueryClient();

  // Fetch commissions for a proposal
  const { data: commissions = [], isLoading, error } = useQuery({
    queryKey: ['proposal-commissions', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];
      
      const { data, error } = await supabase
        .from('proposal_commissions')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at');

      if (error) throw error;
      return (data || []) as ProposalCommission[];
    },
    enabled: !!proposalId
  });

  // Add/update commission (upsert)
  const upsertCommission = useMutation({
    mutationFn: async (data: {
      proposal_id: string;
      team_member_id: string;
      team_member_name: string;
      commission_amount: number;
    }) => {
      const { error } = await supabase
        .from('proposal_commissions')
        .upsert(data, { onConflict: 'proposal_id,team_member_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-commissions', proposalId] });
      toast.success('Commission added');
    },
    onError: (error) => {
      console.error('Error adding commission:', error);
      toast.error('Failed to add commission');
    }
  });

  // Delete commission
  const deleteCommission = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('proposal_commissions')
        .delete()
        .eq('id', commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-commissions', proposalId] });
      toast.success('Commission removed');
    },
    onError: (error) => {
      console.error('Error deleting commission:', error);
      toast.error('Failed to remove commission');
    }
  });

  // Calculate total commission
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);

  return {
    commissions,
    isLoading,
    error,
    totalCommission,
    upsertCommission,
    deleteCommission
  };
};
