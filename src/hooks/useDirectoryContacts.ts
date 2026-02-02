import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryContact {
  id: string;
  contact_type: 'vendor' | 'contractor' | 'customer' | 'lead' | 'miscellaneous';
  company: string | null;
  contact_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  cell: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  is_favorite: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useDirectoryContacts(contactType?: string) {
  return useQuery({
    queryKey: ['directory-contacts', contactType],
    queryFn: async () => {
      let query = supabase
        .from('directory_contacts')
        .select('*')
        .eq('is_active', true)
        .order('company', { ascending: true });

      if (contactType) {
        query = query.eq('contact_type', contactType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DirectoryContact[];
    },
  });
}

export function useVendors() {
  return useDirectoryContacts('vendor');
}

export function useContractors() {
  return useDirectoryContacts('contractor');
}

export function useCustomers() {
  return useDirectoryContacts('customer');
}

export function useEmployees() {
  return useDirectoryContacts('employee');
}
