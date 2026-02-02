# Photo Storage System Implementation Guide

This guide provides step-by-step instructions to replicate the high-performance photo storage system from the RoofingFriend project.

## 🏗️ System Overview

The photo system consists of:
- **Database Layer**: Supabase tables with RLS policies
- **Storage Layer**: Supabase Storage with compression
- **Hook System**: React Query-powered data management
- **Component Layer**: Upload, display, and management components
- **Optimization**: Image compression and progressive loading

## 📋 Prerequisites

- Supabase project setup
- React Query configured
- Tailwind CSS configured
- Modern React project with TypeScript

---

## 1. Database Setup

### 1.1 Create Storage Bucket

```sql
-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true);

-- Create RLS policies for storage
CREATE POLICY "Admins can manage all files" ON storage.objects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Public can view project photos" ON storage.objects
FOR SELECT USING (bucket_id = 'project-photos');
```

### 1.2 Create Photos Table

```sql
-- Create project_photos table
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_visible_to_customer BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0,
  photo_tag TEXT CHECK (photo_tag IN ('before', 'after')),
  is_highlighted_before BOOLEAN DEFAULT false,
  is_highlighted_after BOOLEAN DEFAULT false,
  file_size BIGINT DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_project_photos_project_id ON project_photos(project_id);
CREATE INDEX idx_project_photos_tag ON project_photos(photo_tag);
CREATE INDEX idx_project_photos_visible ON project_photos(is_visible_to_customer);

-- Enable RLS
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
```

### 1.3 RLS Policies

```sql
-- Admins can manage all photos
CREATE POLICY "Admins can manage all project photos" 
ON public.project_photos FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Customers can view tagged visible photos
CREATE POLICY "Customers can view tagged visible project photos" 
ON public.project_photos FOR SELECT 
USING (
  photo_tag IS NOT NULL 
  AND is_visible_to_customer = true 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_photos.project_id 
    AND customer_email = auth.email()
  )
);

-- Public can view photos from public projects
CREATE POLICY "Public can view tagged photos from public projects" 
ON public.project_photos FOR SELECT 
USING (
  photo_tag IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_photos.project_id 
    AND is_public = true
  )
);
```

### 1.4 Database Triggers

```sql
-- Ensure only one highlighted photo per tag per project
CREATE OR REPLACE FUNCTION public.ensure_single_highlight()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear other highlighted before photos
  IF NEW.is_highlighted_before = true AND (OLD.is_highlighted_before IS NULL OR OLD.is_highlighted_before = false) THEN
    UPDATE public.project_photos 
    SET is_highlighted_before = false 
    WHERE project_id = NEW.project_id 
      AND id != NEW.id 
      AND is_highlighted_before = true;
  END IF;
  
  -- Clear other highlighted after photos
  IF NEW.is_highlighted_after = true AND (OLD.is_highlighted_after IS NULL OR OLD.is_highlighted_after = false) THEN
    UPDATE public.project_photos 
    SET is_highlighted_after = false 
    WHERE project_id = NEW.project_id 
      AND id != NEW.id 
      AND is_highlighted_after = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_highlight
  BEFORE UPDATE ON public.project_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_highlight();
```

---

## 2. Image Optimization Utilities

### 2.1 Create Image Optimization Utils

```typescript
// src/utils/imageOptimization.ts
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
```

---

## 3. Hook System

### 3.1 Photo Upload Hook

