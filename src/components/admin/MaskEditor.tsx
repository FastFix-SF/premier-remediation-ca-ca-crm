import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Eraser, Paintbrush, RotateCcw, Download, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface MaskEditorProps {
  imageUrl: string;
  onMaskComplete: (maskDataUrl: string) => void;
  onCancel: () => void;
}

const MaskEditor: React.FC<MaskEditorProps> = ({ imageUrl, onMaskComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMask, setHasMask] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Initialize canvas with proper timing
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) {
      console.log('MaskEditor: Canvas or image not ready for initialization');
      return false;
    }

    // Ensure canvas is in the DOM
    if (!canvas.parentElement) {
      console.log('MaskEditor: Canvas not attached to DOM yet');
      return false;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('MaskEditor: Could not get 2D context from canvas');
      setError('Unable to initialize drawing canvas. Please try refreshing the page.');
      return false;
    }

    try {
      // Calculate canvas size with reasonable limits
      const maxCanvasSize = 1024;
      let canvasWidth = img.naturalWidth;
      let canvasHeight = img.naturalHeight;
      
      if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
        const ratio = Math.min(maxCanvasSize / canvasWidth, maxCanvasSize / canvasHeight);
        canvasWidth = Math.round(canvasWidth * ratio);
        canvasHeight = Math.round(canvasHeight * ratio);
      }

      // Set canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Clear and set up canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background image (faded)
      ctx.globalAlpha = 0.3;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
      
      // Set up drawing context for mask
      ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'; // Semi-transparent red for visibility
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      console.log('MaskEditor: Canvas initialized successfully', {
        canvasWidth,
        canvasHeight,
        originalSize: `${img.naturalWidth}x${img.naturalHeight}`,
        brushSize
      });

      setCanvasInitialized(true);
      return true;
    } catch (error) {
      console.error('MaskEditor: Error during canvas initialization:', error);
      setError(`Failed to initialize canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [brushSize]);

  // Load image with better error handling
  useEffect(() => {
    console.log('MaskEditor: Starting image load process for URL:', imageUrl?.substring(0, 100) + '...');
    
    // Reset states
    setImageLoaded(false);
    setIsLoading(true);
    setError(null);
    setHasMask(false);
    setCanvasInitialized(false);

    if (!imageUrl) {
      setError('No image URL provided');
      setIsLoading(false);
      return;
    }

    // Create and load image
    const img = new Image();
    imageRef.current = img;
    
    img.onload = () => {
      console.log('MaskEditor: Image loaded successfully', {
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: img.src.substring(0, 100) + '...'
      });

      setImageLoaded(true);
      setIsLoading(false);
      setError(null);

      // Initialize canvas after a short delay to ensure DOM is ready
      setTimeout(() => {
        initializeCanvas();
      }, 100);
    };

    img.onerror = (event) => {
      console.error('MaskEditor: Image load error:', event);
      setError('Failed to load image. Please try with a different image or check your internet connection.');
      setIsLoading(false);
    };

    // Set crossOrigin before src for CORS
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    // Cleanup on unmount
    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [imageUrl, initializeCanvas]);

  // Update brush size in canvas context
  useEffect(() => {
    if (!canvasInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = brushSize;
    }
  }, [brushSize, canvasInitialized]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setHasMask(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearMask = () => {
    if (!canvasInitialized) return;
    
    initializeCanvas();
    setHasMask(false);
  };

  const handleRemoveObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasInitialized || !hasMask) return;

    try {
      // Create a pure black and white mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      
      if (!maskCtx) {
        setError('Failed to create mask. Please try again.');
        return;
      }

      // Fill with black background
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Get the red mask areas from the main canvas and convert to white
      const mainCtx = canvas.getContext('2d');
      if (!mainCtx) return;

      const imageData = mainCtx.getImageData(0, 0, canvas.width, canvas.height);
      const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);

      // Convert red mask areas to white in the mask
      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        const alpha = imageData.data[i + 3];

        // If this pixel is part of the red mask (high red, low green/blue)
        if (red > 200 && green < 100 && blue < 100 && alpha > 100) {
          // Make it white in the mask
          maskImageData.data[i] = 255;     // R
          maskImageData.data[i + 1] = 255; // G
          maskImageData.data[i + 2] = 255; // B
          maskImageData.data[i + 3] = 255; // A
        } else {
          // Keep it black
          maskImageData.data[i] = 0;       // R
          maskImageData.data[i + 1] = 0;   // G
          maskImageData.data[i + 2] = 0;   // B
          maskImageData.data[i + 3] = 255; // A
        }
      }

      maskCtx.putImageData(maskImageData, 0, 0);
      const maskDataUrl = maskCanvas.toDataURL('image/png');
      
      console.log('MaskEditor: Mask created successfully');
      onMaskComplete(maskDataUrl);
    } catch (error) {
      console.error('MaskEditor: Error creating mask:', error);
      setError(`Failed to create mask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Image Loading Error</strong>
            <p className="mt-2">{error}</p>
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Back to Editor
          </Button>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How to use Magic Eraser:</strong>
          <ol className="mt-2 ml-4 list-decimal space-y-1">
            <li>Brush over objects you want to remove (workers, tools, debris, etc.)</li>
            <li>Use the eraser to fix mistakes</li>
            <li>Click "Remove Objects" to let AI fill in the background naturally</li>
          </ol>
        </AlertDescription>
      </Alert>
      
      {/* Tools */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={tool === 'brush' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('brush')}
            disabled={!canvasInitialized}
          >
            <Paintbrush className="w-4 h-4 mr-1" />
            Brush
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
            disabled={!canvasInitialized}
          >
            <Eraser className="w-4 h-4 mr-1" />
            Eraser
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={5}
            max={50}
            step={5}
            className="w-20"
            disabled={!canvasInitialized}
          />
          <span className="text-sm w-8">{brushSize}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearMask}
          disabled={!canvasInitialized || !hasMask}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="border rounded-lg overflow-hidden bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading image...</p>
            </div>
          </div>
        ) : imageLoaded ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-96 cursor-crosshair block mx-auto"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ 
              maxHeight: '400px',
              objectFit: 'contain'
            }}
          />
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleRemoveObjects} 
          disabled={!canvasInitialized || !hasMask}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Remove Objects
        </Button>
      </div>
    </div>
  );
};

export default MaskEditor;
