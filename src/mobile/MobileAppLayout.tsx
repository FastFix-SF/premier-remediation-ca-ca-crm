// MobileAppLayout - Main layout component for mobile app
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, MessageCircle, User, Crown, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFastoSettings } from '@/hooks/useFastoSettings';
import { MobileHeader } from './components/MobileHeader';
import { MobileTabBar } from './components/MobileTabBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MobileAppGuard } from './components/guards/MobileAppGuard';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { MobileFeedbackButton } from './components/MobileFeedbackButton';
import { useNativeLinkHandler } from './hooks/useNativeLinkHandler';
import { MobileFastoPanel } from './components/MobileFastoPanel';

// Wrapper components to delay initialization
const DelayedPushNotifications: React.FC = () => {
  usePushNotifications();
  return null;
};

const DelayedRealtimeNotifications: React.FC = () => {
  useRealtimeNotifications();
  return null;
};

export const MobileAppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { data: adminStatus } = useAdminStatus();
  const { t } = useLanguage();
  const { settings: fastoSettings } = useFastoSettings();
  const [initNotifications, setInitNotifications] = useState(false);
  
  // Intercept external links in native app to prevent browser opening
  useNativeLinkHandler();
  
  // Delay notifications initialization by 2 seconds to prioritize UI rendering
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitNotifications(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // For admins/owners: Home + Admin only (no profile tab)
  // For contributors/leaders: Home + Profile
  const adminTabs = [
    { id: 'home', label: t('nav.home'), icon: Home, path: '/mobile/home', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'admin', label: t('nav.admin'), icon: Crown, path: '/mobile/admin', gradient: 'from-yellow-500 to-amber-500', notificationCount: 14 },
  ];

  const contributorTabs = [
    { id: 'home', label: t('nav.home'), icon: Home, path: '/mobile/home', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'profile', label: t('nav.profile'), icon: User, path: '/mobile/profile', gradient: 'from-purple-500 to-violet-600' },
  ];

  const tabs = adminStatus?.isAdmin ? adminTabs : contributorTabs;
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're inside a project detail page
  const isProjectDetailPage = /^\/mobile\/projects\/[a-f0-9-]+$/i.test(location.pathname);
  
  // Fasto panel state
  const [isFastoPanelOpen, setIsFastoPanelOpen] = useState(false);
  const [fastoState, setFastoState] = useState({
    isActive: false,
    isListening: false,
    isSpeaking: false,
    isThinking: false
  });
  
  // Listen for Fasto status changes from the voice hook
  useEffect(() => {
    const handleFastoStatusChange = (e: CustomEvent<{ status: string }>) => {
      const { status } = e.detail;
      setFastoState(prev => ({
        ...prev,
        isActive: isFastoPanelOpen,
        isListening: status === 'listening',
        isSpeaking: status === 'speaking',
        isThinking: status === 'thinking'
      }));
    };

    window.addEventListener('fasto-status-change', handleFastoStatusChange as EventListener);
    return () => window.removeEventListener('fasto-status-change', handleFastoStatusChange as EventListener);
  }, [isFastoPanelOpen]);
  
  const [showTip, setShowTip] = useState(() => {
    const hasSeenTip = localStorage.getItem('hasSeenMobileTip');
    return hasSeenTip !== 'true';
  });

  const dismissTip = () => {
    localStorage.setItem('hasSeenMobileTip', 'true');
    setShowTip(false);
  };
  
  const handleFastoClick = useCallback(() => {
    setIsFastoPanelOpen(true);
    setFastoState(prev => ({ ...prev, isActive: true }));
  }, []);
  
  const handleFastoClose = useCallback(() => {
    setIsFastoPanelOpen(false);
    setFastoState({ isActive: false, isListening: false, isSpeaking: false, isThinking: false });
  }, []);

  // Redirect to auth if not logged in (except when already on auth page)
  React.useEffect(() => {
    if (!loading && !user && !location.pathname.startsWith('/mobile/auth')) {
      navigate('/mobile/auth', { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  // Redirect to home tab if on root mobile path
  React.useEffect(() => {
    if (location.pathname === '/mobile' || location.pathname === '/mobile/') {
      navigate('/mobile/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Scroll to top on route change
  React.useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.id || 'home';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <MobileAppGuard>
      {/* Delayed initialization of notifications */}
      {initNotifications && (
        <>
          <DelayedPushNotifications />
          <DelayedRealtimeNotifications />
        </>
      )}
      
      <div className="flex flex-col h-screen h-[100dvh] bg-background mobile-app layout-lock-mobile overflow-hidden">
        {/* iOS Status Bar Extension - fills notch area with gradient */}
        <div className="status-bar-extension animated-wave-gradient" aria-hidden="true" />
        
        {/* Top App Bar */}
        <MobileHeader />
        
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* Feedback Button */}
        <MobileFeedbackButton />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
        
        {/* Bottom Tab Bar - hidden on project detail pages */}
        {!isProjectDetailPage && (
          <MobileTabBar 
            tabs={tabs} 
            currentTab={currentTab}
            fastoState={fastoState}
            onFastoClick={fastoSettings.enabled ? handleFastoClick : undefined}
            fastoEnabled={fastoSettings.enabled}
          />
        )}
        
        {/* Fasto Voice Panel */}
        <MobileFastoPanel 
          isOpen={isFastoPanelOpen} 
          onClose={handleFastoClose} 
        />
        
        {/* One-time tip */}
        {currentTab === 'projects' && showTip && (
          <div className="fixed bottom-16 xs:bottom-20 left-2 right-2 xs:left-4 xs:right-4 bg-primary text-primary-foreground p-2 xs:p-3 rounded-lg text-xs xs:text-sm shadow-lg z-10 flex items-start justify-between gap-2">
            <span className="flex-1 line-clamp-3">
              📱 {t('mobile.uploadTip')}
            </span>
            <button
              onClick={dismissTip}
              className="flex-shrink-0 p-1 hover:bg-primary-foreground/20 rounded transition-colors touch-target"
              aria-label="Dismiss tip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </MobileAppGuard>
  );
};