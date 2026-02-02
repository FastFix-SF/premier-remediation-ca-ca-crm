import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ActiveShift {
  id: string;
  user_id: string;
  employee_name: string;
  clock_in: string;
  project_name: string | null;
  status: string;
}

export const ActiveShiftsPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeShifts = [], isLoading } = useQuery({
    queryKey: ['active-shifts-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_clock')
        .select('id, user_id, employee_name, clock_in, project_name, status')
        .is('clock_out', null)
        .in('status', ['active', 'on_break'])
        .order('clock_in', { ascending: true });

      if (error) throw error;
      return data as ActiveShift[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: profilesMap = new Map() } = useQuery({
    queryKey: ['user-profiles-shifts'],
    queryFn: async () => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      return new Map(profilesData?.map(p => [p.id, p.avatar_url || '']) || []);
    }
  });

  const forceClockOutMutation = useMutation({
    mutationFn: async (shift: ActiveShift) => {
      const clockInTime = new Date(shift.clock_in).getTime();
      const clockOutTime = new Date();
      const totalHours = (clockOutTime.getTime() - clockInTime) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('time_clock')
        .update({
          clock_out: clockOutTime.toISOString(),
          total_hours: totalHours,
          status: 'completed',
          notes: '[Admin force clock-out]',
        })
        .eq('id', shift.id);

      if (error) throw error;
      return shift;
    },
    onSuccess: (shift) => {
      toast({
        title: 'Shift Closed',
        description: `${shift.employee_name}'s shift has been closed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['active-shifts-admin'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to close shift. Please try again.',
        variant: 'destructive',
      });
      console.error('Force clock out error:', error);
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-orange-500', 'bg-blue-500', 'bg-pink-500', 
      'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getShiftDuration = (clockIn: string) => {
    return formatDistanceToNow(new Date(clockIn), { addSuffix: false });
  };

  const isLongShift = (clockIn: string) => {
    const hours = (Date.now() - new Date(clockIn).getTime()) / (1000 * 60 * 60);
    return hours > 10;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading active shifts...
      </div>
    );
  }

  if (activeShifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active shifts at the moment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeShifts.map((shift) => (
        <div 
          key={shift.id}
          className={`flex items-center justify-between p-3 rounded-xl border ${
            isLongShift(shift.clock_in) ? 'border-orange-300 bg-orange-50' : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 ${getAvatarColor(shift.employee_name)}`}>
              {shift.user_id && profilesMap.get(shift.user_id) && (
                <AvatarImage src={profilesMap.get(shift.user_id)} alt={shift.employee_name} />
              )}
              <AvatarFallback className="text-white font-semibold text-sm">
                {getInitials(shift.employee_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{shift.employee_name}</span>
                {isLongShift(shift.clock_in) && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{getShiftDuration(shift.clock_in)}</span>
                {shift.project_name && (
                  <>
                    <span>•</span>
                    <span>{shift.project_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => forceClockOutMutation.mutate(shift)}
            disabled={forceClockOutMutation.isPending}
            className="text-xs"
          >
            Force Out
          </Button>
        </div>
      ))}
    </div>
  );
};
