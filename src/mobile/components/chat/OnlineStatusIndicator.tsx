import React from 'react';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        border-2 
        border-background 
        ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
        ${isOnline ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );
};