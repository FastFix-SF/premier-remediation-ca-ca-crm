import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientLaborSummary {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalCost: number;
  employeeCount: number;
  budgetedAmount: number;
  variance: number;
  isOverBudget: boolean;
}

export const useClientLabor = (projectId: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['client-labor', projectId],
    queryFn: async (): Promise<ClientLaborSummary> => {
      if (!projectId) {
        return {
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalCost: 0,
          employeeCount: 0,
          budgetedAmount: 0,
          variance: 0,
          isOverBudget: false
        };
      }

      // Fetch time clock entries for this project
      const [timeEntriesResult, projectResult, teamMembersResult] = await Promise.all([
        supabase
          .from('time_clock')
          .select('total_hours, user_id, employee_name')
          .eq('job_id', projectId)
          .not('clock_out', 'is', null),
        supabase
          .from('projects')
          .select('budget_labor')
          .eq('id', projectId)
          .maybeSingle(),
        supabase
          .from('team_directory')
          .select('user_id, hourly_rate')
      ]);

      const timeEntries = timeEntriesResult.data || [];
      const budgetedAmount = projectResult.data?.budget_labor || 0;
      
      // Create hourly rate lookup
      const payRateByUserId = new Map<string, number>();
      if (teamMembersResult.data) {
        teamMembersResult.data.forEach(member => {
          if (member.user_id && member.hourly_rate) {
            payRateByUserId.set(member.user_id, Number(member.hourly_rate));
          }
        });
      }

      const DEFAULT_HOURLY_RATE = 25.0;
      const OT_MULTIPLIER = 1.5;

      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let totalCost = 0;
      const uniqueEmployees = new Set<string>();

      timeEntries.forEach(entry => {
        const hours = Number(entry.total_hours || 0);
        const regular = Math.min(hours, 8);
        const overtime = Math.max(hours - 8, 0);
        
        const hourlyRate = entry.user_id && payRateByUserId.get(entry.user_id) 
          ? payRateByUserId.get(entry.user_id)! 
          : DEFAULT_HOURLY_RATE;

        totalHours += hours;
        regularHours += regular;
        overtimeHours += overtime;
        totalCost += (regular * hourlyRate) + (overtime * hourlyRate * OT_MULTIPLIER);
        
        if (entry.employee_name) {
          uniqueEmployees.add(entry.employee_name);
        }
      });

      const variance = budgetedAmount - totalCost;

      return {
        totalHours,
        regularHours,
        overtimeHours,
        totalCost,
        employeeCount: uniqueEmployees.size,
        budgetedAmount,
        variance,
        isOverBudget: totalCost > budgetedAmount && budgetedAmount > 0
      };
    },
    enabled: !!projectId
  });

  return {
    laborSummary: data || {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      totalCost: 0,
      employeeCount: 0,
      budgetedAmount: 0,
      variance: 0,
      isOverBudget: false
    },
    isLoading
  };
};
