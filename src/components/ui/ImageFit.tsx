import React from 'react';
import { OptimizedImage } from './optimized-image';

export type ImageFitMode = 'contain' | 'cover';

type BaseImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> & {
  onLoad?: () => void;
  onError?: () => void;
};

interface ImageFitProps extends BaseImgProps {
  src: string;
  alt: string;
  mode?: ImageFitMode; // default 'contain' for lightbox and comparisons
  className?: string;
  wrapperClassName?: string;
}

export function ImageFit({
  src,
  alt,
  mode = 'contain',
  className = '',
  wrapperClassName = '',
  loading,
  decoding,
  style,
  ...rest
}: ImageFitProps) {
  const fitClass = mode === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div className={`relative w-full h-full ${wrapperClassName}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        loading={(loading as any) ?? 'lazy'}
        decoding={(decoding as any) ?? 'async'}
        className={`w-full h-full ${fitClass} [image-orientation:from-image] ${className}`}
        style={{ maxWidth: '100%', maxHeight: '100%', ...(style || {}) }}
        {...rest}
      />
    </div>
  );
}
