import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BidPackage {
  id: string;
  estimate_id: string | null;
  bid_number: string | null;
  title: string;
  bidding_deadline: string | null;
  deadline_time: string | null;
  status: string;
  bid_manager_id: string | null;
  reminder_days: number;
  scope_of_work: string | null;
  terms: string | null;
  inclusions: string | null;
  exclusions: string | null;
  clarification: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_estimates?: {
    estimate_number: string | null;
    customer_name: string | null;
  } | null;
}

export interface BidPackageItem {
  id: string;
  bid_package_id: string;
  item_type: string;
  item_name: string;
  description: string | null;
  cost_code: string | null;
  quantity: number | null;
  unit: string | null;
  display_order: number;
  created_at: string;
}

export interface BidPackageFile {
  id: string;
  bid_package_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface BidPackageBidder {
  id: string;
  bid_package_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  invited_at: string | null;
  date_sent: string | null;
  will_submit: boolean;
  submitted_at: string | null;
  status: string;
  bid_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BidSubmission {
  id: string;
  bidder_id: string;
  bid_package_id: string;
  submitted_at: string;
  bid_total: number | null;
  notes: string | null;
  is_awarded: boolean;
  awarded_at: string | null;
  created_at: string;
}

export interface BidStats {
  totalPackages: number;
  draftCount: number;
  submittedCount: number;
  awardedCount: number;
  closedCount: number;
  totalBidders: number;
  pendingBidders: number;
  submittedBidders: number;
}

// Fetch all bid packages
export const useBidPackages = () => {
  return useQuery({
    queryKey: ['bid-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bid_packages')
        .select(`
          *,
          project_estimates (
            estimate_number,
            customer_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BidPackage[];
    },
  });
};

// Fetch single bid package
export const useBidPackage = (id: string | undefined) => {
  return useQuery({
    queryKey: ['bid-package', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('bid_packages')
        .select(`
          *,
          project_estimates (
            estimate_number,
            customer_name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as BidPackage;
    },
    enabled: !!id,
  });
};

// Fetch bid package items
export const useBidPackageItems = (bidPackageId: string | undefined) => {
  return useQuery({
    queryKey: ['bid-package-items', bidPackageId],
    queryFn: async () => {
      if (!bidPackageId) return [];
      const { data, error } = await supabase
        .from('bid_package_items')
        .select('*')
        .eq('bid_package_id', bidPackageId)
        .order('display_order');

      if (error) throw error;
      return data as BidPackageItem[];
    },
    enabled: !!bidPackageId,
  });
};

// Fetch bid package files
export const useBidPackageFiles = (bidPackageId: string | undefined) => {
  return useQuery({
    queryKey: ['bid-package-files', bidPackageId],
    queryFn: async () => {
      if (!bidPackageId) return [];
      const { data, error } = await supabase
        .from('bid_package_files')
        .select('*')
        .eq('bid_package_id', bidPackageId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as BidPackageFile[];
    },
    enabled: !!bidPackageId,
  });
};

// Fetch bid package bidders
export const useBidPackageBidders = (bidPackageId: string | undefined) => {
  return useQuery({
    queryKey: ['bid-package-bidders', bidPackageId],
    queryFn: async () => {
      if (!bidPackageId) return [];
      const { data, error } = await supabase
        .from('bid_package_bidders')
        .select('*')
        .eq('bid_package_id', bidPackageId)
        .order('created_at');

      if (error) throw error;
      return data as BidPackageBidder[];
    },
    enabled: !!bidPackageId,
  });
};

// Fetch bid submissions
export const useBidSubmissions = (bidPackageId: string | undefined) => {
  return useQuery({
    queryKey: ['bid-submissions', bidPackageId],
    queryFn: async () => {
      if (!bidPackageId) return [];
      const { data, error } = await supabase
        .from('bid_submissions')
        .select('*')
        .eq('bid_package_id', bidPackageId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as BidSubmission[];
    },
    enabled: !!bidPackageId,
  });
};

// Fetch bid stats
export const useBidStats = () => {
  return useQuery({
    queryKey: ['bid-stats'],
    queryFn: async () => {
      const [packagesRes, biddersRes] = await Promise.all([
        supabase.from('bid_packages').select('status'),
        supabase.from('bid_package_bidders').select('status'),
      ]);

      if (packagesRes.error) throw packagesRes.error;
      if (biddersRes.error) throw biddersRes.error;

      const packages = packagesRes.data || [];
      const bidders = biddersRes.data || [];

      return {
        totalPackages: packages.length,
        draftCount: packages.filter(p => p.status === 'draft').length,
        submittedCount: packages.filter(p => p.status === 'submitted').length,
        awardedCount: packages.filter(p => p.status === 'awarded').length,
        closedCount: packages.filter(p => p.status === 'closed').length,
        totalBidders: bidders.length,
        pendingBidders: bidders.filter(b => b.status === 'pending' || b.status === 'invited').length,
        submittedBidders: bidders.filter(b => b.status === 'submitted').length,
      } as BidStats;
    },
  });
};

// Create bid package
export const useCreateBidPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BidPackage>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('bid_packages')
        .insert([{
          title: data.title || '',
          estimate_id: data.estimate_id || null,
          bidding_deadline: data.bidding_deadline || null,
          deadline_time: data.deadline_time || null,
          status: data.status || 'draft',
          bid_manager_id: data.bid_manager_id || null,
          reminder_days: data.reminder_days || 3,
          scope_of_work: data.scope_of_work || null,
          terms: data.terms || null,
          inclusions: data.inclusions || null,
          exclusions: data.exclusions || null,
          clarification: data.clarification || null,
          created_by: user.user?.id,
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bid package created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create bid package: ' + error.message);
    },
  });
};

// Update bid package
export const useUpdateBidPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BidPackage> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('bid_packages')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      queryClient.invalidateQueries({ queryKey: ['bid-package', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bid package updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update bid package: ' + error.message);
    },
  });
};

// Delete bid package
export const useDeleteBidPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bid_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bid package deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete bid package: ' + error.message);
    },
  });
};

