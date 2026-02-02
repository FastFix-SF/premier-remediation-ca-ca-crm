import { useEffect, useState } from 'react';

export interface LayoutStabilityOptions {
  debugMode?: boolean;
  lockMobile?: boolean;
  lockDesktop?: boolean;
  preventShifts?: boolean;
}

export const useLayoutStability = (options: LayoutStabilityOptions = {}) => {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [breakpoint, setBreakpoint] = useState<string>('xs');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let currentBreakpoint = 'xs';
      
      if (width >= 1280) currentBreakpoint = 'xl';
      else if (width >= 1024) currentBreakpoint = 'lg';
      else if (width >= 768) currentBreakpoint = 'md';
      else if (width >= 640) currentBreakpoint = 'sm';
      
      setBreakpoint(currentBreakpoint);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  useEffect(() => {
    if (options.debugMode) {
      document.body.classList.add('debug-breakpoint');
      return () => document.body.classList.remove('debug-breakpoint');
    }
  }, [options.debugMode]);

  const lockLayout = () => {
    setIsLayoutLocked(true);
    if (options.lockDesktop && window.innerWidth >= 1024) {
      document.body.classList.add('layout-lock-desktop');
    }
    if (options.lockMobile && window.innerWidth < 768) {
      document.body.classList.add('layout-lock-mobile');
    }
  };

  const unlockLayout = () => {
    setIsLayoutLocked(false);
    document.body.classList.remove('layout-lock-desktop', 'layout-lock-mobile');
  };

  const toggleDebugMode = () => {
    document.body.classList.toggle('debug-layout');
    const layoutElements = document.querySelectorAll('.layout-lock, .stable-grid');
    layoutElements.forEach(el => el.classList.toggle('debug-layout'));
  };

  return {
    isLayoutLocked,
    breakpoint,
    lockLayout,
    unlockLayout,
    toggleDebugMode
  };
};

export default useLayoutStability;