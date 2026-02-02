import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    priority = false,
    quality = 60,
    sizes = '100vw',
    className,
    containerClassName,
    placeholder = 'blur',
    onLoad,
    onError,
    onDelete,
    showDelete = false,
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading - more aggressive for better performance
    useEffect(() => {
      if (priority || isInView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '200px', // Load earlier for smoother experience
          threshold: 0.01,
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [priority, isInView]);

    // Generate responsive srcSet for different screen sizes
    const generateSrcSet = (originalSrc: string) => {
      const widths = priority ? [640, 1024, 1600] : [320, 640, 1024];
      
      // For Supabase storage, we can use transform parameters
      if (originalSrc.includes('/storage/v1/object/')) {
        return widths
          .map(width => `${originalSrc}?width=${width}&quality=${priority ? 75 : quality} ${width}w`)
          .join(', ');
      }
      
      // For lovable-uploads and other images, use the original but indicate preferred widths
      // This helps browsers make better decisions about which image to request
      return `${originalSrc} 1x`;
    };
    
    // Generate WebP version if supported
    const getWebPSrc = (originalSrc: string) => {
      if (originalSrc.includes('/storage/v1/object/')) {
        return `${originalSrc}?format=webp&quality=${quality}`;
      }
      // For lovable-uploads, browsers will handle format negotiation
      return originalSrc;
    };
    
    // Get optimized src (fallback to original for now)
    const getOptimizedSrc = (originalSrc: string, width?: number) => {
      return originalSrc;
    };

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden group',
          containerClassName
        )}
      >
        {/* Placeholder */}
        {!isLoaded && !hasError && placeholder === 'blur' && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Image */}
        {isInView && (
          <img
            ref={ref || imgRef}
            src={src}
            alt={alt}
            srcSet={generateSrcSet(src)}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-200',
              isLoaded ? 'opacity-100' : 'opacity-0',
              hasError && 'opacity-50',
              className
            )}
            {...props}
          />
        )}

        {/* Delete button */}
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg border-2 border-background flex items-center justify-center z-50 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete image"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
            Failed to load image
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };