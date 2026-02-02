import React from 'react';
import { 
  Plus, 
  Calendar, 
  FolderOpen, 
  Receipt, 
  Users, 
  FileText,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickApp {
  icon: React.ElementType;
  label: string;
  action: () => void;
  color: string;
}

export const QuickAppsWidget = () => {
  const navigate = useNavigate();

  const apps: QuickApp[] = [
    { 
      icon: Plus, 
      label: 'New Lead', 
      action: () => navigate('/admin?tab=leads&action=new'),
      color: 'bg-emerald-500/20 text-emerald-400'
    },
    { 
      icon: Calendar, 
      label: 'Schedule', 
      action: () => navigate('/admin?tab=schedule'),
      color: 'bg-blue-500/20 text-blue-400'
    },
    { 
      icon: FolderOpen, 
      label: 'Projects', 
      action: () => navigate('/admin?tab=projects'),
      color: 'bg-purple-500/20 text-purple-400'
    },
    { 
      icon: Receipt, 
      label: 'Invoices', 
      action: () => navigate('/admin?tab=invoices'),
      color: 'bg-amber-500/20 text-amber-400'
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3 px-1">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.label}
              onClick={app.action}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                "hover:bg-white/10 hover:scale-105",
                "border border-transparent hover:border-white/10"
              )}
            >
              <div className={cn("p-2.5 rounded-xl", app.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-white/60">{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
