import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface EmployeeScore {
  id: string;
  user_id: string;
  experience_score: number;
  performance_score: number;
  reliability_score: number;
  skills_score: number;
  safety_score: number;
  total_score: number;
  score_breakdown: Record<string, any>;
  calculated_at: string;
}

export interface EmployeeWithScore {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  score: EmployeeScore | null;
  crew_name: string | null;
  skills_count: number;
  certifications_count: number;
}

export interface Crew {
  id: string;
  crew_name: string;
  crew_lead_id: string | null;
  specialty: string | null;
  description: string | null;
  is_active: boolean;
  member_count?: number;
  avg_score?: number;
}

export interface EmployeeSkill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: number;
  years_experience: number | null;
  verified_at: string | null;
  verified_by: string | null;
}

export interface EmployeeCertification {
  id: string;
  user_id: string;
  certification_name: string;
  certification_type: string;
  issued_date: string | null;
  expiry_date: string | null;
  issuing_body: string | null;
  document_url: string | null;
  is_active: boolean;
}

export const useEmployeeScores = () => {
  return useQuery({
    queryKey: ['employee-scores'],
    queryFn: async () => {
      // Fetch only contributors (scoring is for contributors only)
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role')
        .eq('status', 'active')
        .eq('role', 'contributor')
        .not('user_id', 'is', null);

      if (teamError) throw teamError;

      // Fetch scores
      const { data: scores, error: scoresError } = await supabase
        .from('employee_scores')
        .select('*');

      if (scoresError) throw scoresError;

      // Fetch profiles for avatars
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url');

      // Fetch crew memberships
      const { data: crewMemberships } = await supabase
        .from('crew_memberships')
        .select('user_id, crew_id, crews(crew_name)');

      // Fetch skills count per user
      const { data: skillsCounts } = await supabase
        .from('employee_skills')
        .select('user_id');

      // Fetch certifications count per user
      const { data: certsCounts } = await supabase
        .from('employee_certifications')
        .select('user_id')
        .eq('is_active', true);

      // Create maps
      const scoreMap = new Map(scores?.map(s => [s.user_id, s]) || []);
      const avatarMap = new Map(profiles?.map(p => [p.id, p.avatar_url]) || []);
      const crewMap = new Map(
        crewMemberships?.map(cm => [
          cm.user_id, 
          (cm.crews as any)?.crew_name || null
        ]) || []
      );

      // Count skills and certs per user
      const skillsCountMap = new Map<string, number>();
      skillsCounts?.forEach(s => {
        skillsCountMap.set(s.user_id, (skillsCountMap.get(s.user_id) || 0) + 1);
      });

      const certsCountMap = new Map<string, number>();
      certsCounts?.forEach(c => {
        certsCountMap.set(c.user_id, (certsCountMap.get(c.user_id) || 0) + 1);
      });

      // Merge data
      const employeesWithScores: EmployeeWithScore[] = teamMembers?.map(member => ({
        user_id: member.user_id,
        email: member.email,
        full_name: member.full_name,
        role: member.role,
        avatar_url: avatarMap.get(member.user_id) || null,
        score: scoreMap.get(member.user_id) as EmployeeScore | undefined || null,
        crew_name: crewMap.get(member.user_id) || null,
        skills_count: skillsCountMap.get(member.user_id) || 0,
        certifications_count: certsCountMap.get(member.user_id) || 0,
      })) || [];

      // Sort by total score (descending)
      return employeesWithScores.sort((a, b) => 
        (b.score?.total_score || 0) - (a.score?.total_score || 0)
      );
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCrews = () => {
  return useQuery({
    queryKey: ['crews'],
    queryFn: async () => {
      const { data: crews, error } = await supabase
        .from('crews')
        .select('*')
        .eq('is_active', true)
        .order('crew_name');

      if (error) throw error;

      // Get member counts and avg scores for each crew
      const { data: memberships } = await supabase
        .from('crew_memberships')
        .select('crew_id, user_id');

      const { data: scores } = await supabase
        .from('employee_scores')
        .select('user_id, total_score');

      const scoreMap = new Map(scores?.map(s => [s.user_id, s.total_score]) || []);

      const crewStats = new Map<string, { count: number; totalScore: number }>();
      memberships?.forEach(m => {
        const stats = crewStats.get(m.crew_id) || { count: 0, totalScore: 0 };
        stats.count += 1;
        stats.totalScore += scoreMap.get(m.user_id) || 0;
        crewStats.set(m.crew_id, stats);
      });

      return crews?.map(crew => ({
        ...crew,
        member_count: crewStats.get(crew.id)?.count || 0,
        avg_score: crewStats.get(crew.id)?.count 
          ? (crewStats.get(crew.id)!.totalScore / crewStats.get(crew.id)!.count)
          : 0,
      })) as Crew[];
    },
  });
};

export const useEmployeeSkills = (userId?: string) => {
  return useQuery({
    queryKey: ['employee-skills', userId],
    queryFn: async () => {
      let query = supabase.from('employee_skills').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('skill_name');
      if (error) throw error;
      return data as EmployeeSkill[];
    },
    enabled: userId !== undefined,
  });
};

export const useEmployeeCertifications = (userId?: string) => {
  return useQuery({
    queryKey: ['employee-certifications', userId],
    queryFn: async () => {
      let query = supabase.from('employee_certifications').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('certification_name');
      if (error) throw error;
      return data as EmployeeCertification[];
    },
    enabled: userId !== undefined,
  });
};

export const useCalculateScores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      if (userId) {
        const { data, error } = await supabase.rpc('calculate_employee_score', {
          p_user_id: userId,
        });
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.rpc('calculate_all_employee_scores');
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
      toast({
        title: 'Scores Calculated',
        description: userId 
          ? 'Employee score has been recalculated.' 
          : `${data} contributor scores have been calculated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Calculation Failed',
        description: 'Failed to calculate employee scores.',
        variant: 'destructive',
      });
    },
  });
};

export const useInitializeScores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('initialize_contributor_scores');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
      toast({
        title: 'Scoring Initialized!',
        description: `${data} contributors now have baseline scores. Scoring starts now!`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize contributor scores.',
        variant: 'destructive',
      });
    },
  });
};
