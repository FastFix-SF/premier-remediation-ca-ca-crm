import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { User, FolderOpen, Clock, TrendingUp, Activity, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'lead' | 'project' | 'timesheet' | 'quote';
  title: string;
  description: string;
  timestamp: string;
}

export const FastoRecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['fasto-recent-activity'],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      leads?.forEach((lead) => {
        items.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: lead.name || 'New Lead',
          description: `Status: ${lead.status}`,
          timestamp: lead.created_at,
        });
      });

      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      projects?.forEach((project) => {
        items.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.name || 'New Project',
          description: `Status: ${project.status}`,
          timestamp: project.created_at,
        });
      });

      const { data: timeClock } = await supabase
        .from('time_clock')
        .select('id, employee_name, clock_in, clock_out')
        .order('clock_in', { ascending: false })
        .limit(3);

      timeClock?.forEach((entry) => {
        items.push({
          id: `time-${entry.id}`,
          type: 'timesheet',
          title: entry.employee_name || 'Team Member',
          description: entry.clock_out ? 'Clocked out' : 'Clocked in',
          timestamp: entry.clock_in,
        });
      });

      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
    },
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead':
        return TrendingUp;
      case 'project':
        return FolderOpen;
      case 'timesheet':
        return Clock;
      default:
        return User;
    }
  };

  const getStyles = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead':
        return {
          bg: 'bg-amber-500/10',
          iconBg: 'bg-amber-500/20',
          text: 'text-amber-500',
          dot: 'bg-amber-500'
        };
      case 'project':
        return {
          bg: 'bg-emerald-500/10',
          iconBg: 'bg-emerald-500/20',
          text: 'text-emerald-500',
          dot: 'bg-emerald-500'
        };
      case 'timesheet':
        return {
          bg: 'bg-violet-500/10',
          iconBg: 'bg-violet-500/20',
          text: 'text-violet-500',
          dot: 'bg-violet-500'
        };
      default:
        return {
          bg: 'bg-muted',
          iconBg: 'bg-muted',
          text: 'text-muted-foreground',
          dot: 'bg-muted-foreground'
        };
    }
  };

  return (
    <div className="bg-card rounded-2xl lg:rounded-3xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          Last 7 days
        </span>
      </div>
      
      {isLoading ? (
        <div className="p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[320px]">
          <div className="p-4 lg:p-5 space-y-2">
            {activities?.map((activity, index) => {
              const Icon = getIcon(activity.type);
              const styles = getStyles(activity.type);
              
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "group flex items-center gap-4 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all duration-300",
                    "hover:bg-muted/50 cursor-pointer",
                    "border border-transparent hover:border-border/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    "group-hover:scale-105",
                    styles.iconBg
                  )}>
                    <Icon className={cn("w-5 h-5", styles.text)} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm lg:text-base font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Time & Arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:block">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0" />
                  </div>
                </div>
              );
            })}
            
            {(!activities || activities.length === 0) && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-muted/50 mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-base font-medium text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Activity will appear here</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default FastoRecentActivity;
