import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Permit {
  id: string;
  permit_number: string;
  project_id: string | null;
  project_name: string | null;
  project_address: string | null;
  permit_type: string;
  status: string;
  fee: number | null;
  agency_id: string | null;
  agency_name: string | null;
  pulled_date: string | null;
  approved_date: string | null;
  expires_date: string | null;
  must_pull_by_date: string | null;
  referenced_inspection_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermitFile {
  id: string;
  permit_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface PermitNote {
  id: string;
  permit_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePermits = () => {
  return useQuery({
    queryKey: ['permits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Permit[];
    },
  });
};

export const usePermit = (permitId: string | null) => {
  return useQuery({
    queryKey: ['permit', permitId],
    queryFn: async () => {
      if (!permitId) return null;
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('id', permitId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Permit;
    },
    enabled: !!permitId,
  });
};

export const useCreatePermit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (permit: Partial<Permit>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        ...permit,
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from('permits')
        .insert(insertData as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      toast.success('Permit created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create permit: ' + error.message);
    },
  });
};

export const useUpdatePermit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Permit> & { id: string }) => {
      const { data, error } = await supabase
        .from('permits')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit', data.id] });
      toast.success('Permit updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update permit: ' + error.message);
    },
  });
};

export const useDeletePermit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (permitId: string) => {
      const { error } = await supabase
        .from('permits')
        .delete()
        .eq('id', permitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      toast.success('Permit deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete permit: ' + error.message);
    },
  });
};

// Permit Files
export const usePermitFiles = (permitId: string | null) => {
  return useQuery({
    queryKey: ['permit-files', permitId],
    queryFn: async () => {
      if (!permitId) return [];
      const { data, error } = await supabase
        .from('permit_files')
        .select('*')
        .eq('permit_id', permitId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PermitFile[];
    },
    enabled: !!permitId,
  });
};

export const useCreatePermitFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: Partial<PermitFile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        ...file,
        uploaded_by: user?.id,
      };
      const { data, error } = await supabase
        .from('permit_files')
        .insert(insertData as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permit-files', data.permit_id] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + error.message);
    },
  });
};

export const useDeletePermitFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ fileId, permitId }: { fileId: string; permitId: string }) => {
      const { error } = await supabase
        .from('permit_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
      return { permitId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permit-files', data.permitId] });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete file: ' + error.message);
    },
  });
};

// Permit Notes
export const usePermitNotes = (permitId: string | null) => {
  return useQuery({
    queryKey: ['permit-notes', permitId],
    queryFn: async () => {
      if (!permitId) return [];
      const { data, error } = await supabase
        .from('permit_notes')
        .select('*')
        .eq('permit_id', permitId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PermitNote[];
    },
    enabled: !!permitId,
  });
};

export const useCreatePermitNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: Partial<PermitNote>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const insertData = {
        ...note,
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from('permit_notes')
        .insert(insertData as any)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permit-notes', data.permit_id] });
      toast.success('Note added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });
};

export const useDeletePermitNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ noteId, permitId }: { noteId: string; permitId: string }) => {
      const { error } = await supabase
        .from('permit_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      return { permitId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['permit-notes', data.permitId] });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete note: ' + error.message);
    },
  });
};
