import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useMobileContext } from '@/contexts/MobileContext';

interface RouteGuardProps {
  children: React.ReactNode;
  type: 'mobile' | 'web';
  fallbackPath?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  type, 
  fallbackPath = '/' 
}) => {
  const { isMobileRoute } = useMobileContext();
  const location = useLocation();

  // Protect web routes from mobile interference
  if (type === 'web' && isMobileRoute) {
    console.warn(`[RouteGuard] Blocked access to web route ${location.pathname} from mobile context`);
    return <Navigate to={fallbackPath} replace />;
  }

  // Protect mobile routes from web interference
  if (type === 'mobile' && !isMobileRoute) {
    console.warn(`[RouteGuard] Blocked access to mobile route ${location.pathname} from web context`);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// Wrapper components for safe development
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobileRoute } = useMobileContext();
  return isMobileRoute ? <>{children}</> : null;
};

export const WebOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobileRoute } = useMobileContext();
  return !isMobileRoute ? <>{children}</> : null;
};