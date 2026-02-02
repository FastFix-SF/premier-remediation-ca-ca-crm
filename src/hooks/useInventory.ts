import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InventoryCategory = string;

// Unit types commonly used in roofing and construction
export type InventoryUnitType = 
  | 'unit'      // Individual pieces (screws, caps, etc.)
  | 'box'       // Box of nails, screws, etc.
  | 'bag'       // Bag of cement, mortar, etc.
  | 'roll'      // Roll of underlayment, flashing, etc.
  | 'bundle'    // Bundle of shingles
  | 'pallet'    // Pallet of materials
  | 'gallon'    // Gallon of sealant, coating, etc.
  | 'bucket'    // 5-gallon bucket
  | 'tube'      // Caulk tubes, sealant tubes
  | 'piece'     // Individual pieces
  | 'square'    // Roofing squares (100 sq ft)
  | 'linear_foot' // Linear foot of trim, flashing, etc.
  | 'sheet'     // Sheet of plywood, metal panels
  | 'case'      // Case of caulk, etc.
  | 'pack'      // Pack of materials
  | 'spool'     // Spool of wire, tape
  | 'pair'      // Pair of gloves, etc.
  | 'set';      // Set of tools, etc.

export const UNIT_TYPE_OPTIONS: { value: InventoryUnitType; label: string; labelEs: string }[] = [
  { value: 'unit', label: 'Unit', labelEs: 'Unidad' },
  { value: 'box', label: 'Box', labelEs: 'Caja' },
  { value: 'bag', label: 'Bag', labelEs: 'Bolsa' },
  { value: 'roll', label: 'Roll', labelEs: 'Rollo' },
  { value: 'bundle', label: 'Bundle', labelEs: 'Paquete/Bulto' },
  { value: 'pallet', label: 'Pallet', labelEs: 'Tarima' },
  { value: 'gallon', label: 'Gallon', labelEs: 'Galón' },
  { value: 'bucket', label: 'Bucket (5 gal)', labelEs: 'Cubeta (5 gal)' },
  { value: 'tube', label: 'Tube', labelEs: 'Tubo' },
  { value: 'piece', label: 'Piece', labelEs: 'Pieza' },
  { value: 'square', label: 'Square (100 sq ft)', labelEs: 'Cuadro (100 pies²)' },
  { value: 'linear_foot', label: 'Linear Foot', labelEs: 'Pie Lineal' },
  { value: 'sheet', label: 'Sheet', labelEs: 'Lámina' },
  { value: 'case', label: 'Case', labelEs: 'Caja (case)' },
  { value: 'pack', label: 'Pack', labelEs: 'Paquete' },
  { value: 'spool', label: 'Spool', labelEs: 'Carrete' },
  { value: 'pair', label: 'Pair', labelEs: 'Par' },
  { value: 'set', label: 'Set', labelEs: 'Juego' },
];

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  photo_url: string | null;
  category: InventoryCategory;
  unit_type: InventoryUnitType;
  requires_protection: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategoryItem {
  id: string;
  key: string;
  label: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface InventoryLog {
  id: string;
  item_id: string;
  previous_quantity: number;
  new_quantity: number;
  changed_by: string | null;
  changed_at: string;
  note: string | null;
}

export const useInventoryItems = (category?: InventoryCategory) => {
  return useQuery({
    queryKey: ['inventory-items', category],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      newQuantity, 
      previousQuantity,
      note 
    }: { 
      itemId: string; 
      newQuantity: number; 
      previousQuantity: number;
      note?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update the item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          quantity: newQuantity,
          updated_by: user?.id 
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Log the change
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          item_id: itemId,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          changed_by: user?.id,
          note
        });

      if (logError) console.error('Failed to log inventory change:', logError);

      return { itemId, newQuantity };
    },
    onMutate: async ({ itemId, newQuantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory-items'] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<InventoryItem[]>(['inventory-items']);

      // Optimistically update
      queryClient.setQueriesData<InventoryItem[]>(
        { queryKey: ['inventory-items'] },
        (old) => old?.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      return { previousItems };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['inventory-items'], context.previousItems);
      }
      toast.error('Failed to update quantity');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      name: string;
      quantity: number;
      category: InventoryCategory;
      unit_type?: InventoryUnitType;
      requires_protection: boolean;
      photo_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...item,
          created_by: user?.id,
          updated_by: user?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item added successfully');
    },
    onError: () => {
      toast.error('Failed to add item');
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: { 
      itemId: string; 
      updates: Partial<Pick<InventoryItem, 'name' | 'category' | 'unit_type' | 'requires_protection' | 'photo_url' | 'notes'>>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ 
          ...updates,
          updated_by: user?.id 
        })
        .eq('id', itemId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Artículo actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar');
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Artículo eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar');
    },
  });
};

// Categories hooks
export const useInventoryCategories = () => {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as InventoryCategoryItem[];
    },
  });
};

export const useAddInventoryCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: {
      key: string;
      label: string;
      color?: string;
    }) => {
      // Get max display_order
      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

      const { data, error } = await supabase
        .from('inventory_categories')
        .insert({
          key: category.key.toLowerCase().replace(/\s+/g, '_'),
          label: category.label,
          color: category.color || '#6b7280',
          display_order: nextOrder,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success('Categoría agregada');
    },
    onError: () => {
      toast.error('Error al agregar categoría');
    },
  });
};

export const useDeleteInventoryCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success('Categoría eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar categoría');
    },
  });
};

export const uploadInventoryPhoto = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('inventory-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('inventory-photos')
    .getPublicUrl(filePath);

  return publicUrl;
};