```typescript
// src/hooks/usePhotoUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { compressImage } from '@/utils/imageOptimization'

export const usePhotoUpload = () => {
  const queryClient = useQueryClient()

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      // Get photo details first
      const { data: photo, error: fetchError } = await supabase
        .from('project_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Delete from storage
      if (photo.photo_url) {
        const urlParts = photo.photo_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const projectFolder = urlParts[urlParts.length - 2]
        const filePath = `projects/${projectFolder}/${fileName}`
        
        await supabase.storage
          .from('project-photos')
          .remove([filePath])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      toast.success('Photo deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  })

  const uploadPhoto = useMutation({
    mutationFn: async ({ projectId, file }: {
      projectId: string
      file: File
    }) => {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('User not authenticated')

      // Compress image
      const compressedFile = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8
      })

      // Create unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = compressedFile.name.split('.').pop() || 'jpg'
      const fileName = `project_${projectId}_${timestamp}_${randomString}.${fileExtension}`
      const filePath = `projects/${projectId}/${fileName}`

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath)

      // Save to database
      const { error: dbError } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          photo_url: publicUrl,
          is_visible_to_customer: false,
          uploaded_by: user.data.user.id,
          display_order: 0,
          photo_tag: null,
          is_highlighted_before: false,
          is_highlighted_after: false,
          file_size: compressedFile.size
        })

      if (dbError) {
        // Clean up uploaded file on database error
        await supabase.storage
          .from('project-photos')
          .remove([filePath])
        throw dbError
      }

      return { originalSize: file.size, compressedSize: compressedFile.size }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      queryClient.invalidateQueries({ queryKey: ['storage-metrics'] })
      
      const originalSize = (data.originalSize / 1024 / 1024).toFixed(1)
      const compressedSize = (data.compressedSize / 1024 / 1024).toFixed(1)
      
      toast.success(`Photo uploaded! Compressed from ${originalSize} MB to ${compressedSize} MB`)
    },
    onError: (error) => {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return {
    deletePhoto,
    uploadPhoto
  }
}
```

### 3.2 Storage Monitoring Hook

```typescript
// src/hooks/useStorageMonitoring.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface StorageMetrics {
  totalPhotos: number
  totalSizeBytes: number
  totalSizeMB: number
  photosByProject: Record<string, number>
  recentUploads: number
  avgPhotoSize: number
}

export const useStorageMonitoring = () => {
  const getStorageMetrics = useQuery({
    queryKey: ['storage-metrics'],
    queryFn: async (): Promise<StorageMetrics> => {
      try {
        // Get all photos with project info
        const { data: photos, error } = await supabase
          .from('project_photos')
          .select('project_id, uploaded_at, file_size')

        if (error) throw error

        // Calculate metrics
        const totalSizeBytes = photos?.reduce((acc, photo) => acc + (photo.file_size || 0), 0) || 0
        const totalSizeMB = totalSizeBytes / (1024 * 1024)
        
        const photosByProject = photos?.reduce((acc, photo) => {
          acc[photo.project_id] = (acc[photo.project_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const recentUploads = photos?.filter(photo => 
          new Date(photo.uploaded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0

        const avgPhotoSize = totalSizeBytes / (photos?.length || 1)

        return {
          totalPhotos: photos?.length || 0,
          totalSizeBytes,
          totalSizeMB: Math.round(totalSizeMB * 100) / 100,
          photosByProject,
          recentUploads,
          avgPhotoSize: Math.round(avgPhotoSize / 1024) // KB
        }
      } catch (error) {
        console.error('Storage monitoring error:', error)
        throw error
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider stale after 2 minutes
  })

  return {
    metrics: getStorageMetrics.data,
    isLoading: getStorageMetrics.isLoading,
    error: getStorageMetrics.error,
    refetch: getStorageMetrics.refetch
  }
}
```

### 3.3 Photo Management Hook

```typescript
// src/hooks/usePhotoManagement.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const usePhotoManagement = () => {
  const queryClient = useQueryClient()

  const updatePhotoVisibility = useMutation({
    mutationFn: async ({ 
      photoId, 
      isPublic, 
      adminNotes 
    }: { 
      photoId: string
      isPublic: boolean
      adminNotes?: string 
    }) => {
      const { error } = await supabase
        .from('project_photos')
        .update({ 
          is_visible_to_customer: isPublic,
          caption: adminNotes
        })
        .eq('id', photoId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      toast.success('Photo visibility updated')
    },
    onError: (error) => {
      console.error('Error updating photo visibility:', error)
      toast.error('Failed to update photo visibility')
    }
  })

  const bulkUpdatePhotos = useMutation({
    mutationFn: async ({ 
      photoIds, 
      isPublic 
    }: { 
      photoIds: string[]
      isPublic: boolean 
    }) => {
      const { error } = await supabase
        .from('project_photos')
        .update({ 
          is_visible_to_customer: isPublic
        })
        .in('id', photoIds)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-photos'] })
      toast.success('Photos updated successfully')
    },
    onError: (error) => {
      console.error('Error bulk updating photos:', error)
      toast.error('Failed to update photos')
    }
  })

  return {
    updatePhotoVisibility,
    bulkUpdatePhotos
  }
}
```

---

## 4. Optimized Image Component

### 4.1 OptimizedImage Component

```typescript
// src/components/ui/optimized-image.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
}

const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    priority = false,
    quality = 75,
    sizes = '100vw',
    className,
    containerClassName,
    placeholder = 'blur',
    onLoad,
    onError,
    ...props
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
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
          rootMargin: '50px',
          threshold: 0.1,
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [priority, isInView]);

    // Generate responsive srcSet for different screen sizes
    const generateSrcSet = (originalSrc: string) => {
      const widths = [320, 640, 768, 1024, 1280, 1600];
      
      // For Supabase storage, we can use transform parameters
      if (originalSrc.includes('/storage/v1/object/')) {
        return widths
          .map(width => `${originalSrc}?width=${width}&quality=${quality} ${width}w`)
          .join(', ');
      }
      
      // For other images, use the original
      return `${originalSrc} 1x`;
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
          'relative overflow-hidden',
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
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              hasError && 'opacity-50',
              className
            )}
            {...props}
          />
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
```

---

## 5. Photo Upload Component

### 5.1 Basic Photo Upload Component

```typescript
// src/components/PhotoUpload.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { validateImageFile } from '@/utils/imageOptimization';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface PhotoUploadProps {
  projectId: string;
  onPhotoUploaded?: () => void;
}

interface UploadingPhoto {
  id: string;
  file: File;
  progress: number;
  error?: string;
  preview: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ projectId, onPhotoUploaded }) => {
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const { uploadPhoto } = usePhotoUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => validateImageFile(file));

    validFiles.forEach(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      const uploadingPhoto: UploadingPhoto = {
        id,
        file,
        progress: 0,
        preview
      };

      setUploadingPhotos(prev => [...prev, uploadingPhoto]);
      
      // Start upload
      uploadPhoto.mutate(
        { projectId, file },
        {
          onSuccess: () => {
            setUploadingPhotos(prev => prev.filter(p => p.id !== id));
            onPhotoUploaded?.();
          },
          onError: (error) => {
            setUploadingPhotos(prev => 
              prev.map(p => 
                p.id === id 
                  ? { ...p, error: error.message, progress: 0 }
                  : p
              )
            );
          }
        }
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Photos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Upload Photos</h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your photos here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="photo-upload"
          />
          <Button asChild>
            <label htmlFor="photo-upload" className="cursor-pointer">
              Select Photos
            </label>
          </Button>
        </div>

        {/* Uploading Photos */}
        {uploadingPhotos.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Uploading...</h4>
            {uploadingPhotos.map((photo) => (
              <div key={photo.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <OptimizedImage
                  src={photo.preview}
                  alt="Uploading"
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{photo.file.name}</p>
                  {photo.error ? (
                    <p className="text-sm text-red-600">{photo.error}</p>
                  ) : (
                    <Progress value={photo.progress} className="mt-2" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    URL.revokeObjectURL(photo.preview);
                    setUploadingPhotos(prev => prev.filter(p => p.id !== photo.id));
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;
```

---

## 6. Storage Monitoring Dashboard

### 6.1 Storage Metrics Component

