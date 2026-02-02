import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DailyLogEntry {
  id: string;
  project_id: string;
  log_date: string;
  arrival_time: string | null;
  departure_time: string | null;
  tasks_performed: string | null;
  weather_data: {
    condition?: string;
    temp_high?: number;
    temp_low?: number;
    notes?: string;
  };
  site_condition: 'good' | 'fair' | 'poor';
  site_condition_notes: string | null;
  has_weather_delay: boolean;
  has_schedule_delay: boolean;
  delay_notes: string | null;
  status: 'draft' | 'submitted' | 'approved';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    address?: string;
  };
}

export interface DailyLogPerson {
  id: string;
  daily_log_id: string;
  user_id: string | null;
  employee_name: string;
  hours_worked: number | null;
  cost_code: string | null;
  notes: string | null;
}

export interface DailyLogVisitor {
  id: string;
  daily_log_id: string;
  visitor_name: string;
  company: string | null;
  purpose: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
}

export interface DailyLogSubcontractor {
  id: string;
  daily_log_id: string;
  company_name: string;
  contact_name: string | null;
  workers_count: number;
  work_performed: string | null;
  notes: string | null;
}

export interface DailyLogMaterial {
  id: string;
  daily_log_id: string;
  material_type: 'delivered' | 'used';
  item_name: string;
  quantity: number | null;
  unit: string | null;
  delivered_by: string | null;
  supplier: string | null;
  description: string | null;
}

export interface DailyLogEquipment {
  id: string;
  daily_log_id: string;
  equipment_type: 'delivered' | 'used' | 'log';
  equipment_name: string;
  hours: number | null;
  operator: string | null;
  cost_code: string | null;
  status: string | null;
  description: string | null;
}

export interface DailyLogNote {
  id: string;
  daily_log_id: string;
  note_type: 'general' | 'project' | 'safety';
  title: string | null;
  content: string;
  posted_by: string | null;
  posted_at: string;
}

export interface DailyLogFile {
  id: string;
  daily_log_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  category: 'photo' | 'document';
  description: string | null;
  uploaded_by: string | null;
}

// Fetch all daily logs for a project
export function useDailyLogs(projectId?: string) {
  return useQuery({
    queryKey: ['daily-logs', projectId],
    queryFn: async () => {
      let query = supabase
        .from('daily_log_entries')
        .select(`
          *,
          project:projects(id, name, address)
        `)
        .order('log_date', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyLogEntry[];
    },
    enabled: true,
  });
}

// Fetch a single daily log with all related data
export function useDailyLogDetail(logId: string | null) {
  return useQuery({
    queryKey: ['daily-log-detail', logId],
    queryFn: async () => {
      if (!logId) return null;

      const [entryRes, peopleRes, visitorsRes, subsRes, materialsRes, equipmentRes, notesRes, filesRes] = await Promise.all([
        supabase
          .from('daily_log_entries')
          .select(`*, project:projects(id, name, address)`)
          .eq('id', logId)
          .maybeSingle(),
        supabase.from('daily_log_people').select('*').eq('daily_log_id', logId),
        supabase.from('daily_log_visitors').select('*').eq('daily_log_id', logId),
        supabase.from('daily_log_subcontractors').select('*').eq('daily_log_id', logId),
        supabase.from('daily_log_materials').select('*').eq('daily_log_id', logId),
        supabase.from('daily_log_equipment').select('*').eq('daily_log_id', logId),
        supabase.from('daily_log_notes').select('*').eq('daily_log_id', logId).order('posted_at', { ascending: false }),
        supabase.from('daily_log_files').select('*').eq('daily_log_id', logId),
      ]);

      if (entryRes.error) throw entryRes.error;

      return {
        entry: entryRes.data as DailyLogEntry,
        people: (peopleRes.data || []) as DailyLogPerson[],
        visitors: (visitorsRes.data || []) as DailyLogVisitor[],
        subcontractors: (subsRes.data || []) as DailyLogSubcontractor[],
        materials: (materialsRes.data || []) as DailyLogMaterial[],
        equipment: (equipmentRes.data || []) as DailyLogEquipment[],
        notes: (notesRes.data || []) as DailyLogNote[],
        files: (filesRes.data || []) as DailyLogFile[],
      };
    },
    enabled: !!logId,
  });
}

// Create a new daily log
export function useCreateDailyLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      log_date: string;
      arrival_time?: string;
      departure_time?: string;
      tasks_performed?: string;
      site_condition?: 'good' | 'fair' | 'poor';
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('daily_log_entries')
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      toast({ title: 'Daily log created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create daily log', description: error.message, variant: 'destructive' });
    },
  });
}

// Update a daily log
export function useUpdateDailyLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DailyLogEntry> & { id: string }) => {
      const { error } = await supabase
        .from('daily_log_entries')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.id] });
      toast({ title: 'Daily log updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update daily log', description: error.message, variant: 'destructive' });
    },
  });
}

// Delete a daily log
export function useDeleteDailyLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_log_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      toast({ title: 'Daily log deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete daily log', description: error.message, variant: 'destructive' });
    },
  });
}

// Add person to daily log
export function useAddDailyLogPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogPerson, 'id'>) => {
      const { error } = await supabase.from('daily_log_people').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add visitor to daily log
export function useAddDailyLogVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogVisitor, 'id'>) => {
      const { error } = await supabase.from('daily_log_visitors').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add subcontractor to daily log
export function useAddDailyLogSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogSubcontractor, 'id'>) => {
      const { error } = await supabase.from('daily_log_subcontractors').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add material to daily log
export function useAddDailyLogMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogMaterial, 'id'>) => {
      const { error } = await supabase.from('daily_log_materials').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add equipment to daily log
export function useAddDailyLogEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogEquipment, 'id'>) => {
      const { error } = await supabase.from('daily_log_equipment').insert(data);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add note to daily log
export function useAddDailyLogNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogNote, 'id' | 'posted_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('daily_log_notes').insert({
        ...data,
        posted_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Add file to daily log
export function useAddDailyLogFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DailyLogFile, 'id'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('daily_log_files').insert({
        ...data,
        uploaded_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', variables.daily_log_id] });
    },
  });
}

// Delete person from daily log
export function useDeleteDailyLogPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_people').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete visitor from daily log
export function useDeleteDailyLogVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_visitors').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete subcontractor from daily log
export function useDeleteDailyLogSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_subcontractors').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete material from daily log
export function useDeleteDailyLogMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_materials').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete equipment from daily log
export function useDeleteDailyLogEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_equipment').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete note from daily log
export function useDeleteDailyLogNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_notes').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}

// Delete file from daily log
export function useDeleteDailyLogFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dailyLogId }: { id: string; dailyLogId: string }) => {
      const { error } = await supabase.from('daily_log_files').delete().eq('id', id);
      if (error) throw error;
      return dailyLogId;
    },
    onSuccess: (dailyLogId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-log-detail', dailyLogId] });
    },
  });
}
