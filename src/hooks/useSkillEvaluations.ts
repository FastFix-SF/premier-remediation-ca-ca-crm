import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SkillLevel {
  id: string;
  level: number;
  name: string;
  short_name: string;
  description: string;
  color: string;
  can_work_alone: boolean;
  can_lead_crew: boolean;
  competencies: Competency[];
}

export interface Competency {
  id: string;
  category: string;
  text: string;
}

export interface SkillEvaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  assigned_level: number;
  competency_scores: Record<string, boolean>;
  evaluation_notes: string | null;
  evaluated_at: string;
  is_current: boolean;
  created_at: string;
}

export interface EmployeeWithEvaluation {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  current_level?: number;
  level_name?: string;
  level_color?: string;
  last_evaluated_at?: string;
  evaluator_name?: string;
}

export function useSkillLevels() {
  return useQuery({
    queryKey: ['skill-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_levels')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(level => ({
        ...level,
        competencies: (level.competencies as unknown as Competency[]) || []
      })) as SkillLevel[];
    }
  });
}

export function useSkillEvaluations(employeeId?: string) {
  return useQuery({
    queryKey: ['skill-evaluations', employeeId],
    queryFn: async () => {
      let query = supabase
        .from('skill_level_evaluations')
        .select('*')
        .order('evaluated_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as SkillEvaluation[];
    }
  });
}

export function useCurrentEvaluation(employeeId: string) {
  return useQuery({
    queryKey: ['skill-evaluation-current', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_level_evaluations')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_current', true)
        .maybeSingle();

      if (error) throw error;
      return data as SkillEvaluation | null;
    },
    enabled: !!employeeId
  });
}

export function useEmployeesWithEvaluations() {
  const { data: skillLevels } = useSkillLevels();
  
  return useQuery({
    queryKey: ['employees-with-evaluations'],
    queryFn: async () => {
      // Get all active team members who are contributors
      const { data: employees, error: empError } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email, role, avatar_url')
        .eq('status', 'active')
        .eq('role', 'contributor')
        .order('full_name', { ascending: true });

      if (empError) throw empError;

      // Get current evaluations
      const { data: evaluations, error: evalError } = await supabase
        .from('skill_level_evaluations')
        .select('*')
        .eq('is_current', true);

      if (evalError) throw evalError;

      // Get evaluator names
      const evaluatorIds = [...new Set((evaluations || []).map(e => e.evaluator_id))];
      const { data: evaluators } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .in('user_id', evaluatorIds);

      const evaluatorMap = new Map((evaluators || []).map(e => [e.user_id, e.full_name]));
      const levelMap = new Map((skillLevels || []).map(l => [l.level, l]));

      // Combine data
      return (employees || []).map(emp => {
        const evaluation = (evaluations || []).find(e => e.employee_id === emp.user_id);
        const level = evaluation ? levelMap.get(evaluation.assigned_level) : null;

        return {
          user_id: emp.user_id,
          full_name: emp.full_name || 'Desconocido',
          email: emp.email,
          role: emp.role,
          avatar_url: emp.avatar_url,
          current_level: evaluation?.assigned_level,
          level_name: level?.short_name,
          level_color: level?.color,
          last_evaluated_at: evaluation?.evaluated_at,
          evaluator_name: evaluation ? evaluatorMap.get(evaluation.evaluator_id) : undefined
        } as EmployeeWithEvaluation;
      });
    },
    enabled: !!skillLevels
  });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      employeeId,
      level,
      competencyScores,
      notes
    }: {
      employeeId: string;
      level: number;
      competencyScores: Record<string, boolean>;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('skill_level_evaluations')
        .insert({
          employee_id: employeeId,
          evaluator_id: user.user.id,
          assigned_level: level,
          competency_scores: competencyScores,
          evaluation_notes: notes || null
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['skill-evaluation-current'] });
      queryClient.invalidateQueries({ queryKey: ['employees-with-evaluations'] });
      toast({
        title: 'Evaluación Guardada',
        description: 'La evaluación del nivel de habilidad ha sido registrada.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
