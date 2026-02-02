import { useEffect, useState } from 'react';

interface UseImagePreloaderOptions {
  urls: string[];
  priority?: boolean;
}

interface PreloadState {
  loaded: boolean;
  loadedUrls: Set<string>;
  progress: number;
}

export const useImagePreloader = ({ urls, priority = false }: UseImagePreloaderOptions) => {
  const [state, setState] = useState<PreloadState>({
    loaded: false,
    loadedUrls: new Set(),
    progress: 0,
  });

  useEffect(() => {
    if (!urls.length) return;

    let loadedCount = 0;
    const loadedUrls = new Set<string>();

    const preloadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          loadedCount++;
          loadedUrls.add(url);
          
          setState(prev => ({
            ...prev,
            loadedUrls: new Set(loadedUrls),
            progress: (loadedCount / urls.length) * 100,
            loaded: loadedCount === urls.length,
          }));
          
          resolve();
        };
        
        img.onerror = () => {
          loadedCount++;
          
          setState(prev => ({
            ...prev,
            progress: (loadedCount / urls.length) * 100,
            loaded: loadedCount === urls.length,
          }));
          
          reject(new Error(`Failed to load image: ${url}`));
        };
        
        img.src = url;
      });
    };

    // Preload images
    const preloadPromises = urls.map(url => preloadImage(url));
    
    // If priority is true, preload immediately
    // Otherwise, wait a bit to not block other critical resources
    const delay = priority ? 0 : 100;
    
    const timer = setTimeout(() => {
      Promise.allSettled(preloadPromises);
    }, delay);

    return () => clearTimeout(timer);
  }, [urls, priority]);

  return state;
};
