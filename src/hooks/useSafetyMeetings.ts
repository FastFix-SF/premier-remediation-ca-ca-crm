import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SafetyMeeting {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  topic: string;
  topic_text: string | null;
  location: string | null;
  meeting_type: string;
  meeting_leader_id: string | null;
  meeting_leader_name: string | null;
  project_id: string | null;
  cost_code: string | null;
  status: string;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafetyMeetingAttendee {
  id: string;
  meeting_id: string;
  employee_id: string | null;
  employee_name: string;
  employee_initials: string | null;
  signature_url: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface SafetyMeetingFile {
  id: string;
  meeting_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface SafetyMeetingNote {
  id: string;
  meeting_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
}

export function useSafetyMeetings() {
  return useQuery({
    queryKey: ['safety-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_meetings')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      return data as SafetyMeeting[];
    },
  });
}

export function useSafetyMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ['safety-meetings', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('safety_meetings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as SafetyMeeting;
    },
    enabled: !!id,
  });
}

export function useSafetyMeetingAttendees(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['safety-meeting-attendees', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      const { data, error } = await supabase
        .from('safety_meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('employee_name', { ascending: true });
      if (error) throw error;
      return data as SafetyMeetingAttendee[];
    },
    enabled: !!meetingId,
  });
}

export function useSafetyMeetingFiles(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['safety-meeting-files', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      const { data, error } = await supabase
        .from('safety_meeting_files')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as SafetyMeetingFile[];
    },
    enabled: !!meetingId,
  });
}

export function useSafetyMeetingNotes(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['safety-meeting-notes', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      const { data, error } = await supabase
        .from('safety_meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SafetyMeetingNote[];
    },
    enabled: !!meetingId,
  });
}

export function useCreateSafetyMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meeting: { topic: string; meeting_date: string; status?: string; meeting_time?: string; location?: string; meeting_type?: string; meeting_leader_name?: string; topic_text?: string; cost_code?: string }) => {
      const { data, error } = await supabase
        .from('safety_meetings')
        .insert(meeting)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-meetings'] });
    },
  });
}

export function useUpdateSafetyMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SafetyMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from('safety_meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['safety-meetings', variables.id] });
    },
  });
}

export function useDeleteSafetyMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('safety_meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-meetings'] });
    },
  });
}

export function useCreateSafetyMeetingAttendee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendee: { meeting_id: string; employee_name: string; employee_initials?: string; employee_id?: string }) => {
      const { data, error } = await supabase
        .from('safety_meeting_attendees')
        .insert(attendee)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-meeting-attendees', variables.meeting_id] });
    },
  });
}

export function useDeleteSafetyMeetingAttendee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, meetingId }: { id: string; meetingId: string }) => {
      const { error } = await supabase.from('safety_meeting_attendees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-meeting-attendees', variables.meetingId] });
    },
  });
}

export function useCreateSafetyMeetingNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: { meeting_id: string; title?: string | null; content: string }) => {
      const { data, error } = await supabase
        .from('safety_meeting_notes')
        .insert(note)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-meeting-notes', variables.meeting_id] });
    },
  });
}

export function useDeleteSafetyMeetingNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, meetingId }: { id: string; meetingId: string }) => {
      const { error } = await supabase.from('safety_meeting_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-meeting-notes', variables.meetingId] });
    },
  });
}
