import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Users, FileText, DollarSign, Hammer, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StatTile {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  tab: string;
}

export const CompactStatsWidget = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['compact-stats'],
    queryFn: async () => {
      const [leadsRes, projectsRes, invoicesRes, workOrdersRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('work_orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
      ]);

      return {
        newLeads: leadsRes.count || 0,
        activeProjects: projectsRes.count || 0,
        pendingInvoices: invoicesRes.count || 0,
        activeWorkOrders: workOrdersRes.count || 0,
      };
    },
  });

  const tiles: StatTile[] = [
    { 
      icon: Users, 
      label: 'Leads', 
      value: stats?.newLeads || 0, 
      color: 'from-violet-500/20 to-purple-500/20',
      tab: 'leads'
    },
    { 
      icon: Briefcase, 
      label: 'Projects', 
      value: stats?.activeProjects || 0, 
      color: 'from-emerald-500/20 to-teal-500/20',
      tab: 'projects'
    },
    { 
      icon: FileText, 
      label: 'Invoices', 
      value: stats?.pendingInvoices || 0, 
      color: 'from-amber-500/20 to-orange-500/20',
      tab: 'invoices'
    },
    { 
      icon: Hammer, 
      label: 'Work Orders', 
      value: stats?.activeWorkOrders || 0, 
      color: 'from-blue-500/20 to-cyan-500/20',
      tab: 'work-orders'
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
      <div className="grid grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.label}
              onClick={() => navigate(`/admin?tab=${tile.tab}`)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                "bg-gradient-to-br hover:scale-105",
                tile.color,
                "border border-white/5 hover:border-white/20"
              )}
            >
              <Icon className="w-6 h-6 text-white/70" />
              <span className="text-2xl font-semibold text-white">{tile.value}</span>
              <span className="text-xs text-white/50">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
