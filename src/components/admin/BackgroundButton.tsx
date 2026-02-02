import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import BackgroundCustomizer from './BackgroundCustomizer';

interface BackgroundButtonProps {
  currentBackground: React.CSSProperties;
  onBackgroundChange: (background: React.CSSProperties) => void;
  configKey?: string;
  pageTitle?: string;
}

export const BackgroundButton: React.FC<BackgroundButtonProps> = ({
  currentBackground,
  onBackgroundChange,
  configKey,
  pageTitle
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Create a preview style for the button
  const getPreviewStyle = (): React.CSSProperties => {
    if (currentBackground.backgroundImage && currentBackground.backgroundImage.includes('url(')) {
      return {
        backgroundImage: currentBackground.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: currentBackground.background || currentBackground.backgroundColor || 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)'
    };
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 rounded-full border-2 overflow-hidden relative hover:scale-105 transition-transform"
              >
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={getPreviewStyle()}
                />
                {/* Overlay icon for better visibility */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <Palette className="w-3 h-3 text-white" />
                </div>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Customize Background</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize {pageTitle || 'Dashboard'} Background</DialogTitle>
          </DialogHeader>
          <BackgroundCustomizer 
            onBackgroundChange={onBackgroundChange} 
            configKey={configKey}
            pageTitle={pageTitle}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};