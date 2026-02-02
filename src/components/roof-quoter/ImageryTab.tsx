import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Crop, Sparkles, X, Camera, Box, Map } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SatellitePreview } from './SatellitePreview';
import { Google3DMapPreview } from './Google3DMapPreview';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface ImageryTabProps {
  projectId: string;
  latitude?: number;
  longitude?: number;
}

export function ImageryTab({ projectId, latitude, longitude }: ImageryTabProps) {
  const [selectedImagery, setSelectedImagery] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [capturedScreenshots, setCapturedScreenshots] = useState<{ [key: string]: string }>({});
  const [isMapReady, setIsMapReady] = useState<{ [key: string]: boolean }>({});
  const [tilesLoaded, setTilesLoaded] = useState<{ [key: string]: boolean }>({});
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const mapRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const mapInstances = useRef<{ [key: string]: any }>({});
  const { toast } = useToast();
  const { token: mapboxToken } = useMapboxToken();

  const handleEnhanceImage = async (vendorId: string) => {
    setIsEnhancing(vendorId);
    try {
      // Check if we have a captured screenshot for this vendor
      const capturedImage = capturedScreenshots[vendorId];
      
      if (!capturedImage) {
        toast({
          title: "No Screenshot",
          description: "Please save an image first before enhancing.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Enhancing Image",
        description: "Using AI to enhance image quality. This may take up to 60 seconds...",
      });

      const { data, error } = await supabase.functions.invoke('enhance-imagery', {
        body: { imageUrl: capturedImage }
      });

      if (error) throw error;

      if (data?.enhancedUrl) {
        // Convert enhanced base64 to blob and save to storage
        const base64Data = data.enhancedUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Upload enhanced image to storage
        const fileName = `project-${projectId}-enhanced-${Date.now()}.png`;
        const filePath = `${projectId}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('roi-images')
          .upload(filePath, blob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('roi-images')
          .getPublicUrl(filePath);

        // Store original for before/after comparison
        setOriginalImageUrl(capturedImage);

        // Save to database so DrawTab can use it as drawable background
        const { error: updateError } = await supabase
          .from('quote_requests')
          .update({ roi_image_url: publicUrl })
          .eq('id', projectId);

        if (updateError) throw updateError;

        // Store original and enhanced URLs for comparison
        setOriginalImageUrl(capturedImage);
        setEnhancedImageUrl(publicUrl);
        setSliderPosition(50);
        setShowEnhancedModal(true);
        
        // Refetch to update the thumbnail display
        refetch();
        
        toast({
          title: "Enhancement Complete",
          description: "Enhanced image saved! Go to Satellite View to draw on it.",
        });
      }
    } catch (error) {
      console.error('Error enhancing image:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Failed to enhance image",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(null);
    }
  };

  const { data: quoteData, refetch, isLoading, error: queryError } = useQuery({
    queryKey: ['quote-imagery', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('roi_image_url')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Imagery sources with tile URLs
  const imageryVendors = [
    {
      id: 'google-aerial',
      name: 'Google Aerial View',
      description: 'Premium aerial imagery with enhanced detail',
      available: true,
      lastCapture: '2024-03-15',
      getTileUrl: (lat: number, lng: number, zoom: number = 20) => {
        // Google Aerial View using hybrid layer for enhanced detail
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        return `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${zoom}`;
      }
    }
  ];

  const handleCaptureThumbnail = async (vendorId: string) => {
    setIsSaving(vendorId);
    try {
      const mapElement = mapRefs.current[vendorId];
      if (!mapElement) {
        throw new Error("Map element not found");
      }

      // Check if map is ready
      if (!isMapReady[vendorId]) {
        toast({
          title: "Map Loading",
          description: "Please wait for the map to finish loading...",
          variant: "default",
        });
        setIsSaving(null);
        return;
      }

      toast({
        title: "Capturing Thumbnail",
        description: "Waiting for tiles to render fully...",
      });

      // Wait much longer and verify tiles are loaded
      const mapInstance = mapInstances.current[vendorId];
      if (mapInstance) {
        // Force a repaint and wait for tiles
        mapInstance.triggerRepaint();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if tiles are actually loaded
        const style = mapInstance.getStyle();
        console.log('Map style sources:', style?.sources);
      }
      
      // Additional wait to ensure canvas is painted
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Find the maplibre canvas element
      const canvas = mapElement.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error("Map canvas not found");
      }

      // Check if canvas has content (not all black/white) - check larger area
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const checkWidth = Math.min(200, canvas.width);
        const checkHeight = Math.min(200, canvas.height);
        const imageData = ctx.getImageData(0, 0, checkWidth, checkHeight);
        const data = imageData.data;
        let colorPixels = 0;
        
        // Check if there's enough variation in the pixel data (not just black screen)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 10 || g > 10 || b > 10) {
            colorPixels++;
          }
        }
        
        const totalPixels = (checkWidth * checkHeight);
        const colorPercentage = colorPixels / totalPixels;
        const hasColor = colorPercentage > 0.1; // At least 10% of pixels should have color
        
        if (!hasColor) {
          toast({
            title: "Map Not Loaded",
            description: "The map tiles haven't loaded yet. Please wait a moment and try again.",
            variant: "destructive",
          });
          setIsSaving(null);
          return;
        }
      }

      console.log('Canvas ready to capture:', canvas.width, 'x', canvas.height);

      // Convert canvas directly to blob (same as DrawTab)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.8);
      });

      // Generate unique filename
      const filename = `project-${projectId}-${vendorId}-${Date.now()}.jpg`;
      const filePath = `${projectId}/${filename}`;

      // Upload to Supabase storage (roi-images bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('roi-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('roi-images')
        .getPublicUrl(filePath);

      // Get map state at time of capture for precise overlay later
      const mapCenter = mapInstance?.getCenter();
      const mapZoom = mapInstance?.getZoom();
      const mapBearing = mapInstance?.getBearing();

      // Check if map state already exists (to preserve measurements)
      const { data: existingData } = await supabase
        .from('quote_requests')
        .select('roi_image_center_lat')
        .eq('id', projectId)
        .maybeSingle();

      // Only update map state if it doesn't exist yet (first capture only)
      const updateData: any = { roi_image_url: publicUrl };
      if (!existingData?.roi_image_center_lat) {
        updateData.roi_image_center_lat = mapCenter?.lat;
        updateData.roi_image_center_lng = mapCenter?.lng;
        updateData.roi_image_zoom = mapZoom;
        updateData.roi_image_bearing = mapBearing;
      }

      const { error: updateError } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', projectId);

      if (updateError) throw updateError;
      
      console.log('📍 Saved map state:', { 
        center: [mapCenter?.lng, mapCenter?.lat], 
        zoom: mapZoom, 
        bearing: mapBearing 
      });

      // Also store data URL for AI enhancement
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setCapturedScreenshots(prev => ({ ...prev, [vendorId]: dataUrl }));

      toast({
        title: "Thumbnail Captured",
        description: "Screenshot saved successfully!",
      });

      // Refetch imagery to show the new thumbnail
      refetch();

    } catch (error) {
      console.error('Error capturing thumbnail:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture thumbnail.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Image Modal - Before/After Comparison */}
      <Dialog open={showEnhancedModal} onOpenChange={setShowEnhancedModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>AI Enhanced Imagery - Before & After</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Before/After Comparison with Slider */}
            {originalImageUrl && enhancedImageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                {/* After (Enhanced) Image - Full Width */}
                <div className="absolute inset-0">
                  <img 
                    src={enhancedImageUrl} 
                    alt="Enhanced satellite imagery" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    After
                  </div>
                </div>
                
                {/* Before (Original) Image - Clipped by Slider */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img 
                    src={originalImageUrl} 
                    alt="Original satellite imagery" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Before
                  </div>
                </div>
                
                {/* Slider Handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-0.5 h-4 bg-muted-foreground"></div>
                      <div className="w-0.5 h-4 bg-muted-foreground"></div>
                    </div>
                  </div>
                </div>
                
                {/* Invisible Drag Area */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                />
              </div>
            )}
            
            {/* Side by Side View */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-center">Before (Original)</h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                  {originalImageUrl && (
                    <img 
                      src={originalImageUrl} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-center">After (AI Enhanced)</h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                  {enhancedImageUrl && (
                    <img 
                      src={enhancedImageUrl} 
                      alt="Enhanced" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (enhancedImageUrl) {
                  const link = document.createElement('a');
                  link.href = enhancedImageUrl;
                  link.download = 'enhanced-imagery.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              Download Enhanced
            </Button>
            <Button onClick={() => setShowEnhancedModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!latitude || !longitude ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No location data available for this quote</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Mode Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Aerial Imagery</CardTitle>
                  <CardDescription>View property from satellite or 3D perspective</CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as '2d' | '3d')}>
                  <TabsList>
                    <TabsTrigger value="2d" className="gap-2">
                      <Map className="w-4 h-4" />
                      2D Satellite
                    </TabsTrigger>
                    <TabsTrigger value="3d" className="gap-2">
                      <Box className="w-4 h-4" />
                      3D View
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === '3d' ? (
                <div className="space-y-3">
                  <div className="h-[600px]">
                    <Google3DMapPreview
                      latitude={latitude}
                      longitude={longitude}
                    />
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>3D View Benefits:</strong> See roof slopes, pitch angles, and building structure from any angle. 
                      Perfect for identifying all roof sections before site visits.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Imagery Vendors - 2D View */}
                  <div className="space-y-4">
                    {imageryVendors.map((vendor) => (
                      <div key={vendor.id} className={!vendor.available ? 'opacity-60' : ''}>
                        {vendor.available && vendor.getTileUrl ? (
                          <div className="space-y-3">
                            {/* Satellite imagery map preview */}
                            <div 
                              ref={(el) => mapRefs.current[vendor.id] = el}
                              className="h-[600px] bg-muted rounded-lg overflow-hidden"
                            >
                              <SatellitePreview
                                latitude={latitude}
                                longitude={longitude}
                                tileUrl={
                                  vendor.id === 'mapbox' && mapboxToken
                                    ? vendor.getTileUrl(latitude, longitude, 20).replace('MAPBOX_TOKEN', mapboxToken)
                                    : vendor.getTileUrl(latitude, longitude, 20).replace(/x=\d+/, 'x={x}').replace(/y=\d+/, 'y={y}').replace(/z=\d+/, 'z={z}')
                                }
                                vendorName={vendor.name}
                                isSingleImage={false}
                                roofOutline={undefined}
                                enhancedImageUrl={quoteData?.roi_image_url || null}
                                onMapReady={(mapInstance) => {
                                  console.log(`Map ready for ${vendor.id}`);
                                  mapInstances.current[vendor.id] = mapInstance;
                                  setIsMapReady(prev => ({ ...prev, [vendor.id]: true }));
                                  
                                  // Listen for source data events to track tile loading
                                  mapInstance.on('sourcedata', (e: any) => {
                                    if (e.isSourceLoaded && e.sourceId === 'satellite') {
                                      console.log(`Tiles loaded for ${vendor.id}`);
                                      setTilesLoaded(prev => ({ ...prev, [vendor.id]: true }));
                                    }
                                  });
                                }}
                              />
                            </div>
                        
                            {vendor.lastCapture && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                Last capture: {new Date(vendor.lastCapture).toLocaleDateString()}
                              </div>
                            )}
                        
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => window.open(vendor.getTileUrl(latitude, longitude, 20), '_blank')}
                              >
                                <Crop className="w-4 h-4 mr-2" />
                                View Full
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleCaptureThumbnail(vendor.id)}
                                disabled={isSaving === vendor.id}
                              >
                                {isSaving === vendor.id ? 'Capturing...' : 'Capture Thumbnail'}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEnhanceImage(vendor.id)}
                                disabled={isEnhancing === vendor.id || !capturedScreenshots[vendor.id]}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {isEnhancing === vendor.id ? 'Enhancing...' : 'AI Enhance'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-3">
                              {vendor.name} integration coming soon
                            </p>
                            <Button variant="outline" size="sm" disabled>
                              Contact Sales
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Saved Imagery */}
      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading thumbnail...</p>
          </CardContent>
        </Card>
      )}
      
      {queryError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Error loading thumbnail: {queryError.message}</p>
          </CardContent>
        </Card>
      )}
      
      {quoteData?.roi_image_url && (
        <Card>
          <CardHeader>
            <CardTitle>
              {originalImageUrl ? 'AI Enhanced Imagery - Before & After' : 'Current Thumbnail'}
            </CardTitle>
            <CardDescription>
              {originalImageUrl 
                ? 'Compare original and AI-enhanced versions'
                : 'Currently saved aerial image for this quote'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {originalImageUrl ? (
                <>
                  {/* Before/After Comparison with Slider */}
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    {/* After (Enhanced) Image - Full Width */}
                    <div className="absolute inset-0">
                      <img 
                        src={quoteData.roi_image_url} 
                        alt="Enhanced satellite imagery" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium z-10">
                        After
                      </div>
                    </div>
                    {/* Before (Original) Image - Clipped by Slider */}
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img 
                        src={originalImageUrl} 
                        alt="Original satellite imagery" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium z-10">
                        Before
                      </div>
                    </div>
                    
                    {/* Slider Handle */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 z-20 cursor-pointer"
                    />
                  </div>
                  
                  {/* Side by Side View */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-center">Before (Original)</h3>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                        <img 
                          src={originalImageUrl} 
                          alt="Original" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-center">After (AI Enhanced)</h3>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                        <img 
                          src={quoteData.roi_image_url} 
                          alt="Enhanced" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-muted rounded overflow-hidden">
                  <img 
                    src={quoteData.roi_image_url} 
                    alt="Current quote thumbnail" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load thumbnail image:', quoteData.roi_image_url);
                      toast({
                        title: "Image Load Error",
                        description: "Failed to load the thumbnail image.",
                        variant: "destructive"
                      });
                    }}
                    onLoad={() => {
                      console.log('Thumbnail loaded successfully:', quoteData.roi_image_url);
                    }}
                  />
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  setIsEnhancing('current-thumbnail');
                  try {
                    toast({
                      title: "Enhancing Image",
                      description: "Using AI to enhance image quality. This may take up to 60 seconds...",
                    });

                    const { data, error } = await supabase.functions.invoke('enhance-imagery', {
                      body: { imageUrl: quoteData.roi_image_url }
                    });

                    if (error) throw error;

                    if (data?.enhancedUrl) {
                      // Convert enhanced base64 to blob and save to storage
                      const base64Data = data.enhancedUrl.split(',')[1];
                      const byteCharacters = atob(base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: 'image/png' });

                      // Upload enhanced image to storage
                      const fileName = `project-${projectId}-enhanced-${Date.now()}.png`;
                      const filePath = `${projectId}/${fileName}`;
                      
                      const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('roi-images')
                        .upload(filePath, blob, {
                          contentType: 'image/png',
                          upsert: true
                        });

                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = supabase.storage
                        .from('roi-images')
                        .getPublicUrl(filePath);

                      // Store original for before/after comparison
                      setOriginalImageUrl(quoteData.roi_image_url);

                      // Save to database so DrawTab can use it as drawable background
                      const { error: updateError } = await supabase
                        .from('quote_requests')
                        .update({ roi_image_url: publicUrl })
                        .eq('id', projectId);

                      if (updateError) throw updateError;

                      // Store original and enhanced URLs for comparison
                      setOriginalImageUrl(quoteData.roi_image_url);
                      setEnhancedImageUrl(publicUrl);
                      setSliderPosition(50);
                      setShowEnhancedModal(true);
                      
                      // Refetch to update the thumbnail display
                      refetch();
                      
                      toast({
                        title: "Enhancement Complete",
                        description: "Enhanced image saved! Go to Satellite View to draw on it.",
                      });
                    }
                  } catch (error) {
                    console.error('Error enhancing image:', error);
                    toast({
                      title: "Enhancement Failed",
                      description: error instanceof Error ? error.message : "Failed to enhance image",
                      variant: "destructive",
                    });
                  } finally {
                    setIsEnhancing(null);
                  }
                }}
                disabled={isEnhancing === 'current-thumbnail'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isEnhancing === 'current-thumbnail' ? 'Enhancing...' : 'AI Enhance & Set as Drawable Background'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !queryError && !quoteData?.roi_image_url && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No thumbnail captured yet. Click "Capture Thumbnail" above to save one.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}