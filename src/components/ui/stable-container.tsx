import React from 'react';
import { cn } from '@/lib/utils';

interface StableContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'default' | 'proposals' | 'admin' | 'mobile';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md', 
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full'
};

const variantClasses = {
  default: 'mx-auto px-4 sm:px-6 lg:px-8',
  proposals: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl',
  admin: 'mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  mobile: 'px-4 max-w-full'
};

export const StableContainer: React.FC<StableContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
  variant = 'default'
}) => {
  return (
    <div 
      className={cn(
        'w-full layout-lock',
        maxWidthClasses[maxWidth],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};