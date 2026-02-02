import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
export interface AppIconItem {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
  iconUrl?: string; // AI-generated image URL
  path?: string;
  onClick?: () => void;
  badge?: number;
}
interface AppIconCarouselProps {
  apps: AppIconItem[];
  appsPerPage?: number;
  className?: string;
}
const AppIcon: React.FC<{
  app: AppIconItem;
}> = ({
  app
}) => {
  const navigate = useNavigate();
  const Icon = app.icon;
  const handleClick = () => {
    if (app.onClick) {
      app.onClick();
    } else if (app.path) {
      navigate(app.path);
    }
  };
  return <button onClick={handleClick} className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        {/* Layered shadow for 3D depth */}
        <div className="absolute inset-0 rounded-[22%] bg-black/20 blur-xl translate-y-2 scale-95" />
        
        {/* Main icon container - iOS 26 squircle */}
        <div className={cn("relative w-[60px] h-[60px] rounded-[22%] overflow-hidden", "bg-gradient-to-br", app.gradient, "shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]", "ring-1 ring-inset ring-white/20", "transition-all duration-200 ease-out", "active:scale-90 group-hover:scale-105")}>
          {/* AI-generated image OR fallback gradient + Lucide icon */}
          {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> : <>
              {/* Fallback: Gradient background */}
              <div className={cn("absolute inset-0 bg-gradient-to-br", app.gradient)} />
              
              {/* Icon with shadow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" strokeWidth={2.25} />
              </div>
            </>}
          
          {/* Glass shine overlay (always on top) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
          
          {/* Inner glow ring */}
          <div className="absolute inset-[1px] rounded-[21%] ring-1 ring-inset ring-white/10 pointer-events-none" />
        </div>

        {/* iOS-style notification badge */}
        {app.badge !== undefined && app.badge > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 border-2 border-background shadow-[0_2px_8px_rgba(239,68,68,0.5)]">
            {app.badge > 99 ? '99+' : app.badge}
          </span>}
      </div>
      <span className="text-xs text-center text-foreground/80 font-medium leading-tight line-clamp-2 max-w-[60px]">
        {app.name}
      </span>
    </button>;
};
export const AppIconCarousel: React.FC<AppIconCarouselProps> = ({
  apps,
  appsPerPage = 16,
  className
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Split apps into pages
  const pages = useMemo(() => {
    const result: AppIconItem[][] = [];
    for (let i = 0; i < apps.length; i += appsPerPage) {
      result.push(apps.slice(i, i + appsPerPage));
    }
    return result;
  }, [apps, appsPerPage]);

  // Track current page
  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);
  return <div className={cn("relative", className)}>
      <Carousel setApi={setApi} opts={{
      align: "start",
      loop: false
    }} className="w-full">
        <CarouselContent className="-ml-0">
          {pages.map((pageApps, pageIndex) => <CarouselItem key={pageIndex} className="pl-0">
              <div className="grid grid-cols-4 gap-4 px-4 min-h-[320px] pt-[10px]">
                {pageApps.map(app => <AppIcon key={app.id} app={app} />)}
              </div>
            </CarouselItem>)}
        </CarouselContent>
      </Carousel>

      {/* Page Indicator Dots */}
      {count > 1 && <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({
        length: count
      }).map((_, i) => <button key={i} onClick={() => api?.scrollTo(i)} className={cn("h-2 rounded-full transition-all duration-200", i === current ? "w-6 bg-foreground" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50")} aria-label={`Go to page ${i + 1}`} />)}
        </div>}
    </div>;
};