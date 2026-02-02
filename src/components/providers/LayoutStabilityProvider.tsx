import React, { createContext, useContext, ReactNode } from 'react';
import { useLayoutStability, LayoutStabilityOptions } from '@/hooks/useLayoutStability';
import { LayoutDebugger } from '@/components/ui/layout-debugger';

interface LayoutStabilityContextType {
  isLayoutLocked: boolean;
  breakpoint: string;
  lockLayout: () => void;
  unlockLayout: () => void;
  toggleDebugMode: () => void;
}

const LayoutStabilityContext = createContext<LayoutStabilityContextType | undefined>(undefined);

interface LayoutStabilityProviderProps {
  children: ReactNode;
  options?: LayoutStabilityOptions;
  showDebugger?: boolean;
}

export const LayoutStabilityProvider: React.FC<LayoutStabilityProviderProps> = ({
  children,
  options = {},
  showDebugger = false
}) => {
  const layoutStability = useLayoutStability(options);

  return (
    <LayoutStabilityContext.Provider value={layoutStability}>
      {children}
      {showDebugger && <LayoutDebugger />}
    </LayoutStabilityContext.Provider>
  );
};

export const useLayoutStabilityContext = () => {
  const context = useContext(LayoutStabilityContext);
  if (context === undefined) {
    throw new Error('useLayoutStabilityContext must be used within a LayoutStabilityProvider');
  }
  return context;
};