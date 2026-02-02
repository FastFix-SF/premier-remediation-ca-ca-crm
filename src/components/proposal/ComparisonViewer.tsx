import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Maximize2, 
  RotateCcw, 
  Play, 
  Pause, 
  Eye,
  Layers,
  Upload
} from 'lucide-react';
import { InteractiveComparison } from './InteractiveComparison';
import { ImageFit } from '@/components/ui/ImageFit';
import { StableGrid } from '@/components/ui/stable-grid';
import type { ComparisonBlock, ComparisonViewMode } from '@/types/comparison';

interface ComparisonViewerProps {
  block: ComparisonBlock;
  isEditing?: boolean;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  block,
  isEditing = false
}) => {
  const [viewMode, setViewMode] = useState<ComparisonViewMode>('sideBySide');

  // Get display images - current is always "before", proposed is always "after"
  const beforeImage = block.currentImage;
  const afterImage = block.proposedImage;
  const beforeLabel = 'Current';
  const afterLabel = 'Proposed';

  // Handle missing images
  if (!block.currentImage && !block.proposedImage) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">No Images Yet</h3>
              <p className="text-muted-foreground">
                {isEditing 
                  ? 'Upload Current and Proposed images to create the comparison.'
                  : 'This comparison is being prepared.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!block.currentImage || !block.proposedImage) {
    const missingType = !block.currentImage ? 'Current' : 'Proposed';
    const existingImage = block.currentImage || block.proposedImage;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{block.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{block.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show existing image */}
          <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
            <ImageFit 
              src={existingImage!.photo_url} 
              alt={existingImage === block.currentImage ? 'Current roof' : 'Proposed roof'}
            />
            {block.showBadges && (
              <div className="absolute bottom-4 left-4">
                <Badge className={existingImage === block.currentImage 
                  ? "bg-gray-600 text-white" 
                  : "bg-blue-600 text-white"
                }>
                  {existingImage === block.currentImage ? 'Current' : 'Proposed'}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Missing image notice */}
          <div className="text-center py-8 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              {isEditing 
                ? `${missingType} image needed to complete the comparison`
                : `${missingType} image will be added soon`
              }
            </p>
          </div>

          {/* Notes */}
          {block.notes && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {block.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base">{block.title}</h3>
              {block.quoteAmount && (
                <span className="text-lg font-bold text-primary">
                  ${block.quoteAmount.toLocaleString()}
                </span>
              )}
            </div>
            {block.subtitle && (
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {block.subtitle}
              </p>
            )}
            {block.quoteOptionName && (
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {block.quoteOptionName}
              </p>
            )}
          </div>
          
          
          {/* View Mode Controls */}
          <div className="flex items-center gap-1">
            <div className="flex bg-muted rounded-md p-0.5">
              <Button
                variant={viewMode === 'sideBySide' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('sideBySide')}
                className="text-xs px-1.5 py-0.5 h-6"
              >
                Side
              </Button>
              <Button
                variant={viewMode === 'fade' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('fade')}
                className="text-xs px-1.5 py-0.5 h-6"
              >
                Fade
              </Button>
              <Button
                variant={viewMode === 'slider' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('slider')}
                className="text-xs px-1.5 py-0.5 h-6"
              >
                Slider
              </Button>
            </div>

            {/* Fullscreen */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-full h-full p-6">
                <div className="w-full h-[80vh]">
                  <InteractiveComparison
                    beforeImage={beforeImage!.photo_url}
                    afterImage={afterImage!.photo_url}
                    beforeLabel={beforeLabel}
                    afterLabel={afterLabel}
                    viewMode={viewMode}
                    showBadges={block.showBadges}
                    beforeCaption={block.currentCaption}
                    afterCaption={block.proposedCaption}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-1 pt-1">
        {/* Interactive Comparison */}
        <InteractiveComparison
          beforeImage={beforeImage.photo_url}
          afterImage={afterImage.photo_url}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          viewMode={viewMode}
          showBadges={block.showBadges}
          beforeCaption={block.currentCaption}
          afterCaption={block.proposedCaption}
        />

        {/* Notes */}
        {block.notes && (
          <div className="bg-muted/30 rounded-lg p-2">
            <h4 className="font-medium mb-1 text-xs">Project Notes</h4>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {block.notes}
            </p>
          </div>
        )}

        {/* Instructions */}
        {viewMode === 'slider' && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Drag the slider or use the controls above to see the transformation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};