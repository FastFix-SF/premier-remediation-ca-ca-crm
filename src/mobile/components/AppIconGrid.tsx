import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppIconItem {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
  iconUrl?: string;        // AI-generated image URL
  path?: string;
  onClick?: () => void;
  badge?: number;
}

interface AppIconGridProps {
  apps: AppIconItem[];
  className?: string;
}

export const AppIconGrid: React.FC<AppIconGridProps> = ({ apps, className }) => {
  const navigate = useNavigate();

  const handleClick = (app: AppIconItem) => {
    if (app.onClick) {
      app.onClick();
    } else if (app.path) {
      navigate(app.path);
    }
  };

  return (
    <div className={cn("grid grid-cols-4 gap-4 px-2", className)}>
      {apps.map((app) => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            onClick={() => handleClick(app)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="relative">
              {/* Layered shadow for 3D depth */}
              <div className="absolute inset-0 rounded-[22%] bg-black/20 blur-xl translate-y-2 scale-95" />
              
              {/* Main icon container - iOS 26 squircle */}
              <div
                className={cn(
                  "relative w-[60px] h-[60px] rounded-[22%] overflow-hidden",
                  "bg-gradient-to-br",
                  app.gradient,
                  "shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]",
                  "ring-1 ring-inset ring-white/20",
                  "transition-all duration-200 ease-out",
                  "active:scale-90 group-hover:scale-105"
                )}
              >
                {/* AI-generated image OR fallback gradient + Lucide icon */}
                {app.iconUrl ? (
                  <img 
                    src={app.iconUrl} 
                    alt={app.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <>
                    {/* Fallback: Gradient background */}
                    <div className={cn("absolute inset-0 bg-gradient-to-br", app.gradient)} />
                    
                    {/* Icon with shadow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" strokeWidth={2.25} />
                    </div>
                  </>
                )}
                
                {/* Glass shine overlay (always on top) */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
                
                {/* Inner glow ring */}
                <div className="absolute inset-[1px] rounded-[21%] ring-1 ring-inset ring-white/10 pointer-events-none" />
              </div>

              {/* iOS-style notification badge */}
              {app.badge !== undefined && app.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 border-2 border-background shadow-[0_2px_8px_rgba(239,68,68,0.5)]">
                  {app.badge > 99 ? '99+' : app.badge}
                </span>
              )}
            </div>
            <span className="text-xs text-center text-foreground/80 font-medium leading-tight line-clamp-2 max-w-[60px]">
              {app.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
