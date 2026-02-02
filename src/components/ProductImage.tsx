
import React from 'react';
import { OptimizedImage } from './ui/optimized-image';

interface ProductImageProps {
  src: string;
  alt: string;
}

const ProductImage = ({ src, alt }: ProductImageProps) => {
  return (
    <div className="group">
      <div className="bg-muted rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
        <OptimizedImage
          src={src}
          alt={alt}
          className="w-full h-96 lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={70}
          priority={false}
        />
      </div>
    </div>
  );
};

export default ProductImage;
