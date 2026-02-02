import React, { useEffect, useState } from 'react';

interface CrosshairOverlayProps {
  isActive: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export const CrosshairOverlay: React.FC<CrosshairOverlayProps> = ({ isActive, containerRef }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // If we have a container reference, check if mouse is within its bounds
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isWithinBounds = 
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        setIsVisible(isWithinBounds);
        return;
      }
      
      // Fallback: check if target is canvas (original behavior)
      const target = e.target as HTMLElement;
      const isOverCanvas = target.closest('.maplibregl-canvas-container') !== null || 
                          target.classList.contains('draw-overlay') ||
                          target.closest('.draw-overlay') !== null;
      setIsVisible(isOverCanvas);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isActive, containerRef]);

  if (!isActive || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Horizontal line */}
      <div
        className="absolute h-0.5 bg-blue-500"
        style={{
          top: position.y,
          left: 0,
          right: 0,
        }}
      />
      {/* Vertical line */}
      <div
        className="absolute w-0.5 bg-blue-500"
        style={{
          left: position.x,
          top: 0,
          bottom: 0,
        }}
      />
      {/* Center dot */}
      <div
        className="absolute w-2 h-2 bg-blue-500 rounded-full"
        style={{
          left: position.x - 4,
          top: position.y - 4,
        }}
      />
    </div>
  );
};
