import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Inspection {
  id: string;
  inspection_number: number;
  project_id: string | null;
  status: 'pass' | 'fail' | 're-inspect' | 'draft';
  inspection_type: string | null;
  agency: string | null;
  inspected_by: string | null;
  assigned_to: string | null;
  inspection_date: string | null;
  corrections_needed: string | null;
  permit_number: string | null;
  permit_expiry_date: string | null;
  permit_type: string | null;
  share_with_client: boolean;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  projects?: { address: string } | null;
}

export interface InspectionChecklistItem {
  id: string;
  inspection_id: string;
  item_name: string;
  is_completed: boolean;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface InspectionFile {
  id: string;
  inspection_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface InspectionNote {
  id: string;
  inspection_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
}

// Using any cast to bypass type checking until Supabase types regenerate
const db = supabase as any;

export function useInspections() {
  return useQuery({
    queryKey: ["inspections"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inspections")
        .select("*, projects(address)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Inspection[];
    },
  });
}

export function useInspection(id: string | undefined) {
  return useQuery({
    queryKey: ["inspection", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from("inspections")
        .select("*, projects(address)")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Inspection;
    },
    enabled: !!id,
  });
}

export function useInspectionChecklistItems(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ["inspection-checklist", inspectionId],
    queryFn: async () => {
      if (!inspectionId) return [];
      const { data, error } = await db
        .from("inspection_checklist_items")
        .select("*")
        .eq("inspection_id", inspectionId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as InspectionChecklistItem[];
    },
    enabled: !!inspectionId,
  });
}

export function useInspectionFiles(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ["inspection-files", inspectionId],
    queryFn: async () => {
      if (!inspectionId) return [];
      const { data, error } = await db
        .from("inspection_files")
        .select("*")
        .eq("inspection_id", inspectionId)
        .order("uploaded_at", { ascending: false });
      
      if (error) throw error;
      return data as InspectionFile[];
    },
    enabled: !!inspectionId,
  });
}

export function useInspectionNotes(inspectionId: string | undefined) {
  return useQuery({
    queryKey: ["inspection-notes", inspectionId],
    queryFn: async () => {
      if (!inspectionId) return [];
      const { data, error } = await db
        .from("inspection_notes")
        .select("*")
        .eq("inspection_id", inspectionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as InspectionNote[];
    },
    enabled: !!inspectionId,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Inspection>) => {
      const insertData = {
        project_id: data.project_id || null,
        status: data.status || 'draft',
        inspection_type: data.inspection_type || null,
        agency: data.agency || null,
        inspected_by: data.inspected_by || null,
        assigned_to: data.assigned_to || null,
        inspection_date: data.inspection_date || null,
        corrections_needed: data.corrections_needed || null,
        permit_number: data.permit_number || null,
        permit_expiry_date: data.permit_expiry_date || null,
        permit_type: data.permit_type || null,
        share_with_client: data.share_with_client || false,
        custom_fields: data.custom_fields || {},
        created_by: data.created_by || null,
      };
      
      const { data: result, error } = await db
        .from("inspections")
        .insert(insertData)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, Partial<Inspection> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await db
        .from("inspections")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection", variables.id] });
    },
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { inspection_id: string; item_name: string }>({
    mutationFn: async (data) => {
      const { data: result, error } = await db
        .from("inspection_checklist_items")
        .insert(data)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklist", variables.inspection_id] });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, Partial<InspectionChecklistItem> & { id: string; inspection_id: string }>({
    mutationFn: async ({ id, inspection_id, ...data }) => {
      const { data: result, error } = await db
        .from("inspection_checklist_items")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklist", variables.inspection_id] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { id: string; inspection_id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await db
        .from("inspection_checklist_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspection-checklist", variables.inspection_id] });
    },
  });
}

export function useCreateInspectionNote() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { inspection_id: string; title?: string; content: string }>({
    mutationFn: async (data) => {
      const { data: result, error } = await db
        .from("inspection_notes")
        .insert(data)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspection-notes", variables.inspection_id] });
    },
  });
}

export function useDeleteInspectionNote() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { id: string; inspection_id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await db
        .from("inspection_notes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspection-notes", variables.inspection_id] });
    },
  });
}
