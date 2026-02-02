import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Palette, Upload, RefreshCw, Eye, RotateCcw } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface BackgroundCustomizerProps {
  onBackgroundChange: (backgroundStyle: React.CSSProperties) => void;
  configKey?: string;
  pageTitle?: string;
}

const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({ 
  onBackgroundChange, 
  configKey = 'ADMIN_BACKGROUND_STYLE',
  pageTitle = 'admin dashboard'
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<'color' | 'gradient' | 'image'>('gradient');
  const [selectedColor, setSelectedColor] = useState('#1e40af');
  const [selectedGradient, setSelectedGradient] = useState('from-gray-50 to-white');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<React.CSSProperties>({});
  const [sharedBackgrounds, setSharedBackgrounds] = useState<Array<{ imageUrl: string; userId: string }>>([]);
  const { toast } = useToast();

  const presetColors = [
    '#1e40af', '#7c3aed', '#059669', '#dc2626', 
    '#ea580c', '#0891b2', '#9333ea', '#16a34a'
  ];

  const presetGradients = [
    { name: 'Ocean Blue', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Purple Haze', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Default', value: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)' }
  ];

  useEffect(() => {
    if (user) {
      loadCurrentBackground();
      loadSharedBackgrounds();
    }
  }, [user]);

  const loadSharedBackgrounds = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, admin_background_style');

      if (data) {
        const imageBackgrounds = data
          .map(profile => {
            try {
              const style = JSON.parse(profile.admin_background_style);
              const imageUrl = style.backgroundImage?.match(/url\((.*?)\)/)?.[1];
              return imageUrl ? { imageUrl, userId: profile.id } : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Array<{ imageUrl: string; userId: string }>;
        
        // Remove duplicates based on imageUrl
        const uniqueBackgrounds = imageBackgrounds.reduce((acc, curr) => {
          if (!acc.find(item => item.imageUrl === curr.imageUrl)) {
            acc.push(curr);
          }
          return acc;
        }, [] as Array<{ imageUrl: string; userId: string }>);
        
        setSharedBackgrounds(uniqueBackgrounds);
      }
    } catch (error) {
      console.error('Failed to load shared backgrounds:', error);
    }
  };

  const loadCurrentBackground = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('admin_background_style')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.admin_background_style) {
        const backgroundStyle = JSON.parse(data.admin_background_style);
        setCurrentBackground(backgroundStyle);
        onBackgroundChange(backgroundStyle);
      }
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  };

  const saveBackground = async (backgroundStyle: React.CSSProperties) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_background_style: JSON.stringify(backgroundStyle) })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentBackground(backgroundStyle);
      onBackgroundChange(backgroundStyle);
      
      toast({
        title: "Background Applied",
        description: `Your personal background has been updated.`,
      });
    } catch (error) {
      console.error('Failed to save background:', error);
      toast({
        title: "Apply Failed",
        description: "Could not apply background settings.",
        variant: "destructive",
      });
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const backgroundStyle = { backgroundColor: color };
    saveBackground(backgroundStyle);
  };

  const handleGradientChange = (gradient: string) => {
    setSelectedGradient(gradient);
    const backgroundStyle = { background: gradient };
    saveBackground(backgroundStyle);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Sanitize filename by removing spaces and special characters
      const sanitizedName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const fileName = `admin-bg-${Date.now()}-${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setUploadedImage(publicUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Click 'Apply as Background' to use this image.",
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload background image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetToDefault = () => {
    const defaultBackground = { 
      background: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)' 
    };
    saveBackground(defaultBackground);
  };

  const handleRemoveBackground = async (backgroundUserId: string) => {
    if (!user || user.id !== backgroundUserId) return;
    
    try {
      const defaultBackground = { 
        background: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)' 
      };
      
      await supabase
        .from('profiles')
        .update({ admin_background_style: JSON.stringify(defaultBackground) })
        .eq('id', backgroundUserId);
      
      toast({
        title: "Background Removed",
        description: "Your background image has been removed.",
      });
      
      // Reload the shared backgrounds
      loadSharedBackgrounds();
      
      // If this was the current user's background, reset it
      if (user.id === backgroundUserId) {
        setCurrentBackground(defaultBackground);
        onBackgroundChange(defaultBackground);
      }
    } catch (error) {
      console.error('Failed to remove background:', error);
      toast({
        title: "Remove Failed",
        description: "Could not remove background image.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Background Customization
        </CardTitle>
        <CardDescription>
          Customize your personal admin background with colors, gradients, or images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Background Type Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'color' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('color')}
          >
            Solid Color
          </Button>
          <Button
            variant={selectedType === 'gradient' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('gradient')}
          >
            Gradient
          </Button>
          <Button
            variant={selectedType === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('image')}
          >
            Image
          </Button>
        </div>

        {/* Color Selection */}
        {selectedType === 'color' && (
          <div className="space-y-4">
            <Label>Choose a color</Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">Custom color</span>
            </div>
          </div>
        )}

        {/* Gradient Selection */}
        {selectedType === 'gradient' && (
          <div className="space-y-4">
            <Label>Choose a gradient</Label>
            <div className="grid grid-cols-2 gap-3">
              {presetGradients.map((gradient) => (
                <button
                  key={gradient.name}
                  className="h-16 rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform relative overflow-hidden"
                  style={{ background: gradient.value }}
                  onClick={() => handleGradientChange(gradient.value)}
                >
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{gradient.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Upload */}
        {selectedType === 'image' && (
          <div className="space-y-4">
            <Label>Upload background image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="background-upload"
                disabled={isUploading}
              />
              <Label 
                htmlFor="background-upload" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isUploading ? (
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  {isUploading ? 'Uploading...' : 'Click to upload image (max 5MB)'}
                </span>
              </Label>
            </div>
            {uploadedImage && (
              <div className="mt-4 space-y-3">
                <Label className="text-sm font-medium">Preview</Label>
                <img 
                  src={uploadedImage} 
                  alt="Background preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const backgroundStyle = { 
                        backgroundImage: `url(${uploadedImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      };
                      saveBackground(backgroundStyle);
                    }}
                    className="flex-1"
                  >
                    Apply as Background
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setUploadedImage(null)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
            
            {/* Shared Backgrounds Gallery */}
            {sharedBackgrounds.length > 0 && (
              <div className="mt-6 space-y-3">
                <Label className="text-sm font-medium">Backgrounds from other users</Label>
                <div className="grid grid-cols-2 gap-3">
                  {sharedBackgrounds.map((background, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <button
                        className="relative h-24 w-full rounded-lg border-2 border-gray-200 overflow-hidden hover:scale-105 transition-transform"
                        onClick={() => {
                          const backgroundStyle = { 
                            backgroundImage: `url(${background.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          };
                          saveBackground(backgroundStyle);
                        }}
                      >
                        <img 
                          src={background.imageUrl} 
                          alt={`Shared background ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      {user?.id === background.userId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBackground(background.userId);
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetToDefault} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundCustomizer;