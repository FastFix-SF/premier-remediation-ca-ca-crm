import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChangeOrder {
  id: string;
  project_id: string;
  change_order_number: string;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'voided';
  requested_by?: string;
  approved_by?: string;
  requested_at: string;
  approved_at?: string;
  reason?: string;
  impact_days: number;
  created_at: string;
}

export interface Inspection {
  id: string;
  project_id: string;
  inspection_type: string;
  title: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  status: 'scheduled' | 'passed' | 'failed' | 'cancelled' | 'rescheduled';
  inspector_name?: string;
  inspector_phone?: string;
  inspector_email?: string;
  result_notes?: string;
  completed_at?: string;
  created_at: string;
}

export interface PunchlistItem {
  id: string;
  project_id: string;
  item_number: number;
  title: string;
  description?: string;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'verified';
  assigned_to?: string;
  photo_url?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface ProjectSummaryData {
  changeOrders: ChangeOrder[];
  inspections: Inspection[];
  punchlists: PunchlistItem[];
  contractSummary: {
    originalContract: number;
    approvedChangeOrders: number;
    pendingChangeOrders: number;
    revisedContract: number;
    retention: number;
    retentionAmount: number;
  };
  actionItems: {
    openPunchlists: number;
    pendingInspections: number;
    pendingChangeOrders: number;
    overdueItems: number;
  };
}

export const useProjectSummary = (projectId: string) => {
  // Fetch change orders
  const changeOrdersQuery = useQuery({
    queryKey: ['project-change-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ChangeOrder[];
    },
    enabled: !!projectId,
  });

  // Fetch inspections
  const inspectionsQuery = useQuery({
    queryKey: ['project-inspections', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Inspection[];
    },
    enabled: !!projectId,
  });

  // Fetch punchlists
  const punchlistsQuery = useQuery({
    queryKey: ['project-punchlists', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_punchlists')
        .select('*')
        .eq('project_id', projectId)
        .order('item_number', { ascending: true });
      
      if (error) throw error;
      return (data || []) as PunchlistItem[];
    },
    enabled: !!projectId,
  });

  // Fetch project with proposal data
  const projectQuery = useQuery({
    queryKey: ['project-with-proposal', projectId],
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*, contract_amount, retention_percentage')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Try to get proposal data
      let proposalAmount = 0;
      if (project?.customer_email) {
        const { data: proposals } = await supabase
          .from('project_proposals')
          .select('contract_price')
          .eq('client_email', project.customer_email)
          .eq('status', 'accepted')
          .maybeSingle();
        
        if (proposals?.contract_price) {
          proposalAmount = proposals.contract_price;
        }
      }
      
      return {
        ...project,
        proposalAmount
      };
    },
    enabled: !!projectId,
  });

  // Calculate summary data
  const changeOrders = changeOrdersQuery.data || [];
  const inspections = inspectionsQuery.data || [];
  const punchlists = punchlistsQuery.data || [];
  const project = projectQuery.data;

  const approvedCOs = changeOrders.filter(co => co.status === 'approved');
  const pendingCOs = changeOrders.filter(co => co.status === 'pending');
  
  const approvedCOAmount = approvedCOs.reduce((sum, co) => sum + (co.amount || 0), 0);
  const pendingCOAmount = pendingCOs.reduce((sum, co) => sum + (co.amount || 0), 0);
  
  const originalContract = project?.contract_amount || project?.proposalAmount || 0;
  const revisedContract = originalContract + approvedCOAmount;
  const retentionPct = project?.retention_percentage || 10;
  const retentionAmount = revisedContract * (retentionPct / 100);

  const openPunchlists = punchlists.filter(p => p.status === 'open' || p.status === 'in_progress').length;
  const pendingInspections = inspections.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').length;
  
  const today = new Date().toISOString().split('T')[0];
  const overdueItems = punchlists.filter(p => 
    (p.status === 'open' || p.status === 'in_progress') && 
    p.due_date && 
    p.due_date < today
  ).length;

  const summaryData: ProjectSummaryData = {
    changeOrders,
    inspections,
    punchlists,
    contractSummary: {
      originalContract,
      approvedChangeOrders: approvedCOAmount,
      pendingChangeOrders: pendingCOAmount,
      revisedContract,
      retention: retentionPct,
      retentionAmount,
    },
    actionItems: {
      openPunchlists,
      pendingInspections,
      pendingChangeOrders: pendingCOs.length,
      overdueItems,
    },
  };

  return {
    data: summaryData,
    isLoading: changeOrdersQuery.isLoading || inspectionsQuery.isLoading || punchlistsQuery.isLoading || projectQuery.isLoading,
    error: changeOrdersQuery.error || inspectionsQuery.error || punchlistsQuery.error || projectQuery.error,
    refetch: () => {
      changeOrdersQuery.refetch();
      inspectionsQuery.refetch();
      punchlistsQuery.refetch();
      projectQuery.refetch();
    }
  };
};
