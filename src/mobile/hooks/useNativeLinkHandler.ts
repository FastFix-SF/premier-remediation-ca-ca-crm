import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook that intercepts external links and window.open calls in native Capacitor apps
 * to prevent them from opening in the external browser (Safari).
 */
export const useNativeLinkHandler = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        
        // Allow internal navigation
        if (!href || href.startsWith('/') || href.startsWith('#')) {
          return;
        }
        
        // Block external links from opening in browser
        if (href.startsWith('http')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[Native] Blocked external link:', href);
        }
      }
    };

    // Intercept window.open calls
    const originalWindowOpen = window.open;
    window.open = function(url, target, features) {
      if (url && typeof url === 'string' && url.startsWith('http')) {
        console.log('[Native] Blocked window.open:', url);
        return null;
      }
      return originalWindowOpen.call(window, url, target, features);
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.open = originalWindowOpen;
    };
  }, []);
};
