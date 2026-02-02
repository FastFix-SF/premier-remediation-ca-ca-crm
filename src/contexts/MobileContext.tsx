import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isStandalonePWA } from '@/lib/pwa';

interface MobileContextType {
  isMobileRoute: boolean;
  isPWAMode: boolean;
  isMobileApp: boolean;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const location = useLocation();
  
  const isMobileRoute = location.pathname.startsWith('/mobile');
  const isPWAMode = isStandalonePWA();
  const isMobileApp = isMobileRoute && isPWAMode;

  const value = {
    isMobileRoute,
    isPWAMode,
    isMobileApp
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileContext = () => {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
};

// Guard functions for safe mobile development
export const withMobileGuard = <T extends any[]>(
  fn: (...args: T) => any,
  fallback?: (...args: T) => any
) => {
  return (...args: T) => {
    if (typeof window !== 'undefined') {
      const isMobileRoute = window.location.pathname.startsWith('/mobile');
      if (isMobileRoute) {
        return fn(...args);
      }
    }
    return fallback ? fallback(...args) : undefined;
  };
};

export const useMobileGuard = () => {
  const { isMobileRoute } = useMobileContext();
  
  return {
    executeIfMobile: <T extends any[]>(fn: (...args: T) => any) => 
      isMobileRoute ? fn : () => undefined,
    isMobileRoute
  };
};