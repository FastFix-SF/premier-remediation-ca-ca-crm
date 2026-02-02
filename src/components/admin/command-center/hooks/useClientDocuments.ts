import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientDocument {
  id: string;
  type: 'contract' | 'proposal' | 'document' | 'photo';
  name: string;
  category: string;
  status: string | null;
  fileUrl: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const useClientDocuments = (projectId: string | undefined) => {
  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['client-contracts', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('client_contracts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(doc => ({
        id: doc.id,
        type: 'contract' as const,
        name: doc.title || 'Contract',
        category: 'Contracts',
        status: doc.status,
        fileUrl: doc.file_url,
        createdAt: doc.created_at,
        metadata: doc
      }));
    },
    enabled: !!projectId
  });

  // Fetch proposals - use correct fields from project_proposals
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['client-proposals', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_proposals')
        .select('*')
        .eq('quote_request_id', projectId) // proposals link via quote_request_id
        .order('created_at', { ascending: false });
      
      // If nothing found by quote_request_id, try fetching by matching address
      if (error || !data || data.length === 0) {
        // Get project address
        const { data: project } = await supabase
          .from('projects')
          .select('address')
          .eq('id', projectId)
          .maybeSingle();
        
        if (project?.address) {
          const { data: proposalsByAddress } = await supabase
            .from('project_proposals')
            .select('*')
            .ilike('property_address', `%${project.address.split(',')[0]}%`)
            .order('created_at', { ascending: false });
          
          return (proposalsByAddress || []).map(doc => ({
            id: doc.id,
            type: 'proposal' as const,
            name: `Proposal ${doc.proposal_number}`,
            category: 'Proposals',
            status: doc.status,
            fileUrl: doc.contract_url, // Use contract_url as the file URL
            createdAt: doc.created_at,
            metadata: doc
          }));
        }
        return [];
      }
      
      return (data || []).map(doc => ({
        id: doc.id,
        type: 'proposal' as const,
        name: `Proposal ${doc.proposal_number}`,
        category: 'Proposals',
        status: doc.status,
        fileUrl: doc.contract_url,
        createdAt: doc.created_at,
        metadata: doc
      }));
    },
    enabled: !!projectId
  });

  // Fetch project documents - use 'name' instead of 'document_name'
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['client-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(doc => ({
        id: doc.id,
        type: 'document' as const,
        name: doc.name,
        category: doc.category || 'General',
        status: null,
        fileUrl: doc.file_url,
        createdAt: doc.uploaded_at,
        metadata: doc
      }));
    },
    enabled: !!projectId
  });

  // Combine all documents
  const allDocuments: ClientDocument[] = [
    ...contracts,
    ...proposals,
    ...documents
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Group by category
  const documentsByCategory = allDocuments.reduce((acc, doc) => {
    const category = doc.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, ClientDocument[]>);

  return {
    allDocuments,
    contracts,
    proposals,
    documents,
    documentsByCategory,
    isLoading: contractsLoading || proposalsLoading || documentsLoading
  };
};
