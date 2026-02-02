import React from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Building2,
  CheckSquare,
  Clock,
  Trophy,
  Users,
  MessageSquare,
  User,
  Bell,
  Settings,
  X,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamNotificationBell } from '@/components/notifications/TeamNotificationBell';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface CommandCenterSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  unreadNotifications?: number;
  unreadMessages?: number;
  memberId?: string | null;
}

export const CommandCenterSidebar: React.FC<CommandCenterSidebarProps> = ({
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  unreadNotifications = 0,
  unreadMessages = 0,
  memberId = null,
}) => {
  const mainNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'office', label: 'Office', icon: Building2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'clients', label: 'Clients', icon: Briefcase },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
  ];

  const secondaryNavItems: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadNotifications },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  const NavButton: React.FC<{ item: NavItem }> = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          'text-sm font-medium',
          isActive
            ? 'bg-white/10 text-white shadow-lg'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{item.label}</span>
        {item.badge && item.badge > 0 && (
          <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5">
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 lg:z-30',
          'w-64 bg-[#0f0f23]/95 backdrop-blur-xl border-r border-white/10',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <span className="text-white font-semibold">Command Center</span>
          </div>
          <div className="flex items-center gap-1">
            <TeamNotificationBell 
              memberId={memberId} 
              onNavigate={(view) => handleNavClick(view)}
              variant="sidebar"
            />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white/60 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Main Nav */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          {/* Secondary Nav */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-center">
            <span className="text-white/40 text-xs">Roofing Friend</span>
          </div>
        </div>
      </aside>
    </>
  );
};
