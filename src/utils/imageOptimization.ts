import { toast } from 'sonner'

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
}

export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'))
            return
          }
          
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.(png|jpg|jpeg)$/i, `.${format}`),
            {
              type: `image/${format}`,
              lastModified: Date.now()
            }
          )
          
          resolve(compressedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 50 * 1024 * 1024 // 50MB
  
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
    return false
  }
  
  if (file.size > maxSize) {
    toast.error('File size must be less than 50MB')
    return false
  }
  
  return true
}

export const getOptimalImageSettings = (fileSize: number) => {
  // Adjust compression based on file size
  if (fileSize > 10 * 1024 * 1024) { // > 10MB
    return { maxWidth: 1600, maxHeight: 900, quality: 0.7 }
  } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return { maxWidth: 1920, maxHeight: 1080, quality: 0.75 }
  } else {
    return { maxWidth: 1920, maxHeight: 1080, quality: 0.85 }
  }
}

// Preload critical images for better performance
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    document.head.appendChild(link);
  });
}

// Generate responsive image URLs for different screen sizes
export const generateResponsiveUrls = (
  baseUrl: string, 
  widths: number[] = [320, 640, 768, 1024, 1280, 1600, 1920]
) => {
  if (baseUrl.includes('/storage/v1/object/')) {
    return widths.map(width => ({
      url: `${baseUrl}?width=${width}&quality=80`,
      width
    }));
  }
  
  return [{ url: baseUrl, width: 1920 }];
}

// Convert image to WebP format if supported
export const getWebPUrl = (originalUrl: string, quality: number = 80) => {
  if (originalUrl.includes('/storage/v1/object/')) {
    return `${originalUrl}?format=webp&quality=${quality}`;
  }
  return originalUrl;
}