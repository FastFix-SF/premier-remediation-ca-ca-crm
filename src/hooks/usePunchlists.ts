import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Punchlist {
  id: string;
  punchlist_number: number;
  project_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'closed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  projects?: { address: string; project_type: string | null } | null;
  items_count?: number;
  complete_count?: number;
  incomplete_count?: number;
}

export interface PunchlistItem {
  id: string;
  punchlist_id: string | null;
  project_id: string;
  item_number: number;
  title: string;
  description: string | null;
  location: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  photo_url: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

// Using any cast to bypass type checking until Supabase types regenerate
const db = supabase as any;

export function usePunchlists() {
  return useQuery({
    queryKey: ["punchlists"],
    queryFn: async () => {
      const { data, error } = await db
        .from("punchlists")
        .select("*, projects(address, project_type)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Get item counts for each punchlist
      const punchlistsWithCounts = await Promise.all(
        (data as Punchlist[]).map(async (pl) => {
          const { data: items } = await db
            .from("project_punchlists")
            .select("id, status")
            .eq("punchlist_id", pl.id);
          
          const itemsList = items || [];
          return {
            ...pl,
            items_count: itemsList.length,
            complete_count: itemsList.filter((i: any) => i.status === 'completed').length,
            incomplete_count: itemsList.filter((i: any) => i.status !== 'completed').length,
          };
        })
      );
      
      return punchlistsWithCounts;
    },
  });
}

export function usePunchlistItems(punchlistId: string | undefined) {
  return useQuery({
    queryKey: ["punchlist-items", punchlistId],
    queryFn: async () => {
      if (!punchlistId) return [];
      const { data, error } = await db
        .from("project_punchlists")
        .select("*")
        .eq("punchlist_id", punchlistId)
        .order("item_number", { ascending: true });
      
      if (error) throw error;
      return data as PunchlistItem[];
    },
    enabled: !!punchlistId,
  });
}

export function useCreatePunchlist() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { project_id: string; title: string; description?: string }>({
    mutationFn: async (data) => {
      const { data: result, error } = await db
        .from("punchlists")
        .insert({
          project_id: data.project_id,
          title: data.title,
          description: data.description || null,
          status: 'open',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}

export function useUpdatePunchlist() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, Partial<Punchlist> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await db
        .from("punchlists")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}

export function useDeletePunchlist() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await db
        .from("punchlists")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}

export function useCreatePunchlistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { punchlist_id: string; project_id: string; title: string; description?: string; assigned_to?: string; priority?: string; location?: string; due_date?: string }>({
    mutationFn: async (data) => {
      // Get next item number
      const { data: existing } = await db
        .from("project_punchlists")
        .select("item_number")
        .eq("punchlist_id", data.punchlist_id)
        .order("item_number", { ascending: false })
        .limit(1);
      
      const nextNumber = existing && existing.length > 0 ? existing[0].item_number + 1 : 1;
      
      const { data: result, error } = await db
        .from("project_punchlists")
        .insert({
          punchlist_id: data.punchlist_id,
          project_id: data.project_id,
          item_number: nextNumber,
          title: data.title,
          description: data.description || null,
          assigned_to: data.assigned_to || null,
          priority: data.priority || 'medium',
          location: data.location || null,
          due_date: data.due_date || null,
          status: 'open',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["punchlist-items", variables.punchlist_id] });
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}

export function useUpdatePunchlistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, Partial<PunchlistItem> & { id: string; punchlist_id: string }>({
    mutationFn: async ({ id, punchlist_id, ...data }) => {
      const { data: result, error } = await db
        .from("project_punchlists")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["punchlist-items", variables.punchlist_id] });
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}

export function useDeletePunchlistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { id: string; punchlist_id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await db
        .from("project_punchlists")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["punchlist-items", variables.punchlist_id] });
      queryClient.invalidateQueries({ queryKey: ["punchlists"] });
    },
  });
}
