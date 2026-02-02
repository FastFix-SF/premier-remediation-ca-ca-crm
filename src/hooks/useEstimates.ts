import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Estimate {
  id: string;
  estimate_number: string;
  title: string | null;
  customer_id: string | null;
  project_id: string | null;
  estimate_date: string;
  expiration_date: string | null;
  project_type: string | null;
  sector: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  project_manager_id: string | null;
  estimator_id: string | null;
  sales_rep_id: string | null;
  invoiced_to: string | null;
  approved_by_id: string | null;
  subtotal: number | null;
  profit_margin_pct: number | null;
  profit_margin_amount: number | null;
  tax_pct: number | null;
  tax_amount: number | null;
  grand_total: number | null;
  terms_content: string | null;
  inclusions_content: string | null;
  exclusions_content: string | null;
  scope_summary: string | null;
  cover_sheet_content: string | null;
  cover_sheet_template_id: string | null;
  include_cover_sheet: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  cost_code: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number | null;
  markup_pct: number | null;
  total: number | null;
  tax_applicable: boolean | null;
  assigned_to_id: string | null;
  display_order: number | null;
  created_at: string;
}

export interface EstimateScopeItem {
  id: string;
  estimate_id: string;
  category: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  is_included: boolean | null;
  display_order: number | null;
  created_at: string;
}

export interface EstimateBidPackage {
  id: string;
  estimate_id: string;
  package_name: string;
  description: string | null;
  created_at: string;
}

export interface EstimateFile {
  id: string;
  estimate_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface EstimateNote {
  id: string;
  estimate_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface CoverSheetTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean | null;
  created_at: string;
}

export const ESTIMATE_STATUSES = [
  { value: 'bidding', label: 'Bidding', color: 'bg-blue-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'revisado', label: 'Revisado', color: 'bg-purple-500' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'bg-orange-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'government', label: 'Government' },
];

export const SECTORS = [
  { value: 'new_construction', label: 'New Construction' },
  { value: 're_roof', label: 'Re-Roof' },
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'coating', label: 'Coating' },
];

export const ITEM_TYPES = [
  { value: 'material', label: 'Material', color: 'bg-blue-500' },
  { value: 'labor', label: 'Labor', color: 'bg-green-500' },
  { value: 'equipment', label: 'Equipment', color: 'bg-yellow-500' },
  { value: 'subcontractor', label: 'Subcontractor', color: 'bg-purple-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

export function useEstimates() {
  return useQuery({
    queryKey: ['estimates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_estimates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Estimate[];
    },
  });
}

export function useEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('project_estimates')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Estimate;
    },
    enabled: !!id,
  });
}

export function useEstimateItems(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate-items', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EstimateItem[];
    },
    enabled: !!estimateId,
  });
}

export function useEstimateScopeItems(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate-scope-items', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_scope_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as EstimateScopeItem[];
    },
    enabled: !!estimateId,
  });
}

export function useEstimateBidPackages(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate-bid-packages', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_bid_packages')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EstimateBidPackage[];
    },
    enabled: !!estimateId,
  });
}

export function useEstimateFiles(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate-files', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_files')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as EstimateFile[];
    },
    enabled: !!estimateId,
  });
}

export function useEstimateNotes(estimateId: string | undefined) {
  return useQuery({
    queryKey: ['estimate-notes', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_notes')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EstimateNote[];
    },
    enabled: !!estimateId,
  });
}

export function useCoverSheetTemplates() {
  return useQuery({
    queryKey: ['cover-sheet-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimate_cover_sheet_templates')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CoverSheetTemplate[];
    },
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Estimate>) => {
      const { data: result, error } = await supabase
        .from('project_estimates')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create estimate: ' + error.message);
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Estimate> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('project_estimates')
        .update(data as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
      toast.success('Estimate updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update estimate: ' + error.message);
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_estimates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete estimate: ' + error.message);
    },
  });
}

export function useCreateEstimateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EstimateItem>) => {
      const { data: result, error } = await supabase
        .from('estimate_items')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', variables.estimate_id] });
      toast.success('Item added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add item: ' + error.message);
    },
  });
}

export function useDeleteEstimateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from('estimate_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimateId] });
      toast.success('Item deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete item: ' + error.message);
    },
  });
}

export function useCreateEstimateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EstimateNote>) => {
      const { data: result, error } = await supabase
        .from('estimate_notes')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-notes', variables.estimate_id] });
      toast.success('Note added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });
}

export function useDeleteEstimateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from('estimate_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-notes', estimateId] });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete note: ' + error.message);
    },
  });
}

export function useCreateEstimateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EstimateFile>) => {
      const { data: result, error } = await supabase
        .from('estimate_files')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-files', variables.estimate_id] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + error.message);
    },
  });
}

export function useDeleteEstimateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from('estimate_files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-files', estimateId] });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete file: ' + error.message);
    },
  });
}

export function useCreateBidPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EstimateBidPackage>) => {
      const { data: result, error } = await supabase
        .from('estimate_bid_packages')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-bid-packages', variables.estimate_id] });
      toast.success('Bid package created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create bid package: ' + error.message);
    },
  });
}

export function useDeleteBidPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from('estimate_bid_packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-bid-packages', estimateId] });
      toast.success('Bid package deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete bid package: ' + error.message);
    },
  });
}

export function useCreateScopeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EstimateScopeItem>) => {
      const { data: result, error } = await supabase
        .from('estimate_scope_items')
        .insert(data as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-scope-items', variables.estimate_id] });
      toast.success('Scope item added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add scope item: ' + error.message);
    },
  });
}

export function useUpdateScopeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId, ...data }: Partial<EstimateScopeItem> & { id: string; estimateId: string }) => {
      const { data: result, error } = await supabase
        .from('estimate_scope_items')
        .update(data as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return { result, estimateId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-scope-items', data.estimateId] });
    },
    onError: (error) => {
      toast.error('Failed to update scope item: ' + error.message);
    },
  });
}

export function useDeleteScopeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from('estimate_scope_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-scope-items', estimateId] });
      toast.success('Scope item deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete scope item: ' + error.message);
    },
  });
}
