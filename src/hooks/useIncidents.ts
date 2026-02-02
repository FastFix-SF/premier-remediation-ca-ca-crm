import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  incident_number: string | null;
  incident_date: string;
  incident_time: string | null;
  type: string;
  classification: string | null;
  severity: string | null;
  description: string | null;
  location: string | null;
  project_id: string | null;
  cost_code: string | null;
  involved_employee_ids: string[];
  witness_ids: string[];
  notified_ids: string[];
  notified_date: string | null;
  reported_by: string | null;
  action_taken: string | null;
  corrective_steps: string | null;
  has_injury: boolean;
  injury_description: string | null;
  accepted_treatment: boolean;
  treatment_description: string | null;
  transported_to_hospital: boolean;
  hospital_description: string | null;
  returned_to_work_same_day: boolean;
  return_description: string | null;
  is_osha_violation: boolean;
  osha_description: string | null;
  days_away_from_work: number;
  days_job_transfer: number;
  injury_type: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentFile {
  id: string;
  incident_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface IncidentNote {
  id: string;
  incident_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('incident_date', { ascending: false });
      if (error) throw error;
      return data as Incident[];
    },
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Incident;
    },
    enabled: !!id,
  });
}

export function useIncidentFiles(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-files', incidentId],
    queryFn: async () => {
      if (!incidentId) return [];
      const { data, error } = await supabase
        .from('incident_files')
        .select('*')
        .eq('incident_id', incidentId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as IncidentFile[];
    },
    enabled: !!incidentId,
  });
}

export function useIncidentNotes(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-notes', incidentId],
    queryFn: async () => {
      if (!incidentId) return [];
      const { data, error } = await supabase
        .from('incident_notes')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IncidentNote[];
    },
    enabled: !!incidentId,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incident: Partial<Incident>) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useCreateIncidentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: { incident_id: string; title?: string | null; content: string }) => {
      const { data, error } = await supabase
        .from('incident_notes')
        .insert(note)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident-notes', variables.incident_id] });
    },
  });
}

export function useDeleteIncidentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, incidentId }: { id: string; incidentId: string }) => {
      const { error } = await supabase.from('incident_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident-notes', variables.incidentId] });
    },
  });
}
