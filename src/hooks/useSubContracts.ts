import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubContract {
  id: string;
  agreement_number: string | null;
  subject: string;
  project_id: string | null;
  subcontractor_id: string | null;
  issued_by: string | null;
  date: string | null;
  work_retainage_percent: number | null;
  total: number | null;
  billed_amount: number | null;
  total_retainage: number | null;
  remaining_retainage: number | null;
  paid: number | null;
  balance: number | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string } | null;
  subcontractor?: { company: string; contact_name: string } | null;
}

export interface SubContractItem {
  id: string;
  sub_contract_id: string;
  item_type: string | null;
  item_name: string;
  cost_code: string | null;
  quantity: number | null;
  unit_cost: number | null;
  unit: string | null;
  billed: number | null;
  remaining: number | null;
  total: number | null;
  display_order: number | null;
  created_at: string;
}

export interface SubContractTerms {
  id: string;
  sub_contract_id: string;
  default_terms: string | null;
  scope_of_work: string | null;
  inclusions: string | null;
  exclusions: string | null;
  clarifications: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubContractNote {
  id: string;
  sub_contract_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface SubContractFile {
  id: string;
  sub_contract_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface SubContractDocument {
  id: string;
  sub_contract_id: string;
  policy_type: string | null;
  policy_number: string | null;
  expires_at: string | null;
  status: string | null;
  file_url: string | null;
  created_at: string;
}

export interface SubContractBill {
  id: string;
  sub_contract_id: string;
  bill_number: string | null;
  bill_date: string | null;
  due_date: string | null;
  total: number | null;
  paid: number | null;
  created_at: string;
}

export function useSubContracts() {
  return useQuery({
    queryKey: ['sub-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_contracts')
        .select(`
          *,
          project:projects(name),
          subcontractor:directory_contacts(company, contact_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubContract[];
    },
  });
}

export function useSubContract(id: string | null) {
  return useQuery({
    queryKey: ['sub-contract', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sub_contracts')
        .select(`
          *,
          project:projects(name),
          subcontractor:directory_contacts(company, contact_name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as SubContract;
    },
    enabled: !!id,
  });
}

export function useSubContractItems(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-items', subContractId],
    queryFn: async () => {
      if (!subContractId) return [];
      const { data, error } = await supabase
        .from('sub_contract_items')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .order('display_order');
      
      if (error) throw error;
      return data as SubContractItem[];
    },
    enabled: !!subContractId,
  });
}

export function useSubContractTerms(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-terms', subContractId],
    queryFn: async () => {
      if (!subContractId) return null;
      const { data, error } = await supabase
        .from('sub_contract_terms')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .maybeSingle();
      
      if (error) throw error;
      return data as SubContractTerms | null;
    },
    enabled: !!subContractId,
  });
}

export function useSubContractNotes(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-notes', subContractId],
    queryFn: async () => {
      if (!subContractId) return [];
      const { data, error } = await supabase
        .from('sub_contract_notes')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubContractNote[];
    },
    enabled: !!subContractId,
  });
}

export function useSubContractFiles(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-files', subContractId],
    queryFn: async () => {
      if (!subContractId) return [];
      const { data, error } = await supabase
        .from('sub_contract_files')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as SubContractFile[];
    },
    enabled: !!subContractId,
  });
}

export function useSubContractDocuments(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-documents', subContractId],
    queryFn: async () => {
      if (!subContractId) return [];
      const { data, error } = await supabase
        .from('sub_contract_documents')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubContractDocument[];
    },
    enabled: !!subContractId,
  });
}

export function useSubContractBills(subContractId: string | null) {
  return useQuery({
    queryKey: ['sub-contract-bills', subContractId],
    queryFn: async () => {
      if (!subContractId) return [];
      const { data, error } = await supabase
        .from('sub_contract_bills')
        .select('*')
        .eq('sub_contract_id', subContractId)
        .order('bill_date', { ascending: false });
      
      if (error) throw error;
      return data as SubContractBill[];
    },
    enabled: !!subContractId,
  });
}

export function useCreateSubContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { subject: string } & Partial<Omit<SubContract, 'subject'>>) => {
      const { data: result, error } = await supabase
        .from('sub_contracts')
        .insert([{ subject: data.subject, ...data }])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-contracts'] });
      toast.success('Sub-contract created');
    },
    onError: (error) => {
      toast.error('Failed to create sub-contract');
      console.error(error);
    },
  });
}

export function useUpdateSubContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SubContract> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('sub_contracts')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sub-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['sub-contract', variables.id] });
    },
    onError: (error) => {
      toast.error('Failed to update sub-contract');
      console.error(error);
    },
  });
}

export function useDeleteSubContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sub_contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-contracts'] });
      toast.success('Sub-contract deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete sub-contract');
      console.error(error);
    },
  });
}

export function useUpdateSubContractTerms() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subContractId, ...data }: Partial<SubContractTerms> & { subContractId: string }) => {
      // Check if terms exist
      const { data: existing } = await supabase
        .from('sub_contract_terms')
        .select('id')
        .eq('sub_contract_id', subContractId)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('sub_contract_terms')
          .update(data)
          .eq('sub_contract_id', subContractId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sub_contract_terms')
          .insert([{ sub_contract_id: subContractId, ...data }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sub-contract-terms', variables.subContractId] });
    },
  });
}

export function useCreateSubContractNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { sub_contract_id: string; content: string }) => {
      const { error } = await supabase
        .from('sub_contract_notes')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sub-contract-notes', variables.sub_contract_id] });
      toast.success('Note added');
    },
  });
}

export function useDeleteSubContractNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, subContractId }: { id: string; subContractId: string }) => {
      const { error } = await supabase
        .from('sub_contract_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return subContractId;
    },
    onSuccess: (subContractId) => {
      queryClient.invalidateQueries({ queryKey: ['sub-contract-notes', subContractId] });
      toast.success('Note deleted');
    },
  });
}
