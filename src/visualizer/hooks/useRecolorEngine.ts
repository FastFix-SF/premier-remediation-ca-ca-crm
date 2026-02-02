import { useCallback, useRef } from 'react';

interface RecolorOptions {
  method: 'hsl' | 'dual-blend';
  targetColor: string;
  preserveHighlights?: boolean;
}

export const useRecolorEngine = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Convert hex to HSL
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s, l];
  };

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    if (s === 0) {
      return [l * 255, l * 255, l * 255]; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = hue2rgb(p, q, h + 1/3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1/3);
      return [r * 255, g * 255, b * 255];
    }
  };

  // Method A: HSL Colorize with Luminosity Preservation
  const recolorHSL = useCallback((
    imageData: ImageData,
    maskPath: string,
    targetColor: string,
    canvasWidth: number,
    canvasHeight: number
  ): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Create mask from SVG path
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = imageData.width;
    maskCanvas.height = imageData.height;

    // Use the mask path directly since coordinates are already aligned
    const path = new Path2D(maskPath);
    maskCtx.fillStyle = 'white';
    maskCtx.fill(path);
    const maskData = maskCtx.getImageData(0, 0, imageData.width, imageData.height);

    // Get target HSL
    const [targetH, targetS] = hexToHsl(targetColor);

    // Clone image data
    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Process pixels
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskAlpha = maskData.data[i + 3];
      
      if (maskAlpha > 0) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        // Convert to HSL
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        const [, , originalL] = hexToHsl(hexColor);

        // Clamp luminosity and apply gamma correction
        const clampedL = Math.max(0.15, Math.min(0.92, originalL));
        const correctedL = Math.pow(clampedL, 0.92);

        // Convert back to RGB with new hue/saturation
        const [newR, newG, newB] = hslToRgb(targetH, targetS, correctedL);

        // Apply based on mask strength
        const strength = maskAlpha / 255;
        newImageData.data[i] = r * (1 - strength) + newR * strength;
        newImageData.data[i + 1] = g * (1 - strength) + newG * strength;
        newImageData.data[i + 2] = b * (1 - strength) + newB * strength;
      }
    }

    return newImageData;
  }, []);

  // Method B: Dual Blend
  const recolorDualBlend = useCallback((
    imageData: ImageData,
    maskPath: string,
    targetColor: string,
    canvasWidth: number,
    canvasHeight: number
  ): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Create mask
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = imageData.width;
    maskCanvas.height = imageData.height;

    // Use the mask path directly since coordinates are already aligned
    const path = new Path2D(maskPath);
    maskCtx.fillStyle = 'white';
    maskCtx.fill(path);
    const maskData = maskCtx.getImageData(0, 0, imageData.width, imageData.height);

    // Parse target color
    const targetR = parseInt(targetColor.slice(1, 3), 16);
    const targetG = parseInt(targetColor.slice(3, 5), 16);
    const targetB = parseInt(targetColor.slice(5, 7), 16);

    const newImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Apply dual blend within mask
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskAlpha = maskData.data[i + 3];
      
      if (maskAlpha > 0) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        // Multiply blend at 70%
        const multiplyR = (r * targetR) / 255;
        const multiplyG = (g * targetG) / 255;
        const multiplyB = (b * targetB) / 255;

        // Overlay blend at 30%
        const overlayR = r < 128 
          ? (2 * r * targetR) / 255
          : 255 - (2 * (255 - r) * (255 - targetR)) / 255;
        const overlayG = g < 128 
          ? (2 * g * targetG) / 255
          : 255 - (2 * (255 - g) * (255 - targetG)) / 255;
        const overlayB = b < 128 
          ? (2 * b * targetB) / 255
          : 255 - (2 * (255 - b) * (255 - targetB)) / 255;

        // Combine blends
        const blendedR = multiplyR * 0.7 + overlayR * 0.3;
        const blendedG = multiplyG * 0.7 + overlayG * 0.3;
        const blendedB = multiplyB * 0.7 + overlayB * 0.3;

        // High-pass filter for highlights (simplified)
        const highPassR = Math.max(0, r - (r * 0.7)) + 128;
        const highPassG = Math.max(0, g - (g * 0.7)) + 128;
        const highPassB = Math.max(0, b - (b * 0.7)) + 128;

        // Add high-pass back at 60% strength
        const finalR = Math.min(255, blendedR + (highPassR - 128) * 0.6);
        const finalG = Math.min(255, blendedG + (highPassG - 128) * 0.6);
        const finalB = Math.min(255, blendedB + (highPassB - 128) * 0.6);

        const strength = maskAlpha / 255;
        newImageData.data[i] = r * (1 - strength) + finalR * strength;
        newImageData.data[i + 1] = g * (1 - strength) + finalG * strength;
        newImageData.data[i + 2] = b * (1 - strength) + finalB * strength;
      }
    }

    return newImageData;
  }, []);

  const recolorImage = useCallback((
    fabricCanvas: any, // Fabric.js canvas instance
    originalImage: HTMLImageElement | null,
    maskPath: string,
    options: RecolorOptions
  ) => {
    try {
      console.log('Starting recoloring process...', {
        hasOriginalImage: !!originalImage,
        maskPath: maskPath.substring(0, 100) + '...',
        targetColor: options.targetColor,
        method: options.method
      });

      if (!originalImage || !fabricCanvas) {
        console.error('Missing required parameters:', { originalImage: !!originalImage, fabricCanvas: !!fabricCanvas });
        return;
      }

      // Get current background image dimensions from Fabric.js canvas
      const canvasWidth = fabricCanvas.width;
      const canvasHeight = fabricCanvas.height;
      
      // Calculate how the image is positioned and scaled in the canvas
      const canvasAspect = canvasWidth / canvasHeight;
      const imageAspect = originalImage.width / originalImage.height;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to width, center vertically
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imageAspect;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        // Image is taller - fit to height, center horizontally
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imageAspect;
        offsetX = (canvasWidth - drawWidth) / 2;
      }
      
      // Create a clean canvas to work with the original image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      
      // Fill with transparent background
      tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw the original image maintaining aspect ratio
      tempCtx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
      const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  
      // Store original for future use if we don't have it yet
      if (!originalImageDataRef.current) {
        originalImageDataRef.current = new ImageData(
          new Uint8ClampedArray(imageData.data),
          imageData.width,
          imageData.height
        );
      }

      console.log('Processing image data...', {
        imageWidth: imageData.width,
        imageHeight: imageData.height,
        canvasWidth,
        canvasHeight
      });

      // Apply recoloring to current state
      let recoloredData: ImageData;
      if (options.method === 'hsl') {
        recoloredData = recolorHSL(imageData, maskPath, options.targetColor, canvasWidth, canvasHeight);
      } else {
        recoloredData = recolorDualBlend(imageData, maskPath, options.targetColor, canvasWidth, canvasHeight);
      }

      // Draw result back to temp canvas
      tempCtx.putImageData(recoloredData, 0, 0);
      
      // Update the Fabric.js canvas with the recolored image using v6 API
      const recoloredDataURL = tempCanvas.toDataURL('image/png');
      
      // Import FabricImage from fabric for v6 compatibility
      import('fabric').then(({ FabricImage }) => {
        FabricImage.fromURL(recoloredDataURL).then((img) => {
          // Calculate how to fit the image maintaining aspect ratio (same as canvas setup)
          const canvasAspect = canvasWidth / canvasHeight;
          const imageAspect = img.width! / img.height!;
          
          let scaleX: number, scaleY: number;
          
          if (imageAspect > canvasAspect) {
            // Image is wider - fit to width
            scaleX = canvasWidth / img.width!;
            scaleY = scaleX;
          } else {
            // Image is taller - fit to height  
            scaleY = canvasHeight / img.height!;
            scaleX = scaleY;
          }
          
          // Scale and center the image
          img.scale(scaleX);
          img.set({
            left: (canvasWidth - img.width! * scaleX) / 2,
            top: (canvasHeight - img.height! * scaleY) / 2
          });
          
          // Set as background image using v6 API
          fabricCanvas.backgroundImage = img;
          fabricCanvas.renderAll();
          
          console.log('Successfully updated canvas background');
        });
      });
    } catch (error) {
      console.error('Error recoloring image:', error);
    }
  }, [recolorHSL, recolorDualBlend]);

  const resetToOriginal = useCallback((fabricCanvas: any) => {
    if (originalImageDataRef.current && fabricCanvas) {
      console.log('Resetting to original image');
      
      // Create canvas from original image data
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = originalImageDataRef.current.width;
      tempCanvas.height = originalImageDataRef.current.height;
      tempCtx.putImageData(originalImageDataRef.current, 0, 0);
      
      // Convert to data URL and load back as Fabric image
      const dataURL = tempCanvas.toDataURL('image/png');
      
      import('fabric').then(({ FabricImage }) => {
        FabricImage.fromURL(dataURL).then((img) => {
          // Calculate how to fit the image maintaining aspect ratio
          const canvasAspect = fabricCanvas.width / fabricCanvas.height;
          const imageAspect = img.width! / img.height!;
          
          let scaleX: number, scaleY: number;
          
          if (imageAspect > canvasAspect) {
            // Image is wider - fit to width
            scaleX = fabricCanvas.width / img.width!;
            scaleY = scaleX;
          } else {
            // Image is taller - fit to height  
            scaleY = fabricCanvas.height / img.height!;
            scaleX = scaleY;
          }
          
          // Scale and center the image
          img.scale(scaleX);
          img.set({
            left: (fabricCanvas.width - img.width! * scaleX) / 2,
            top: (fabricCanvas.height - img.height! * scaleY) / 2
          });
          
          fabricCanvas.backgroundImage = img;
          fabricCanvas.renderAll();
        });
      });
    }
  }, []);

  const setFabricCanvas = useCallback((canvas: HTMLCanvasElement) => {
    fabricCanvasRef.current = canvas;
  }, []);

  return {
    recolorImage,
    resetToOriginal,
    setFabricCanvas
  };
};