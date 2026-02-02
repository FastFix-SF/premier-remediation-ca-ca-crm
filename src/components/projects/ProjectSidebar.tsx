import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutList,
  FileText,
  DollarSign,
  Calendar,
  FolderOpen,
  Clock,
  Image,
  Phone,
  CalendarDays,
  Users,
  BarChart3,
  History,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  active?: boolean;
}

export const ProjectSidebar: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems: SidebarItem[] = [
    { label: 'Summary', icon: LayoutList, path: `/admin/projects/${id}/summary` },
    { label: 'Details', icon: FileText, path: `/admin/projects/${id}/details` },
    { label: 'Financial', icon: DollarSign, path: `/admin/projects/${id}/profit` },
    { label: 'Schedule of Values', icon: Calendar, path: `/admin/projects/${id}/schedule-of-values` },
    { label: 'Daily Logs', icon: ClipboardList, path: `/admin/projects/${id}/daily-logs` },
    { label: 'Documents', icon: FolderOpen, path: `/admin/projects/${id}/documents` },
    { label: 'Time', icon: Clock, path: `/admin/projects/${id}/time` },
    { label: 'Files & Photos', icon: Image, path: `/admin/projects/${id}/photos` },
    { label: 'Contacts', icon: Phone, path: `/admin/projects/${id}/contacts` },
    { label: 'Schedule', icon: CalendarDays, path: `/admin/projects/${id}/schedule` },
    { label: 'Client Access', icon: Users, path: `/admin/projects/${id}/client-access` },
    { label: 'Timeline', icon: History, path: `/admin/projects/${id}/timeline` },
    { label: 'Reports', icon: BarChart3, path: `/admin/projects/${id}/reports` },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-[#1e2a4a] text-white h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="flex flex-col py-4">
        {/* Back to Projects */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/10 border-b border-white/10 mb-2"
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Back to Projects</span>
        </button>
        
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-3 px-5 py-3 text-left transition-colors',
                'hover:bg-white/10',
                active && 'bg-white/15 border-l-4 border-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