// Add bid package item
export const useAddBidPackageItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BidPackageItem>) => {
      const { data: result, error } = await supabase
        .from('bid_package_items')
        .insert([{
          bid_package_id: data.bid_package_id!,
          item_name: data.item_name || '',
          item_type: data.item_type || 'material',
          description: data.description || null,
          cost_code: data.cost_code || null,
          quantity: data.quantity || null,
          unit: data.unit || null,
          display_order: data.display_order || 0,
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-items', variables.bid_package_id] });
      toast.success('Item added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add item: ' + error.message);
    },
  });
};

// Update bid package item
export const useUpdateBidPackageItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bid_package_id, ...data }: Partial<BidPackageItem> & { id: string; bid_package_id: string }) => {
      const { data: result, error } = await supabase
        .from('bid_package_items')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { ...result, bid_package_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-items', result.bid_package_id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update item: ' + error.message);
    },
  });
};

// Delete bid package item
export const useDeleteBidPackageItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bid_package_id }: { id: string; bid_package_id: string }) => {
      const { error } = await supabase
        .from('bid_package_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { bid_package_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-items', result.bid_package_id] });
      toast.success('Item deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete item: ' + error.message);
    },
  });
};

// Add bidder
export const useAddBidder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BidPackageBidder>) => {
      const { data: result, error } = await supabase
        .from('bid_package_bidders')
        .insert([{
          bid_package_id: data.bid_package_id!,
          company_name: data.company_name || '',
          contact_name: data.contact_name || null,
          email: data.email || null,
          phone: data.phone || null,
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-bidders', variables.bid_package_id] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bidder added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add bidder: ' + error.message);
    },
  });
};

// Update bidder
export const useUpdateBidder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bid_package_id, ...data }: Partial<BidPackageBidder> & { id: string; bid_package_id: string }) => {
      const { data: result, error } = await supabase
        .from('bid_package_bidders')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { ...result, bid_package_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-bidders', result.bid_package_id] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update bidder: ' + error.message);
    },
  });
};

// Delete bidder
export const useDeleteBidder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bid_package_id }: { id: string; bid_package_id: string }) => {
      const { error } = await supabase
        .from('bid_package_bidders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { bid_package_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bid-package-bidders', result.bid_package_id] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bidder removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove bidder: ' + error.message);
    },
  });
};

// Award bid
export const useAwardBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidderId, bidPackageId }: { bidderId: string; bidPackageId: string }) => {
      // Update the bidder status to awarded
      const { error: bidderError } = await supabase
        .from('bid_package_bidders')
        .update({ status: 'awarded' })
        .eq('id', bidderId);

      if (bidderError) throw bidderError;

      // Update bid package status to awarded
      const { error: packageError } = await supabase
        .from('bid_packages')
        .update({ status: 'awarded' })
        .eq('id', bidPackageId);

      if (packageError) throw packageError;

      // Create submission record
      const { error: submissionError } = await supabase
        .from('bid_submissions')
        .insert({
          bidder_id: bidderId,
          bid_package_id: bidPackageId,
          is_awarded: true,
          awarded_at: new Date().toISOString(),
        });

      if (submissionError) throw submissionError;

      return { bidPackageId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bid-packages'] });
      queryClient.invalidateQueries({ queryKey: ['bid-package', result.bidPackageId] });
      queryClient.invalidateQueries({ queryKey: ['bid-package-bidders', result.bidPackageId] });
      queryClient.invalidateQueries({ queryKey: ['bid-submissions', result.bidPackageId] });
      queryClient.invalidateQueries({ queryKey: ['bid-stats'] });
      toast.success('Bid awarded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to award bid: ' + error.message);
    },
  });
};
