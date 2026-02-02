import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ZoomIn, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedROIPreviewProps {
  roiImageUrl?: string | null;
  cropMeta?: any | null;
  status?: 'idle' | 'processing' | 'ready' | 'error';
  onRegenerateImage?: () => void;
  loading?: boolean;
  className?: string;
}

const EnhancedROIPreview: React.FC<EnhancedROIPreviewProps> = ({
  roiImageUrl,
  cropMeta,
  status = 'idle',
  onRegenerateImage,
  loading = false,
  className = ""
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing': return 'Generating...';
      case 'ready': return 'Ready';
      case 'error': return 'Error';
      default: return 'No image';
    }
  };

  const formatImageMeta = () => {
    if (!cropMeta) return null;
    
    const source = cropMeta.source === 'nearmap' ? 'Nearmap' : 'Mapbox Satellite';
    const resolution = cropMeta.image ? `${cropMeta.image.width}×${cropMeta.image.height}` : '1024×1024';
    const padding = cropMeta.paddingFeet ? `${cropMeta.paddingFeet}ft padding` : '';
    
    return { source, resolution, padding };
  };

  const meta = formatImageMeta();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">ROI Preview</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Image Display */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
          {loading || status === 'processing' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Skeleton className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Generating high-quality ROI image...
                  </div>
                </div>
              </div>
            </div>
          ) : roiImageUrl && !imageError ? (
            <>
              <img
                src={roiImageUrl}
                alt="Roof ROI Preview"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                  toast.error('Failed to load ROI image');
                }}
              />
              {!imageLoading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <ZoomIn className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">ROI Full Preview</h3>
                          {meta && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{meta.source}</Badge>
                              <Badge variant="outline">{meta.resolution}</Badge>
                            </div>
                          )}
                        </div>
                        <img
                          src={roiImageUrl}
                          alt="Roof ROI Full Size"
                          className="w-full rounded-lg border"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                {imageError ? (
                  <>
                    <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
                    <p className="text-sm">Failed to load image</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-lg bg-muted-foreground/10 flex items-center justify-center mx-auto">
                      <ZoomIn className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm">No ROI image generated yet</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Metadata */}
        {meta && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">{meta.source}</Badge>
              <Badge variant="outline" className="text-xs">{meta.resolution}</Badge>
              {meta.padding && (
                <Badge variant="outline" className="text-xs">{meta.padding}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onRegenerateImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateImage}
              disabled={loading || status === 'processing'}
              className="flex-1"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedROIPreview;