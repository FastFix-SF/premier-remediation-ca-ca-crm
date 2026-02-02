import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Image, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Validation schema
export const brandingSchema = z.object({
  logo_url: z.string().optional(),
  logo_dark_url: z.string().optional(),
  favicon_url: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().or(z.literal('')),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().or(z.literal('')),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().or(z.literal('')),
  hero_image_url: z.string().optional(),
  hero_video_url: z.string().optional(),
});

export type BrandingFormData = z.infer<typeof brandingSchema>;

interface BrandingFormProps {
  tenantId?: string;
  defaultValues?: Partial<BrandingFormData>;
  onSubmit: (data: BrandingFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
}

// Color extraction from image
const extractDominantColors = async (imageUrl: string): Promise<{ primary: string; secondary: string; accent: string } | null> => {
  try {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple color extraction - get average of top, middle, and accent regions
        const colors: { r: number; g: number; b: number }[] = [];

        for (let i = 0; i < data.length; i += 4 * 10) {
          colors.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }

        // Sort by brightness and pick distinct colors
        const sortedColors = colors.sort((a, b) => {
          const brightnessA = (a.r * 299 + a.g * 587 + a.b * 114) / 1000;
          const brightnessB = (b.r * 299 + b.g * 587 + b.b * 114) / 1000;
          return brightnessA - brightnessB;
        });

        const toHex = (c: { r: number; g: number; b: number }) =>
          '#' + [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('');

        const primary = sortedColors[Math.floor(sortedColors.length * 0.3)];
        const secondary = sortedColors[Math.floor(sortedColors.length * 0.6)];
        const accent = sortedColors[Math.floor(sortedColors.length * 0.8)];

        resolve({
          primary: toHex(primary),
          secondary: toHex(secondary),
          accent: toHex(accent),
        });
      };

      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  } catch {
    return null;
  }
};

interface ImageUploadFieldProps {
  label: string;
  value: string | undefined;
  onChange: (url: string) => void;
  tenantId?: string;
  bucket?: string;
  path?: string;
  description?: string;
  onUploadComplete?: (url: string) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  tenantId,
  bucket = 'tenant-assets',
  path = 'logos',
  description,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId || 'temp'}/${path}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      onUploadComplete?.(publicUrl);

      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className="h-20 w-20 object-contain rounded border bg-muted"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center bg-muted">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </span>
            </Button>
          </label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ColorPickerFieldProps {
  label: string;
  value: string | undefined;
  onChange: (color: string) => void;
  description?: string;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 rounded border cursor-pointer"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-28"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export const BrandingForm: React.FC<BrandingFormProps> = ({
  tenantId,
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
}) => {
  const { toast } = useToast();

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo_url: '',
      logo_dark_url: '',
      favicon_url: '',
      primary_color: '',
      secondary_color: '',
      accent_color: '',
      hero_image_url: '',
      hero_video_url: '',
      ...defaultValues,
    },
  });

  const handleLogoUploadComplete = useCallback(async (url: string) => {
    // Extract colors from logo
    const colors = await extractDominantColors(url);
    if (colors) {
      form.setValue('primary_color', colors.primary);
      form.setValue('secondary_color', colors.secondary);
      form.setValue('accent_color', colors.accent);
      toast({
        title: 'Colors extracted',
        description: 'Brand colors have been automatically extracted from your logo.',
      });
    }
  }, [form, toast]);

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5" />
            <span>Logos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadField
                    label="Primary Logo"
                    value={field.value}
                    onChange={field.onChange}
                    tenantId={tenantId}
                    path="logos"
                    description="Used on light backgrounds"
                    onUploadComplete={handleLogoUploadComplete}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_dark_url"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadField
                    label="Dark Mode Logo"
                    value={field.value}
                    onChange={field.onChange}
                    tenantId={tenantId}
                    path="logos"
                    description="Used on dark backgrounds"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favicon_url"
              render={({ field }) => (
                <FormItem>
                  <ImageUploadField
                    label="Favicon"
                    value={field.value}
                    onChange={field.onChange}
                    tenantId={tenantId}
                    path="favicons"
                    description="32x32 or 64x64 recommended"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Palette className="h-5 w-5" />
            <span>Brand Colors</span>
          </div>
          <FormDescription>
            Colors are automatically extracted when you upload a logo. You can also set them manually.
          </FormDescription>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <ColorPickerField
                    label="Primary Color"
                    value={field.value}
                    onChange={field.onChange}
                    description="Main brand color"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondary_color"
              render={({ field }) => (
                <FormItem>
                  <ColorPickerField
                    label="Secondary Color"
                    value={field.value}
                    onChange={field.onChange}
                    description="Supporting color"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accent_color"
              render={({ field }) => (
                <FormItem>
                  <ColorPickerField
                    label="Accent Color"
                    value={field.value}
                    onChange={field.onChange}
                    description="Highlight color for CTAs"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Hero Media */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Image className="h-5 w-5" />
            <span>Hero Section</span>
          </div>

          <FormField
            control={form.control}
            name="hero_image_url"
            render={({ field }) => (
              <FormItem>
                <ImageUploadField
                  label="Hero Image"
                  value={field.value}
                  onChange={field.onChange}
                  tenantId={tenantId}
                  path="hero"
                  description="Recommended size: 1920x1080"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hero_video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero Video URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/video.mp4"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional video URL for hero section (MP4 format recommended)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Setup</CardTitle>
        <CardDescription>
          Upload your logo and set your brand colors. Colors are automatically extracted from your logo.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
