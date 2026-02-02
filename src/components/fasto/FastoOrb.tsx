import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, Volume2 } from 'lucide-react';
import roofingFriendMascot from '@/assets/roofing-friend-mascot.png';

interface FastoOrbProps {
  isActive?: boolean;
  isThinking?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FastoOrb: React.FC<FastoOrbProps> = ({
  isActive = false,
  isThinking = false,
  isListening = false,
  isSpeaking = false,
  onClick,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  // Determine current state for styling
  const getCurrentState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    if (isThinking) return 'thinking';
    if (isActive) return 'active';
    return 'idle';
  };

  const state = getCurrentState();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-2xl flex items-center justify-center transition-all duration-500',
        'shadow-lg hover:shadow-xl hover:scale-105',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses[size],
        // State-based colors
        state === 'speaking' && 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 shadow-green-500/25 focus:ring-green-500/30',
        state === 'listening' && 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/25 focus:ring-red-500/30 ring-2 ring-red-500/50 ring-offset-2 ring-offset-background',
        state === 'thinking' && 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-amber-500/25 focus:ring-amber-500/30 animate-pulse',
        state === 'active' && 'bg-gradient-to-br from-primary via-primary to-primary/80 shadow-primary/25 focus:ring-primary/30 ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
        state === 'idle' && 'bg-gradient-to-br from-primary via-primary to-primary/80 shadow-primary/25 focus:ring-primary/30',
        className
      )}
      aria-label="Fasto AI Assistant"
    >
      {/* Inner glow */}
      <div 
        className={cn(
          'absolute inset-0 rounded-2xl transition-opacity duration-500',
          state === 'speaking' && 'bg-gradient-to-br from-green-400/40 to-green-600/40',
          state === 'listening' && 'bg-gradient-to-br from-red-400/40 to-red-600/40',
          state === 'thinking' && 'bg-gradient-to-br from-amber-400/40 to-amber-600/40',
          (state === 'active' || state === 'idle') && 'bg-gradient-to-br from-white/10 to-transparent',
          state !== 'idle' ? 'opacity-100' : 'opacity-50'
        )} 
      />
      
      {/* Outer glow ring */}
      <div 
        className={cn(
          'absolute inset-[-2px] rounded-2xl transition-opacity duration-300 blur-sm',
          state === 'speaking' && 'bg-green-500/30',
          state === 'listening' && 'bg-red-500/30',
          state === 'thinking' && 'bg-amber-500/30',
          (state === 'active' || state === 'idle') && 'bg-primary/20',
          state !== 'idle' ? 'opacity-100' : 'opacity-0'
        )} 
      />
      
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-2xl border-2 border-red-500/40 animate-ping" />
          <div 
            className="absolute inset-[-6px] rounded-2xl border border-red-500/20 animate-pulse" 
            style={{ animationDelay: '0.3s' }} 
          />
        </>
      )}

      {/* Sound waves when speaking */}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-2xl border-2 border-green-400/40 animate-pulse" />
          <div 
            className="absolute inset-[-4px] rounded-2xl border border-green-400/30 animate-pulse" 
            style={{ animationDelay: '0.2s' }} 
          />
          <div 
            className="absolute inset-[-8px] rounded-2xl border border-green-400/20 animate-pulse" 
            style={{ animationDelay: '0.4s' }} 
          />
        </>
      )}

      {/* Mascot image with state overlay icons */}
      <img 
        src={roofingFriendMascot} 
        alt="Fasto Assistant" 
        className={cn(
          "relative z-10 w-full h-full object-cover rounded-2xl transition-transform duration-300",
          isActive && 'scale-105'
        )}
      />
      
      {/* State indicator overlay */}
      {(state === 'speaking' || state === 'listening') && (
        <div className={cn(
          "absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30 z-20",
        )}>
          {state === 'speaking' ? (
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
          ) : (
            <Mic className="w-5 h-5 text-white animate-pulse" />
          )}
        </div>
      )}

      {/* State indicator badge */}
      {state !== 'idle' && (
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-lg shadow-lg flex items-center justify-center",
          state === 'speaking' && 'bg-green-500',
          state === 'listening' && 'bg-red-500',
          state === 'thinking' && 'bg-amber-500',
          state === 'active' && 'bg-primary'
        )}>
          {state === 'thinking' ? (
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : state === 'speaking' ? (
            <div className="flex gap-0.5 items-end">
              <div className="w-0.5 h-1.5 bg-white rounded-full animate-pulse" />
              <div className="w-0.5 h-2.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-0.5 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          ) : (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </div>
      )}
    </button>
  );
};
