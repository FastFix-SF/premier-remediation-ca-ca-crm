import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, FolderOpen, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FastoQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'New Lead',
      description: 'Add a prospect',
      icon: Plus,
      onClick: () => navigate('/admin?tab=sales'),
      primary: true,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Schedule',
      description: 'View calendar',
      icon: Calendar,
      onClick: () => navigate('/admin?tab=workforce'),
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Timesheets',
      description: 'Track hours',
      icon: Clock,
      onClick: () => navigate('/admin?tab=workforce'),
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Projects',
      description: 'Manage jobs',
      icon: FolderOpen,
      onClick: () => navigate('/admin?tab=project-management'),
      gradient: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div className="bg-card rounded-2xl lg:rounded-3xl border border-border/50 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">Quick Actions</h3>
        </div>
      </div>
      
      {/* Actions Grid */}
      <div className="p-4 lg:p-5">
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-3",
                  "p-5 lg:p-6 rounded-xl lg:rounded-2xl transition-all duration-300",
                  "border overflow-hidden",
                  "hover:shadow-xl hover:-translate-y-0.5",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  action.primary 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-lg shadow-primary/20" 
                    : "bg-muted/30 text-foreground border-border/50 hover:bg-muted/50 hover:border-border"
                )}
              >
                {/* Background gradient on hover for non-primary */}
                {!action.primary && (
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                    "bg-gradient-to-br",
                    action.gradient
                  )} />
                )}

                {/* Icon */}
                <div className={cn(
                  "p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all duration-300",
                  "group-hover:scale-110 group-hover:rotate-3",
                  action.primary 
                    ? "bg-white/20" 
                    : "bg-background shadow-sm"
                )}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>

                {/* Text */}
                <div className="text-center relative z-10">
                  <span className="text-sm lg:text-base font-semibold block">{action.label}</span>
                  <span className={cn(
                    "text-xs lg:text-sm mt-0.5 block",
                    action.primary ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {action.description}
                  </span>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Shimmer on primary */}
                {action.primary && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FastoQuickActions;
