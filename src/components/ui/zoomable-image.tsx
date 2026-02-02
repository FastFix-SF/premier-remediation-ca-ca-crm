import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  minZoom?: number;
  maxZoom?: number;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  minZoom = 1,
  maxZoom = 4,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const clampPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (!containerRef.current || !imageRef.current) return { x, y };
    
    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    const scaledWidth = image.width * currentScale / scale;
    const scaledHeight = image.height * currentScale / scale;
    
    const maxX = Math.max(0, (scaledWidth - container.width) / 2);
    const maxY = Math.max(0, (scaledHeight - container.height) / 2);
    
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [scale]);

  const handleDoubleTap = useCallback((clientX: number, clientY: number) => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      const newScale = 2.5;
      setScale(newScale);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tapX = clientX - rect.left;
        const tapY = clientY - rect.top;
        
        const offsetX = (centerX - tapX) * (newScale - 1) / newScale;
        const offsetY = (centerY - tapY) * (newScale - 1) / newScale;
        
        setPosition(clampPosition(offsetX, offsetY, newScale));
      }
    }
  }, [scale, clampPosition]);

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastPinchDistanceRef.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1) {
      const now = Date.now();
      const touch = e.touches[0];
      
      if (now - lastTapRef.current < 300) {
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        
        if (scale > 1) {
          lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
          dragStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            posX: position.x,
            posY: position.y
          };
          setIsDragging(true);
        }
      }
    }
  }, [scale, position, handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastPinchDistanceRef.current !== null) {
        const delta = distance / lastPinchDistanceRef.current;
        const newScale = Math.min(maxZoom, Math.max(minZoom, scale * delta));
        
        setScale(newScale);
        
        if (newScale <= 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
      
      lastPinchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && isDragging && dragStartRef.current && scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      
      const newPos = clampPosition(
        dragStartRef.current.posX + deltaX,
        dragStartRef.current.posY + deltaY,
        scale
      );
      
      setPosition(newPos);
    }
  }, [scale, isDragging, minZoom, maxZoom, clampPosition]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    lastPinchDistanceRef.current = null;
    lastTouchRef.current = null;
    dragStartRef.current = null;
    setIsDragging(false);
    
    if (scale < 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Mouse handlers for desktop zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(maxZoom, Math.max(minZoom, scale * delta));
    
    setScale(newScale);
    
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      setPosition(clampPosition(position.x, position.y, newScale));
    }
  }, [scale, position, minZoom, maxZoom, clampPosition]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    handleDoubleTap(e.clientX, e.clientY);
  }, [handleDoubleTap]);

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y
      };
      setIsDragging(true);
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStartRef.current && scale > 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newPos = clampPosition(
        dragStartRef.current.posX + deltaX,
        dragStartRef.current.posY + deltaY,
        scale
      );
      
      setPosition(newPos);
    }
  }, [isDragging, scale, clampPosition]);

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden touch-none select-none",
        containerClassName
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={cn(
          "transition-transform duration-100 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        }}
        draggable={false}
      />
      
      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};
