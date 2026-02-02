import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMobileContext } from '@/contexts/MobileContext';

interface MobileAppGuardProps {
  children: React.ReactNode;
  requirePWA?: boolean;
}

export const MobileAppGuard: React.FC<MobileAppGuardProps> = ({ 
  children, 
  requirePWA = false 
}) => {
  const { isMobileRoute, isPWAMode } = useMobileContext();

  // Ensure we're on a mobile route
  if (!isMobileRoute) {
    return <Navigate to="/" replace />;
  }

  // Optionally require PWA mode
  if (requirePWA && !isPWAMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Mobile App Required</h2>
        <p className="text-muted-foreground mb-4">
          This feature requires the app to be installed on your device.
        </p>
        <p className="text-sm text-muted-foreground">
          Please add this app to your home screen to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};