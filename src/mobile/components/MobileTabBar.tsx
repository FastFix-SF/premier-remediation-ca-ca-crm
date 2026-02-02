import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from './chat/NotificationBadge';
import { MobileFastoButton } from './MobileFastoButton';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
  notificationCount?: number;
}

interface MobileTabBarProps {
  tabs: Tab[];
  currentTab: string;
  fastoState?: {
    isActive: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
  };
  onFastoClick?: () => void;
  fastoEnabled?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ 
  tabs, 
  currentTab,
  fastoState = { isActive: false, isListening: false, isSpeaking: false, isThinking: false },
  onFastoClick,
  fastoEnabled = true
}) => {
  const navigate = useNavigate();

  const renderTab = (tab: Tab) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;
    
    return (
      <button
        key={tab.id}
        onClick={() => navigate(tab.path)}
        className={cn(
          "flex flex-col items-center justify-center gap-1",
          "min-h-[50px] w-full",
          "bg-transparent border-none outline-none cursor-pointer",
          "transition-colors duration-200"
        )}
      >
        <div className="relative">
          <Icon 
            className={cn(
              "w-7 h-7 transition-colors duration-200",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground"
            )}
            strokeWidth={isActive ? 2.25 : 1.75}
            fill={isActive ? "currentColor" : "none"}
          />
          
          {tab.notificationCount && tab.notificationCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <NotificationBadge count={tab.notificationCount} />
            </div>
          )}
        </div>
        
        <span className={cn(
          "text-[10px] font-medium",
          "transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {tab.label}
        </span>
      </button>
    );
  };

  // Always 2 tabs: [Home] [empty] [Fasto] [empty] [Profile/Admin]
  const firstTab = tabs[0];  // Home for everyone
  const lastTab = tabs[1];   // Profile (contributors) or Admin (admins)

  return (
    <nav className="app-bottom-bar grid grid-cols-5 items-center py-2 px-1 border-t border-border/50">
      {/* Column 1: Home */}
      <div className="flex justify-center">
        {renderTab(firstTab)}
      </div>
      
      {/* Column 2: Empty spacer */}
      <div />
      
      {/* Column 3: Fasto (always centered) - only show if enabled */}
      <div className="flex justify-center">
        {fastoEnabled && onFastoClick && (
          <MobileFastoButton
            isActive={fastoState.isActive}
            isListening={fastoState.isListening}
            isSpeaking={fastoState.isSpeaking}
            isThinking={fastoState.isThinking}
            onClick={onFastoClick}
          />
        )}
      </div>
      
      {/* Column 4: Empty spacer */}
      <div />
      
      {/* Column 5: Profile or Admin */}
      <div className="flex justify-center">
        {renderTab(lastTab)}
      </div>
    </nav>
  );
};
