import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckSquare, Clock, AlertCircle, Users, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface WorkforceSummaryProps {
  onTabChange: (tab: string) => void;
}

const WorkforceSummary = ({ onTabChange }: WorkforceSummaryProps) => {
  // Fetch scheduling data
  const { data: schedules } = useQuery({
    queryKey: ['workforce-schedules-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .gte('start_date', format(new Date(), 'yyyy-MM-dd'))
        .order('start_date');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch tasks data
  const { data: tasks } = useQuery({
    queryKey: ['workforce-tasks-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch employee requests
  const { data: requests } = useQuery({
    queryKey: ['workforce-requests-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch timesheets for current week from time_clock table
  const { data: timesheets } = useQuery({
    queryKey: ['workforce-timesheets-summary'],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      
      const { data, error } = await supabase
        .from('time_clock')
        .select('*')
        .gte('clock_in', weekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString());
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch team members
  const { data: teamMembers } = useQuery({
    queryKey: ['workforce-team-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch live attendance from time_clock table
  const { data: liveAttendance } = useQuery({
    queryKey: ['workforce-live-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_clock')
        .select('*')
        .is('clock_out', null);
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats
  const upcomingSchedules = schedules?.length || 0;
  const taskStats = {
    pending: tasks?.filter(t => !t.is_completed).length || 0,
    completed: tasks?.filter(t => t.is_completed).length || 0,
    total: tasks?.length || 0
  };
  const pendingRequests = requests?.length || 0;
  const weeklyHours = timesheets?.reduce((sum, t) => sum + (t.total_hours || 0), 0) || 0;
  const activeEmployees = liveAttendance?.length || 0;
  const totalTeamMembers = teamMembers?.length || 0;

  // Calculate labor cost (simplified - would need pay rates in real scenario)
  const estimatedLaborCost = weeklyHours * 25; // $25/hr average estimate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workforce Overview</h2>
        <p className="text-muted-foreground">
          Comprehensive summary of all workforce activities and metrics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Now */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Employees currently clocked in
            </p>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        {/* Weekly Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Current week total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Scheduling */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSchedules}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled projects and shifts
            </p>
          </CardContent>
        </Card>

        {/* Tasks Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Status</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium">{taskStats.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium text-green-600">{taskStats.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{taskStats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Labor Cost Estimate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Labor Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedLaborCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current week estimate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => onTabChange('scheduling')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Scheduling</span>
            </button>
            <button
              onClick={() => onTabChange('tasks')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <CheckSquare className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Tasks</span>
            </button>
            <button
              onClick={() => onTabChange('requests')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <AlertCircle className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Requests</span>
            </button>
            <button
              onClick={() => onTabChange('timesheets')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Timesheets</span>
            </button>
            <button
              onClick={() => onTabChange('team')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Users className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Team</span>
            </button>
            <button
              onClick={() => onTabChange('live')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Live</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkforceSummary;
