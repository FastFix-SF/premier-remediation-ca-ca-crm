import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { useOptimizedDrag } from '@/hooks/useOptimizedDrag';
import { ImageFit } from '@/components/ui/ImageFit';

interface InteractiveComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  viewMode?: 'slider' | 'sideBySide' | 'fade';
  showBadges?: boolean;
  beforeCaption?: string;
  afterCaption?: string;
}

export const InteractiveComparison: React.FC<InteractiveComparisonProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  viewMode = 'sideBySide',
  showBadges = true,
  beforeCaption,
  afterCaption
}) => {
  const [comparePosition, setComparePosition] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeSliderRef = useRef<HTMLDivElement>(null);

  const { 
    createMouseDragHandler, 
    createTouchDragHandler
  } = useOptimizedDrag();

  const handleMouseDownEvent = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      createMouseDragHandler(containerRef.current, setComparePosition);
    }
  }, [createMouseDragHandler]);

  const handleFadeSliderDrag = useCallback((e: React.MouseEvent) => {
    if (fadeSliderRef.current) {
      createMouseDragHandler(fadeSliderRef.current, setFadeOpacity);
    }
  }, [createMouseDragHandler]);

  const containerClass = "w-full h-[500px]";

  if (viewMode === 'sideBySide') {
    return (
      <div className={`${containerClass} flex rounded-lg overflow-hidden`}>
        <div className="flex-1 relative">
          <ImageFit src={beforeImage} alt={beforeLabel} mode="cover" />
          {showBadges && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-blue-500 text-white">
                {beforeLabel}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <ImageFit src={afterImage} alt={afterLabel} mode="cover" />
          {showBadges && (
            <div className="absolute bottom-4 right-4">
              <Badge className="bg-green-500 text-white">
                {afterLabel}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'fade') {
    return (
      <div className={`${containerClass} relative rounded-lg overflow-hidden bg-muted`}>
        <ImageFit src={beforeImage} alt={beforeLabel} mode="cover" />
        <div 
          className="absolute inset-0 transition-opacity duration-150"
          style={{ opacity: fadeOpacity / 100 }}
        >
          <ImageFit src={afterImage} alt={afterLabel} mode="cover" />
        </div>
        
        {/* Fade Control */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div 
            ref={fadeSliderRef}
            className="bg-black/50 rounded-full px-4 py-2 cursor-col-resize"
            onMouseDown={handleFadeSliderDrag}
            onTouchStart={(e) => {
              if (fadeSliderRef.current) {
                createTouchDragHandler(fadeSliderRef.current, setFadeOpacity);
              }
            }}
          >
            <div className="relative w-40 h-3 bg-white/30 rounded-lg">
              <div 
                className="absolute top-0 left-0 h-3 bg-white rounded-lg transition-none"
                style={{ width: `${fadeOpacity}%` }}
              />
              <div 
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                style={{ left: `${fadeOpacity}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Labels */}
        {showBadges && (
          <>
            <div className="absolute bottom-4 left-4">
              <Badge className={`transition-opacity ${fadeOpacity < 50 ? 'opacity-100' : 'opacity-50'}`}>
                {beforeLabel}
              </Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <Badge className={`transition-opacity ${fadeOpacity > 50 ? 'opacity-100' : 'opacity-50'}`}>
                {afterLabel}
              </Badge>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default slider mode
  return (
    <div 
      ref={containerRef}
      className={`${containerClass} relative overflow-hidden rounded-lg border bg-muted cursor-col-resize select-none`}
      onMouseDown={handleMouseDownEvent}
      onTouchStart={(e) => {
        if (containerRef.current) {
          createTouchDragHandler(containerRef.current, setComparePosition);
        }
      }}
    >
      {/* Before Image (base layer) - current on left */}
      <ImageFit src={beforeImage} alt={beforeLabel} mode="cover" />
      
      {/* After Image (clipped overlay) - proposed on right */}
      <div 
        className="absolute inset-0 overflow-hidden transition-none"
        style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
      >
        <ImageFit src={afterImage} alt={afterLabel} mode="cover" />
      </div>
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
        style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <Layers className="h-4 w-4 text-gray-600" />
        </div>
      </div>
      
      {/* Labels */}
      {showBadges && (
        <>
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-blue-500 text-white shadow-lg">
              {beforeLabel}
            </Badge>
          </div>
          <div className="absolute bottom-4 right-4">
            <Badge className="bg-green-500 text-white shadow-lg">
              {afterLabel}
            </Badge>
          </div>
        </>
      )}

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/50 rounded-full px-3 py-1 text-white text-sm">
          {Math.round(comparePosition)}% Revealed
        </div>
      </div>
    </div>
  );

};