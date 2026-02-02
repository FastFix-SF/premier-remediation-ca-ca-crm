import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Satellite, Download, Eye, RefreshCw, MapPin, Calendar, Info, Loader2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useAerialImages, type AerialImage } from "@/hooks/useAerialImages";
import RoofAnalysisViewer from "./RoofAnalysisViewer";
import { format } from 'date-fns';

interface AerialImageryViewerProps {
  quoteRequestId?: string;
  projectId?: string;
  propertyAddress?: string;
  showAcquisitionButton?: boolean;
  hasMeasurements?: boolean;
}

const AerialImageryViewer: React.FC<AerialImageryViewerProps> = ({
  quoteRequestId,
  projectId,
  propertyAddress,
  showAcquisitionButton = true,
  hasMeasurements = false
}) => {
  const [selectedImage, setSelectedImage] = useState<AerialImage | null>(null);
  
const {
  aerialImages,
  isLoading,
  acquireAerialImagery,
  refetch
} = useAerialImages(quoteRequestId, projectId);

const handleAcquireImagery = async () => {
  if (!propertyAddress) return;
  await acquireAerialImagery.mutateAsync({
    quoteRequestId,
    projectId,
    propertyAddress
  });
};

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'google_maps':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResolutionBadgeColor = (resolution: string) => {
    switch (resolution) {
      case 'high':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Aerial Imagery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading aerial imagery...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Aerial Imagery ({aerialImages.length})
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {showAcquisitionButton && propertyAddress && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAcquireImagery}
                disabled={acquireAerialImagery.isPending}
              >
                {acquireAerialImagery.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Satellite className="h-4 w-4" />
                )}
                Acquire Images
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aerialImages.length === 0 ? (
          <div className="text-center py-8">
            <Satellite className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No aerial imagery available</p>
            {showAcquisitionButton && propertyAddress && (
              <Button 
                onClick={handleAcquireImagery}
                disabled={acquireAerialImagery.isPending}
              >
                {acquireAerialImagery.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Acquiring Images...
                  </>
                ) : (
                  <>
                    <Satellite className="h-4 w-4 mr-2" />
                    Acquire Aerial Images
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aerialImages.map((image) => (
                <div key={image.id} className="border rounded-lg overflow-hidden">
                  <div className="relative aspect-square">
                    <OptimizedImage
                      src={image.image_url}
                      alt={`Aerial view of ${image.property_address}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSourceBadgeColor(image.api_source)}`}
                      >
                        Google Maps
                      </Badge>
                      {image.resolution && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getResolutionBadgeColor(image.resolution)}`}
                        >
                          {image.resolution}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{image.image_type}</span>
                      <span>{image.angle}</span>
                    </div>
                    {image.capture_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(image.capture_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedImage(image)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(image.image_url, '_blank')}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    
{/* Roof Analysis Section (projects only) */}
<div className="mt-3 pt-3 border-t">
  {projectId ? (
    <RoofAnalysisViewer
      aerialImageId={image.id}
      imageUrl={image.image_url}
      propertyAddress={image.property_address}
      projectId={projectId}
      onAnalysisUpdate={() => refetch()}
    />
  ) : hasMeasurements ? (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="h-3 w-3 mt-0.5" />
      Measurements are already saved for this request.
    </div>
  ) : (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="h-3 w-3 mt-0.5" />
      AI measurements are available after this request becomes a project.
    </div>
  )}
</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full-size image viewer */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5" />
                  Aerial Imagery Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video">
                  <OptimizedImage
                    src={selectedImage.image_url}
                    alt={`Aerial view of ${selectedImage.property_address}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Image Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Source:</strong> Google Maps</div>
                      <div><strong>Type:</strong> {selectedImage.image_type}</div>
                      <div><strong>Resolution:</strong> {selectedImage.resolution || 'Not specified'}</div>
                      <div><strong>Angle:</strong> {selectedImage.angle || 'Not specified'}</div>
                      {selectedImage.zoom_level && (
                        <div><strong>Zoom Level:</strong> {selectedImage.zoom_level}</div>
                      )}
                      {selectedImage.image_quality_score && (
                        <div><strong>Quality Score:</strong> {selectedImage.image_quality_score}/100</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Location & Timing</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedImage.property_address}
                      </div>
                      {selectedImage.latitude && selectedImage.longitude && (
                        <div><strong>Coordinates:</strong> {selectedImage.latitude}, {selectedImage.longitude}</div>
                      )}
                      {selectedImage.capture_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Captured: {format(new Date(selectedImage.capture_date), 'MMMM dd, yyyy')}
                        </div>
                      )}
                      <div>
                        <strong>Acquired:</strong> {format(new Date(selectedImage.created_at), 'MMMM dd, yyyy \'at\' h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default AerialImageryViewer;