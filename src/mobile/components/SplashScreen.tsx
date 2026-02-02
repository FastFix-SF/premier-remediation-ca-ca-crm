import React from 'react';

interface SplashScreenProps {
  isVisible: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo">
          <svg 
            viewBox="0 0 100 100" 
            className="w-24 h-24 animate-pulse"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Roof shape */}
            <path 
              d="M50 10L10 45H20V85H80V45H90L50 10Z" 
              fill="white" 
              fillOpacity="0.9"
            />
            {/* Chimney */}
            <rect x="62" y="25" width="10" height="20" fill="white" fillOpacity="0.7" />
          </svg>
        </div>
        
        {/* Brand Name */}
        <h1 className="splash-title">Roofing Friend</h1>
        <p className="splash-subtitle">Employee App</p>
        
        {/* Loading Indicator */}
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
};
