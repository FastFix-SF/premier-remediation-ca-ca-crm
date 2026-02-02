import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';

interface LayoutDebuggerProps {
  enabled?: boolean;
}

export const LayoutDebugger: React.FC<LayoutDebuggerProps> = ({ 
  enabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(enabled);
  const [showBreakpoint, setShowBreakpoint] = useState(false);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 opacity-50 hover:opacity-100"
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  const toggleDebugLayout = () => {
    document.body.classList.toggle('debug-layout');
    const elements = document.querySelectorAll('.layout-lock, .stable-grid, .stable-container');
    elements.forEach(el => el.classList.toggle('debug-layout'));
  };

  const toggleBreakpointIndicator = () => {
    setShowBreakpoint(!showBreakpoint);
    document.body.classList.toggle('debug-breakpoint');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      <div className="bg-background border rounded-lg p-2 shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Layout Debug</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDebugLayout}
            className="text-xs"
          >
            Toggle Outlines
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBreakpointIndicator}
            className="text-xs"
          >
            Show Breakpoint
          </Button>
        </div>
      </div>
    </div>
  );
};