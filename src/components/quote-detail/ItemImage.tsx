import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface ItemImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function ItemImage({ src, alt, className }: ItemImageProps) {
  const [hasError, setHasError] = useState(false);

  // Show icon if no src provided or if image failed to load
  if (!src || src.trim() === '' || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <OptimizedImage 
      src={src} 
      alt={alt} 
      className={className}
      quality={75}
      sizes="50px"
      onError={() => setHasError(true)}
    />
  );
}
