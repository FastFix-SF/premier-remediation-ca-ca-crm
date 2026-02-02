
import React, { useState } from 'react';
import { Search, MessageCircle, Zap } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/use-mobile';

const RoofChatButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isMobile = useIsMobile();
  const { 
    setIsSearchOpen, 
    setSearchMode, 
    interestScore, 
    currentLead,
    chatMessages 
  } = useSearch();

  const handleClick = () => {
    setSearchMode('search');
    setIsSearchOpen(true);
  };

  const isHighValue = interestScore >= 7 || currentLead;
  const hasActivity = chatMessages.length > 0;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Main Button Container */}
      <div
        className="relative group"
        onMouseEnter={() => !isMobile && setShowTooltip(true)}
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
      >
        {/* Enhanced Roofing Tool Button */}
        <button
          onClick={handleClick}
          className={cn(
            "relative flex items-center justify-center",
            "w-12 h-12 sm:w-16 sm:h-16 rounded-full",
            "bg-gradient-to-br from-primary via-primary to-primary/90",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-500 ease-out",
            "hover:scale-110 active:scale-95",
            "border-2 border-white/20",
            isHighValue && "animate-pulse shadow-xl"
          )}
        >
          {/* Animated Background Ring */}
          {hasActivity && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 animate-ping" />
          )}
          
          {/* Tool Design Elements */}
          <div className="absolute inset-1 sm:inset-2 rounded-full bg-white/10 border border-white/20" />
          
          {/* Main Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Dynamic Notification Badge */}
          <div className={cn(
            "absolute -top-1 -right-1 rounded-full flex items-center justify-center transition-all duration-300",
            isHighValue 
              ? "w-5 h-5 sm:w-6 sm:h-6 bg-accent animate-bounce" 
              : "w-4 h-4 sm:w-5 sm:h-5 bg-destructive",
            hasActivity && "animate-pulse"
          )}>
            {isHighValue ? (
              <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
            ) : (
              <span className="text-white text-xs font-bold">{chatMessages.length || 1}</span>
            )}
          </div>
          
          {/* Tool "Handle" Design - Hidden on mobile */}
          <div className="absolute -right-1 top-2 sm:top-3 w-1 h-6 sm:w-2 sm:h-10 bg-primary/80 rounded-r-sm border-r border-white/30 hidden sm:block" />
        </button>

        {/* Enhanced Tooltip - Desktop only */}
        {showTooltip && !isMobile && (
          <div className={cn(
            "absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap",
            "bg-foreground text-background text-sm",
            "animate-fade-in"
          )}>
            {isHighValue ? "🔥 Hot Lead - Search & Chat" : "Search & Chat"}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
          </div>
        )}

        {/* Floating Chat Icon for Chat Mode */}
        <button
          onClick={() => {
            setSearchMode('chat');
            setIsSearchOpen(true);
          }}
          className={cn(
            "absolute -top-1 -left-1 sm:-top-2 sm:-left-2",
            "w-6 h-6 sm:w-8 sm:h-8 rounded-full",
            "bg-accent text-accent-foreground",
            "shadow-md hover:shadow-lg",
            "transition-all duration-300",
            "hover:scale-125 active:scale-95",
            "flex items-center justify-center",
            hasActivity && "animate-bounce"
          )}
        >
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={2} />
        </button>

        {/* Success Ring Animation for High-Value Leads */}
        {isHighValue && (
          <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-75" />
        )}
      </div>
    </div>
  );
};

export default RoofChatButton;
