// Mobile development isolation utilities
// These utilities help ensure mobile development doesn't affect web functionality
import React from 'react';

interface IsolationConfig {
  enableMobileFeatures: boolean;
  enableWebFeatures: boolean;
  strictRouteIsolation: boolean;
  developmentMode: boolean;
}

const getIsolationConfig = (): IsolationConfig => {
  const pathname = window.location.pathname;
  const isMobileRoute = pathname.startsWith('/mobile');
  
  return {
    enableMobileFeatures: isMobileRoute,
    enableWebFeatures: !isMobileRoute,
    strictRouteIsolation: true,
    developmentMode: process.env.NODE_ENV === 'development'
  };
};

// Safe component wrapper that prevents cross-contamination
export const withRouteIsolation = <P extends object>(
  Component: React.ComponentType<P>,
  routeType: 'mobile' | 'web'
) => {
  return (props: P) => {
    const config = getIsolationConfig();
    
    if (routeType === 'mobile' && !config.enableMobileFeatures) {
      if (config.developmentMode) {
        console.warn('[Route Isolation] Mobile component blocked on web route');
      }
      return null;
    }
    
    if (routeType === 'web' && !config.enableWebFeatures) {
      if (config.developmentMode) {
        console.warn('[Route Isolation] Web component blocked on mobile route');
      }
      return null;
    }
    
    return React.createElement(Component, props);
  };
};

// Safe hook execution wrapper
export const withHookIsolation = <T>(
  hook: () => T,
  fallback: T,
  routeType: 'mobile' | 'web'
): T => {
  const config = getIsolationConfig();
  
  if (routeType === 'mobile' && !config.enableMobileFeatures) {
    return fallback;
  }
  
  if (routeType === 'web' && !config.enableWebFeatures) {
    return fallback;
  }
  
  return hook();
};

// Development safety checks
export const validateRouteIntegrity = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const config = getIsolationConfig();
  const pathname = window.location.pathname;
  
  // Check for potential route contamination
  const mobileRoutes = ['/mobile'];
  const webRoutes = ['/', '/admin', '/projects', '/store', '/auth'];
  
  const isMobileRoute = mobileRoutes.some(route => pathname.startsWith(route));
  const isWebRoute = webRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  if (isMobileRoute && isWebRoute) {
    console.error('[Route Integrity] Route conflict detected:', pathname);
  }
  
  return {
    routeType: isMobileRoute ? 'mobile' : 'web',
    isValid: !(isMobileRoute && isWebRoute)
  };
};