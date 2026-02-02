import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUpdateEdgeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      console.log('Updating subcategory:', { id, label });
      
      const { data, error } = await supabase
        .from('edge_categories')
        .update({ label })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log('Subcategory updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['edge-categories'] });
      toast.success(`Subcategory updated: ${data.label}`);
    },
    onError: (error: any) => {
      console.error('Error updating subcategory:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    },
  });
};

export const useCreateEdgeCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, label, color, parentKey }: { 
      key: string; 
      label: string; 
      color: string;
      parentKey?: string;
    }) => {
      console.log('Creating new subcategory:', { key, label, color, parentKey });
      
      const { data, error } = await supabase
        .from('edge_categories')
        .insert({
          key,
          label,
          color,
          group_name: parentKey, // Use parent's key to create subcategory within that group
          display_order: 999, // Put custom items at the end
          is_active: true
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Subcategory created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['edge-categories'] });
      toast.success(`Custom subcategory added: ${data.label}`);
    },
    onError: (error: any) => {
      console.error('Error creating subcategory:', error);
      toast.error(`Failed to create: ${error.message || 'Unknown error'}`);
    },
  });
};
