import { useCallback, useRef } from 'react';

/**
 * Custom hook to optimize drag operations and prevent forced reflows
 * by caching bounding rect calculations
 */
export const useOptimizedDrag = () => {
  const cachedRectRef = useRef<DOMRect | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const calculatePercentage = useCallback((clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    return Math.max(0, Math.min(100, (x / containerRect.width) * 100));
  }, []);

  const createMouseDragHandler = useCallback((
    container: HTMLElement,
    onUpdate: (percentage: number) => void
  ) => {
    // Cache the rect when drag starts to avoid repeated getBoundingClientRect calls
    cachedRectRef.current = container.getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      if (!cachedRectRef.current) return;
      
      // Use requestAnimationFrame to optimize updates
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        if (cachedRectRef.current) {
          const percentage = calculatePercentage(e.clientX, cachedRectRef.current);
          onUpdate(percentage);
        }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      cachedRectRef.current = null;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [calculatePercentage]);

  const createTouchDragHandler = useCallback((
    container: HTMLElement,
    onUpdate: (percentage: number) => void
  ) => {
    // Cache the rect when drag starts to avoid repeated getBoundingClientRect calls
    cachedRectRef.current = container.getBoundingClientRect();

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!cachedRectRef.current) return;
      
      // Use requestAnimationFrame to optimize updates
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        if (cachedRectRef.current && e.touches[0]) {
          const percentage = calculatePercentage(e.touches[0].clientX, cachedRectRef.current);
          onUpdate(percentage);
        }
      });
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      cachedRectRef.current = null;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [calculatePercentage]);

  const createHoverHandler = useCallback((onUpdate: (percentage: number) => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      if (!e.buttons) return;
      
      // For hover, we still need to get rect, but we can optimize by using RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = calculatePercentage(e.clientX, rect);
        onUpdate(percentage);
      });
    };
  }, [calculatePercentage]);

  return {
    createMouseDragHandler,
    createTouchDragHandler,
    createHoverHandler,
  };
};