```typescript
// src/components/StorageMonitoringDashboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Database, Image, TrendingUp } from 'lucide-react';
import { useStorageMonitoring } from '@/hooks/useStorageMonitoring';

const StorageMonitoringDashboard: React.FC = () => {
  const { metrics, isLoading, error, refetch } = useStorageMonitoring();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load storage metrics</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const storageUsagePercent = Math.min((metrics.totalSizeMB / 1000) * 100, 100); // Assume 1GB limit
  
  const getStorageColor = (percent: number) => {
    if (percent < 70) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Storage Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPhotos.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSizeMB} MB</div>
            <div className="flex items-center mt-2">
              <Progress value={storageUsagePercent} className="flex-1 mr-2" />
              <Badge variant={storageUsagePercent > 80 ? 'destructive' : 'secondary'}>
                {storageUsagePercent.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Photo Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgPhotoSize} KB</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentUploads}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects by Photo Count */}
      <Card>
        <CardHeader>
          <CardTitle>Top Projects by Photo Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.photosByProject)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([projectId, count]) => (
                <div key={projectId} className="flex justify-between items-center py-2">
                  <span className="text-sm truncate">Project {projectId.slice(0, 8)}...</span>
                  <Badge variant="secondary">{count} photos</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {storageUsagePercent > 80 && (
        <Alert>
          <AlertDescription>
            Storage usage is high ({storageUsagePercent.toFixed(1)}%). Consider cleaning up old photos or upgrading storage.
          </AlertDescription>
        </Alert>
      )}

      {metrics.recentUploads > 50 && (
        <Alert>
          <AlertDescription>
            High upload activity detected ({metrics.recentUploads} uploads in 24 hours). Monitor storage usage closely.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default StorageMonitoringDashboard;
```

---

## 7. Performance Optimization Tips

### 7.1 React Query Configuration

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
    },
    mutations: {
      retry: false,
    },
  },
})
```

### 7.2 Image Preloading Hook

```typescript
// src/hooks/useImagePreloader.ts
import { useEffect } from 'react'

export const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    const imagePromises = urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
    })

    Promise.allSettled(imagePromises).then(results => {
      const successful = results.filter(result => result.status === 'fulfilled').length
      console.log(`Preloaded ${successful}/${urls.length} images`)
    })
  }, [urls])
}
```

---

## 8. Critical Success Factors

### 8.1 Performance Checklist

- ✅ **Image Compression**: Always compress images before upload
- ✅ **Lazy Loading**: Use intersection observer for images
- ✅ **Caching Strategy**: Implement proper React Query caching
- ✅ **Error Boundaries**: Handle upload failures gracefully
- ✅ **Progress Feedback**: Show upload progress to users
- ✅ **Cleanup**: Remove temporary URLs and failed uploads

### 8.2 Security Considerations

- ✅ **File Validation**: Validate file types and sizes
- ✅ **RLS Policies**: Implement proper row-level security
- ✅ **Authentication**: Verify user permissions before uploads
- ✅ **Storage Policies**: Control access to storage buckets
- ✅ **Rate Limiting**: Prevent abuse with upload limits

### 8.3 Cost Optimization

- ✅ **Compression**: Reduce storage costs with image compression
- ✅ **Monitoring**: Track storage usage and costs
- ✅ **Cleanup**: Remove unused photos regularly
- ✅ **CDN**: Use Supabase CDN for fast delivery
- ✅ **Batching**: Batch operations to reduce API calls

---

## 9. Deployment Checklist

### 9.1 Database Migration

```sql
-- Run this migration in production
BEGIN;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true);

-- Create table
CREATE TABLE public.project_photos (
  -- ... (see section 1.2)
);

-- Create indexes
CREATE INDEX idx_project_photos_project_id ON project_photos(project_id);
-- ... (see section 1.2)

-- Enable RLS and create policies
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
-- ... (see section 1.3)

COMMIT;
```

### 9.2 Environment Variables

```env
# No additional environment variables needed
# System uses Supabase client configuration
```

### 9.3 Testing

```typescript
// Test upload functionality
const testUpload = async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  const result = await uploadPhoto.mutateAsync({ projectId: 'test', file })
  console.log('Upload test result:', result)
}
```

---

## 🎉 Conclusion

This system provides:
- **Performance**: Optimized images with lazy loading
- **Scalability**: Efficient database queries and caching
- **User Experience**: Progress feedback and error handling
- **Cost Efficiency**: Image compression and monitoring
- **Security**: Proper authentication and authorization

Copy the code examples and follow the steps in order to replicate this high-performance photo system in your Lovable project.

**Remember**: Test thoroughly in development before deploying to production!