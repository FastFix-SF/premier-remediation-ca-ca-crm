import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CommandCenterSidebar } from './CommandCenterSidebar';
import { useSessionHeartbeat } from './hooks/useSessionHeartbeat';
import { useActivityTracker } from './hooks/useActivityTracker';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import all view components
import { CCHomeView } from './views/CCHomeView';
import { CCOfficeView } from './views/CCOfficeView';
import { CCTasksView } from './views/CCTasksView';
import { CCClientsView } from './views/CCClientsView';
import { CCTimeView } from './views/CCTimeView';
import { CCRankingView } from './views/CCRankingView';
import { CCTeamView } from './views/CCTeamView';
import { CCMessagesView } from './views/CCMessagesView';
import { CCProfileView } from './views/CCProfileView';
import { CCAlertsView } from './views/CCAlertsView';
import { CCSettingsView } from './views/CCSettingsView';

export type CommandCenterView = 
  | 'home' 
  | 'office' 
  | 'tasks' 
  | 'clients'
  | 'time' 
  | 'ranking' 
  | 'team' 
  | 'messages' 
  | 'profile' 
  | 'alerts' 
  | 'settings';

export const CommandCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<CommandCenterView>('home');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Session heartbeat for tracking presence
  useSessionHeartbeat(memberId);
  
  // Activity tracker for gamification
  const { logDailyCheckin } = useActivityTracker(memberId);

  // Fetch current user's team member record
  useEffect(() => {
    const fetchMember = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('team_directory')
          .select('user_id, full_name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Failed to fetch team member:', error);
        } else if (data) {
          setMemberId(data.user_id);
          setMemberName(data.full_name || data.email?.split('@')[0] || 'User');
          
          // Log daily check-in on first load
          logDailyCheckin();
        }
      } catch (err) {
        console.error('Error fetching member:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [user?.id, logDailyCheckin]);

  // Fetch unread counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!memberId) return;

      try {
        // Fetch unread messages
        const { count: msgCount } = await supabase
          .from('team_member_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('type', 'message')
          .eq('is_read', false);

        setUnreadMessages(msgCount || 0);

        // Fetch alerts count
        const { count: alertCount } = await supabase
          .from('team_member_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .neq('type', 'message')
          .eq('is_read', false);

        setUnreadNotifications(alertCount || 0);
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    };

    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [memberId]);

  // Handler to change view - accepts string and casts to CommandCenterView
  const handleSetActiveView = (view: string) => {
    setActiveView(view as CommandCenterView);
  };

  // Render the active view
  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <CCHomeView memberId={memberId} memberName={memberName} />;
      case 'office':
        return <CCOfficeView memberId={memberId} />;
      case 'tasks':
        return <CCTasksView memberId={memberId} />;
      case 'clients':
        return <CCClientsView memberId={memberId} />;
      case 'time':
        return <CCTimeView memberId={memberId} />;
      case 'ranking':
        return <CCRankingView memberId={memberId} />;
      case 'team':
        return <CCTeamView memberId={memberId} />;
      case 'messages':
        return <CCMessagesView memberId={memberId} />;
      case 'profile':
        return <CCProfileView memberId={memberId} />;
      case 'alerts':
        return <CCAlertsView memberId={memberId} />;
      case 'settings':
        return <CCSettingsView memberId={memberId} />;
      default:
        return <CCHomeView memberId={memberId} memberName={memberName} />;
    }
  };

  if (loading) {
    return (
      <div className="command-center-container flex items-center justify-center min-h-[600px] rounded-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="command-center-container rounded-xl overflow-hidden min-h-[700px]">
      <div className="flex h-full">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="command-glass-card text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sidebar */}
        <CommandCenterSidebar
          activeView={activeView}
          setActiveView={handleSetActiveView}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          memberId={memberId}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="lg:hidden h-12" /> {/* Spacer for mobile menu button */}
          {renderView()}
        </div>
      </div>
    </div>
  );
};
