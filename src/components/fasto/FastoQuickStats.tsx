import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FolderOpen, TrendingUp, Clock, ArrowUpRight, Users } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const FastoQuickStats = () => {
  const navigate = useNavigate();
  const today = new Date();

  const { data: schedules } = useQuery({
    queryKey: ['fasto-schedules-today'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_schedules')
        .select('id')
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(today).toISOString())
        .not('status', 'eq', 'cancelled');
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['fasto-active-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .in('status', ['active', 'in_progress', 'scheduled']);
      return data || [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['fasto-new-leads'],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', weekAgo.toISOString())
        .eq('status', 'new');
      return data || [];
    },
  });

  const { data: clockedIn } = useQuery({
    queryKey: ['fasto-clocked-in'],
    queryFn: async () => {
      const { data } = await supabase
        .from('time_clock')
        .select('id')
        .gte('clock_in', startOfDay(today).toISOString())
        .is('clock_out', null);
      return data || [];
    },
  });

  const stats = [
    {
      label: "Today's Jobs",
      value: schedules?.length || 0,
      subText: 'Scheduled for today',
      icon: Calendar,
      gradient: 'from-blue-500 to-indigo-600',
      glowColor: 'shadow-blue-500/25',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      onClick: () => navigate('/admin?tab=workforce'),
    },
    {
      label: 'Active Projects',
      value: projects?.length || 0,
      subText: 'Currently in progress',
      icon: FolderOpen,
      gradient: 'from-emerald-500 to-teal-600',
      glowColor: 'shadow-emerald-500/25',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      onClick: () => navigate('/admin?tab=project-management'),
    },
    {
      label: 'New Leads',
      value: leads?.length || 0,
      subText: 'From the past 7 days',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'shadow-amber-500/25',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      onClick: () => navigate('/admin?tab=sales'),
    },
    {
      label: 'Clocked In',
      value: clockedIn?.length || 0,
      subText: 'Team members on site',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      glowColor: 'shadow-violet-500/25',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      onClick: () => navigate('/admin?tab=workforce'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className={cn(
              "group relative overflow-hidden",
              "rounded-2xl lg:rounded-3xl",
              "p-5 lg:p-6 text-left transition-all duration-500",
              "bg-card border border-border/50",
              "hover:shadow-2xl hover:-translate-y-1",
              stat.glowColor,
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
            )}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Gradient accent */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300",
              "group-hover:h-1.5",
              stat.gradient
            )} />

            {/* Background glow on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              "bg-gradient-to-br",
              stat.gradient,
              "blur-3xl -z-10"
            )} style={{ transform: 'scale(0.5)', opacity: 0.1 }} />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                <p className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm lg:text-base text-muted-foreground mt-2 font-medium">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {stat.subText}
                </p>
              </div>
              
              <div className={cn(
                "p-3 lg:p-4 rounded-2xl transition-all duration-300",
                "group-hover:scale-110 group-hover:rotate-3",
                stat.iconBg
              )}>
                <Icon className={cn("w-6 h-6 lg:w-7 lg:h-7", stat.iconColor)} />
              </div>
            </div>

            {/* Hover arrow indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className={cn(
                "p-2 rounded-full",
                stat.iconBg
              )}>
                <ArrowUpRight className={cn("w-4 h-4", stat.iconColor)} />
              </div>
            </div>

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FastoQuickStats;
