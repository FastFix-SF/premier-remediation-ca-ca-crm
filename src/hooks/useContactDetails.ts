import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ContactUpdate {
  id: string;
  rating?: number;
  is_favorite?: boolean;
  metadata?: Json;
  // Basic contact fields
  first_name?: string;
  last_name?: string;
  contact_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  cell?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export const useContactDetails = (contactId?: string) => {
  const queryClient = useQueryClient();

  const updateContact = useMutation({
    mutationFn: async (data: ContactUpdate) => {
      const { id, ...rest } = data;
      const updateData: Record<string, unknown> = {};
      
      // Only include defined fields
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      if (Object.keys(updateData).length === 0) return;

      const { error } = await supabase
        .from('directory_contacts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory-contacts'] });
      toast.success('Contact updated');
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    },
  });

  // Notes queries
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
  });

  const createNote = useMutation({
    mutationFn: async (data: { contact_id: string; title: string; description: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: data.contact_id,
          title: data.title,
          description: data.description,
          created_by: user?.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] });
      toast.success('Note added');
    },
    onError: (error) => {
      console.error('Error creating note:', error);
      toast.error('Failed to add note');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] });
      toast.success('Note deleted');
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    },
  });

  // Files queries
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['contact-files', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('contact_files')
        .select('*')
        .eq('contact_id', contactId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
  });

  const uploadFile = useMutation({
    mutationFn: async (data: { contact_id: string; file: File }) => {
      const { data: user } = await supabase.auth.getUser();
      const fileName = `${data.contact_id}/${Date.now()}-${data.file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      // Save file record
      const { error: dbError } = await supabase
        .from('contact_files')
        .insert({
          contact_id: data.contact_id,
          file_url: urlData.publicUrl,
          file_name: data.file.name,
          file_type: data.file.type,
          file_size: data.file.size,
          uploaded_by: user?.user?.id,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-files', contactId] });
      toast.success('File uploaded');
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from('contact_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-files', contactId] });
      toast.success('File deleted');
    },
    onError: (error) => {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    },
  });

  return {
    updateContact,
    notes,
    notesLoading,
    createNote,
    deleteNote,
    files,
    filesLoading,
    uploadFile,
    deleteFile,
  };
};
