import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Toggle } from '../ui/toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Trash2, Undo2, Redo2, TestTube, RotateCcw, RotateCw, Pencil, Minus, Square, MapPin, Camera, Lightbulb, Eye, EyeOff, Move, Sparkles, MousePointer2, X, Ruler, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import maplibregl from 'maplibre-gl';
import MapCanvasGL, { MapCanvasGLHandle, Line } from '../plan/MapCanvasGL';
import { MapTools } from '../plan/MapTools';
import { FUNCTIONS_BASE } from '@/lib/functionsBase';
import EdgeActionsPanel from '../plan/EdgeActionsPanel';
import FacetsPanel from '../plan/FacetsPanel';
import PinsPanel from '../plan/PinsPanel';
import { EdgeItem } from '@/config/edgeActions';
import { EDGE_TYPES } from '@/config/edgeTypes';
import { EdgeLabel } from '@/types/roof-quoter';
import { useSolarAnalysis } from '@/hooks/useSolarAnalysis';
import { useEdgeCategories } from '@/hooks/useEdgeCategories';
import { CrosshairOverlay } from '../plan/CrosshairOverlay';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { LearningProgressBadge } from './LearningProgressBadge';
import { RoofMeasurementPanel } from './RoofMeasurementPanel';
import { useRoofMeasurements } from '@/hooks/useRoofMeasurements';
import { QuoteEstimatorPanel } from '../roof-quoter/QuoteEstimatorPanel';
import { ImageryTab } from '../roof-quoter/ImageryTab';
import { getMaterialsForPin } from '@/lib/pinMaterialMapping';
import { detectPolygons } from '@/lib/polygonDetection';
import { geodesicArea } from '@/lib/roof/geodesic';

// Helper function to extract polygon from SAM 2 mask image
async function extractPolygonFromMaskImage(
  maskUrl: string,
  originalWidth: number,
  originalHeight: number
): Promise<{ x: number; y: number }[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Create canvas to process the mask
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw mask image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Find all white pixels (the mask) and group into connected components
      const visited = new Set<string>();
      const components: [number, number][][] = [];
      
      const floodFill = (startX: number, startY: number): [number, number][] => {
        const stack: [number, number][] = [[startX, startY]];
        const component: [number, number][] = [];
        
        while (stack.length > 0) {
          const [x, y] = stack.pop()!;
          const key = `${x},${y}`;
          
          if (visited.has(key)) continue;
          if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
          
          const idx = (y * canvas.width + x) * 4;
          if (pixels[idx] <= 128) continue; // Not a white pixel
          
          visited.add(key);
          component.push([x, y]);
          
          // Check 8-connected neighbors
          stack.push([x-1, y], [x+1, y], [x, y-1], [x, y+1]);
          stack.push([x-1, y-1], [x-1, y+1], [x+1, y-1], [x+1, y+1]);
        }
        
        return component;
      };
      
      // Find all connected components
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const key = `${x},${y}`;
          if (pixels[idx] > 128 && !visited.has(key)) {
            const component = floodFill(x, y);
            if (component.length > 10) { // Ignore noise
              components.push(component);
            }
          }
        }
      }
      
      if (components.length === 0) {
        reject(new Error('No mask components found'));
        return;
      }
      
      // Use only the LARGEST component (the main clicked object)
      const largestComponent = components.reduce((largest, current) => 
        current.length > largest.length ? current : largest
      );
      
      console.log(`Found ${components.length} components, using largest with ${largestComponent.length} pixels`);
      const maskPixels = largestComponent;
      
      if (maskPixels.length === 0) {
        reject(new Error('No mask pixels found'));
        return;
      }
      
      // Extract boundary contour by finding pixels that have a black neighbor
      const boundaryPixels: [number, number][] = [];
      const directions = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
      
      for (const [x, y] of maskPixels) {
        // Check if this pixel is on the boundary
        const hasBlackNeighbor = directions.some(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
            const nidx = (ny * canvas.width + nx) * 4;
            return pixels[nidx] <= 128; // Black neighbor
          }
          return true; // Edge of image counts as boundary
        });
        
        if (hasBlackNeighbor) {
          boundaryPixels.push([x, y]);
        }
      }
      
      if (boundaryPixels.length === 0) {
        reject(new Error('No boundary pixels found'));
        return;
      }
      
      // Sort boundary pixels by angle from centroid to form a clean polygon
      const cx = boundaryPixels.reduce((sum, [x]) => sum + x, 0) / boundaryPixels.length;
      const cy = boundaryPixels.reduce((sum, [, y]) => sum + y, 0) / boundaryPixels.length;
      
      boundaryPixels.sort(([x1, y1], [x2, y2]) => {
        const angle1 = Math.atan2(y1 - cy, x1 - cx);
        const angle2 = Math.atan2(y2 - cy, x2 - cx);
        return angle1 - angle2;
      });
      
      // Simplify the polygon using Douglas-Peucker algorithm
      const simplifyPolygon = (points: [number, number][], tolerance: number): [number, number][] => {
        if (points.length <= 2) return points;
        
        let maxDist = 0;
        let maxIndex = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
          const dist = perpendicularDistance(points[i], points[0], points[end]);
          if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
          }
        }
        
        if (maxDist > tolerance) {
          const left = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
          const right = simplifyPolygon(points.slice(maxIndex), tolerance);
          return [...left.slice(0, -1), ...right];
        }
        
        return [points[0], points[end]];
      };
      
      const perpendicularDistance = (
        point: [number, number],
        lineStart: [number, number],
        lineEnd: [number, number]
      ): number => {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        const param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
      };
      
      // VERY aggressive simplification to create clean polygons (8-20 vertices target)
      // This matches how SAM 2/Canva masks work - simple filled overlay shapes
      const imageSize = Math.max(canvas.width, canvas.height);
      
      // Start with very aggressive tolerance to target 8-20 vertices
      let tolerance = imageSize * 0.10; // 10% - very aggressive starting point
      let simplified = simplifyPolygon(boundaryPixels, tolerance);
      
      // Adaptively adjust tolerance to get 8-20 vertices
      while (simplified.length > 20 && tolerance < imageSize * 0.25) {
        tolerance *= 1.4; // Increase by 40% each iteration
        simplified = simplifyPolygon(boundaryPixels, tolerance);
      }
      
      // If still too many points, do one more aggressive pass
      if (simplified.length > 20) {
        tolerance = imageSize * 0.25;
        simplified = simplifyPolygon(boundaryPixels, tolerance);
      }
      
      console.log(`✅ Simplified polygon: ${boundaryPixels.length} pixels → ${simplified.length} vertices (tolerance: ${tolerance.toFixed(1)}px)`);
      
      const finalPoints = simplified;
      
      // Convert to normalized 0-1 coordinates
      const normalizedPoints = finalPoints.map(([x, y]) => ({
        x: x / canvas.width,
        y: y / canvas.height
      }));
      
      console.log(`📐 Final polygon: ${normalizedPoints.length} vertices (target: 8-20 for clean mask)`);
      
      if (normalizedPoints.length < 8) {
        console.warn(`⚠️ Warning: ${normalizedPoints.length} vertices might be too simplified. Consider lower tolerance.`);
      } else if (normalizedPoints.length > 20) {
        console.warn(`⚠️ Warning: ${normalizedPoints.length} vertices exceeds target. Using as-is but may need refinement.`);
      }
      
      resolve(normalizedPoints);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load mask image'));
    };
    
    img.src = maskUrl;
  });
}

interface DrawTabProps {
  quoteId: string;
  imageryUrl: string | null;
  latitude?: number;
  longitude?: number;
  isFullscreen?: boolean;
  onAddMaterialsToEstimator?: (materials: any[]) => void;
}
export const DrawTab: React.FC<DrawTabProps> = ({
  quoteId,
  imageryUrl,
  latitude,
  longitude,
  isFullscreen = false,
  onAddMaterialsToEstimator
}) => {
  const mapGLRef = useRef<MapCanvasGLHandle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(true); // Start locked for drawing mode
  const [savedPosition, setSavedPosition] = useState<{center: [number, number], zoom: number, bearing: number} | null>(null);
  
  // Track initial pin IDs to prevent re-adding on tab switch
  const initialPinIdsRef = useRef<Set<string>>(new Set());
  
  // Start with map locked on mount for drawing mode
  useEffect(() => {
    console.log('🔒 DrawTab mounted - map starts locked for drawing mode');
    setIsMapLocked(true);
  }, []);
  
  const [maskOverlayUrl, setMaskOverlayUrl] = useState<string | null>(null); // SAM 2 mask overlay
  const [maskBounds, setMaskBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [sam2SourceImageUrl, setSam2SourceImageUrl] = useState<string | null>(null); // Store the source image used for SAM 2
  const [extractedMaskPolygon, setExtractedMaskPolygon] = useState<{ x: number; y: number }[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  // Load canvas height from localStorage or default to 600
  const [canvasHeight, setCanvasHeight] = useState<number>(() => {
    const savedHeight = localStorage.getItem(`canvas-height-${quoteId}`);
    return savedHeight ? parseInt(savedHeight, 10) : 600;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
  const [originalCaptureDataUrl, setOriginalCaptureDataUrl] = useState<string | null>(null); // Keep original for re-enhancement
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  
  // Comprehensive history state
  interface HistoryState {
    lines: Line[];
    facets: Record<number, string[]>;
    pitches: Record<number, string>;
    pins: any[];
  }
  const [history, setHistory] = useState<HistoryState[]>([{ lines: [], facets: {}, pitches: {}, pins: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Track current state from MapCanvasGL
  const [currentFacets, setCurrentFacets] = useState<Record<number, string[]>>({});
  const [currentPitches, setCurrentPitches] = useState<Record<number, string>>({});
  const [currentPins, setCurrentPins] = useState<any[]>([]);
  
  // Refs to always have access to latest state in callbacks
  const currentFacetsRef = useRef(currentFacets);
  const currentPitchesRef = useRef(currentPitches);
  const currentPinsRef = useRef(currentPins);
  const linesRef = useRef(lines);

  // Helper function to save pins to database
  const savePins = async (pins: any[]) => {
    try {
      await supabase
        .from('quote_requests')
        .update({ pins })
        .eq('id', quoteId);
      console.log(`💾 Saved ${pins.length} pins to database`);
    } catch (error) {
      console.error('Error saving pins:', error);
    }
  };

  // Auto-add materials when a PIN is placed
  const handlePinMaterialAutoAdd = async (pin: any) => {
    try {
      console.log('🔧 Starting auto-add materials for PIN:', {
        name: pin.name,
        category: pin.category,
        id: pin.id
      });
      
      // Fetch materials from same source as MaterialSelectionDialog
      const { data, error } = await supabase
        .from('quote_requests')
        .select('shingles_items, services_items, rf_items')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching materials:', error);
        throw error;
      }
      
      let shinglesData = (data?.shingles_items as any[]) || [];
      let servicesData = (data?.services_items as any[]) || [];
      let rfData = (data?.rf_items as any[]) || [];
      
      // If materials are empty, load from template quote (same as MaterialSelectionDialog)
      const hasShingles = shinglesData.length > 0;
      const hasServices = servicesData.length > 0;
      const hasRfItems = rfData.length > 0;
      
      if (!hasShingles || !hasServices || !hasRfItems) {
        const { data: templateData } = await supabase
          .from('quote_requests')
          .select('shingles_items, services_items, rf_items')
          .eq('id', '3fe15ff7-af91-4adc-9523-a06e44bee6f3')
          .maybeSingle();
        
        if (templateData) {
          if (!hasShingles) shinglesData = (templateData.shingles_items as any[]) || [];
          if (!hasServices) servicesData = (templateData.services_items as any[]) || [];
          if (!hasRfItems) rfData = (templateData.rf_items as any[]) || [];
        }
      }
      
      // Combine all materials from all tabs
      const allMaterials = [...shinglesData, ...servicesData, ...rfData];
      
      console.log(`📦 Found ${allMaterials.length} total materials (Shingles: ${shinglesData.length}, Services: ${servicesData.length}, RF: ${rfData.length})`);
      
      if (allMaterials.length === 0) {
        console.log('⚠️ No materials found in Materials tab');
        toast.error('Materials tab is empty', { 
          description: 'Please add materials in the Materials tab first, then PINs will auto-match them',
          duration: 8000,
          action: {
            label: 'Go to Materials',
            onClick: () => {
              const params = new URLSearchParams(window.location.search);
              params.set('tab', 'materials');
              window.location.search = params.toString();
            }
          }
        });
        return;
      }
      
      // Use roofing expert mapping to find appropriate materials
      const matchedMaterials = getMaterialsForPin(pin.name, pin.category, allMaterials);
      
      console.log(`✅ Matched ${matchedMaterials.length} materials:`, matchedMaterials.map(m => m.name));
      
      if (matchedMaterials.length === 0) {
        console.log(`⚠️ No materials matched for category "${pin.category}" and name "${pin.name}"`);
        toast.info(`No materials matched for ${pin.category}`, { 
          description: 'Searched all material categories',
          duration: 4000 
        });
        return;
      }
      
      // Create new material items from matched materials
      const newMaterialItems = matchedMaterials.map(mat => ({
        id: `pin-${pin.id}-${mat.id}-${Date.now()}`,
        pin_id: pin.id, // Track which pin this came from
        name: mat.name,
        image_url: mat.image_url || '',
        picture: mat.image_url || '',
        category: mat.category,
        unit: mat.unit || 'ea',
        source_type: 'pin' as const,
        quantity: 1, // Default quantity, user can adjust
        unit_cost: (mat.total || 0),
        markup_pct: 15,
        total: (mat.total || 0) * 1.15,
        orderDescription: mat.name,
        coverage: 1,
        labor: 0,
        material: mat.total || 0,
        factor: 1,
        show_in_app: mat.show_in_app ?? true,
        show_on_estimate: mat.show_on_estimate ?? false,
        show_on_contract: mat.show_on_contract ?? false,
        show_on_material_order: mat.show_on_material_order ?? false,
        show_on_labor_report: mat.show_on_labor_report ?? false,
      }));
      
      console.log(`📝 Passing ${newMaterialItems.length} materials to Estimator`);
      
      // Pass materials directly to Estimator (no DB save)
      if (onAddMaterialsToEstimator) {
        onAddMaterialsToEstimator(newMaterialItems);
        toast.success(`Added ${newMaterialItems.length} materials from PIN`, {
          description: `${pin.name} • Check Estimator tab`,
          duration: 5000
        });
      } else {
        console.warn('⚠️ No callback function provided to add materials to Estimator');
        toast.warning('Could not add materials', {
          description: 'Estimator callback not available',
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Error auto-adding materials for PIN:', error);
      toast.error('Failed to auto-add materials');
    }
  };

  // Load initial data from database on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('edges, pins, facets, pitches')
          .eq('id', quoteId)
          .maybeSingle();

        if (error) throw error;

        // Load edges/lines
        if (data?.edges && Array.isArray(data.edges)) {
          const loadedLines: Line[] = data.edges.map((edge: any) => ({
            id: edge.id,
            coords: [edge.start, edge.end],
            edgeLabel: edge.edgeLabel,
            edgeLabels: edge.edgeLabels || [edge.edgeLabel],
            edgeColor: edge.edgeColor,
            length: edge.length
          }));
          setLines(loadedLines);
        }

        // Load pins
        if (data?.pins && Array.isArray(data.pins)) {
          // Convert position from object {lng, lat} to array [lng, lat] format
          const loadedPins = data.pins.map((pin: any) => ({
            ...pin,
            position: Array.isArray(pin.position) 
              ? pin.position 
              : [pin.position.lng || pin.position[0], pin.position.lat || pin.position[1]]
          }));
          setCurrentPins(loadedPins);
          
          // Store initial pin IDs to prevent re-adding materials for existing pins
          initialPinIdsRef.current = new Set(loadedPins.map((p: any) => p.id));
          
          console.log(`✅ Loaded ${loadedPins.length} pins from database`);
        }

        // Load facets
        if (data?.facets && typeof data.facets === 'object') {
          setCurrentFacets(data.facets as Record<number, string[]>);
        }

        // Load pitches
        if (data?.pitches && typeof data.pitches === 'object') {
          setCurrentPitches(data.pitches as Record<number, string>);
        }

        setIsLoadingInitialData(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [quoteId]);

  // Save pins to database and auto-add materials when pins change
  useEffect(() => {
    if (isLoadingInitialData) return; // Don't save during initial load
    
    // Check if new pins were added (only pins not in initial load)
    const newPins = currentPins.filter(pin => !initialPinIdsRef.current.has(pin.id));
    
    if (newPins.length > 0) {
      console.log('🆕 New pins detected (not from initial load):', newPins.length, newPins);
      newPins.forEach(pin => {
        console.log('🎯 Auto-adding materials for NEW pin:', pin);
        handlePinMaterialAutoAdd(pin);
        // Add this pin to the initial set so we don't re-add it
        initialPinIdsRef.current.add(pin.id);
      });
    }
    
    if (currentPins.length === 0 && !isLoadingInitialData) {
      // Only save empty array if we're not loading (to clear pins if user deleted all)
      const timeoutId = setTimeout(() => {
        savePins(currentPins);
        initialPinIdsRef.current.clear(); // Clear tracked pins when all deleted
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    if (currentPins.length > 0) {
      const timeoutId = setTimeout(() => savePins(currentPins), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPins, isLoadingInitialData]);
  
  // Sync pins to estimator tab
  useEffect(() => {
    const syncPinsToEstimator = async () => {
      try {
        // Get current estimator materials
        const { data: quoteData, error: fetchError } = await supabase
          .from('quote_requests')
          .select('material_items')
          .eq('id', quoteId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const existingMaterials = (quoteData?.material_items as any[]) || [];
        
        // Create a map of existing pin-based materials for quick lookup
        const existingPinMaterials = new Map(
          existingMaterials
            .filter((m: any) => m.source_type === 'pin')
            .map((m: any) => [m.pin_id, m])
        );
        
        // Create a map of current pins
        const currentPinIds = new Set(currentPins.map(p => p.id));
        
        // Remove materials for deleted pins
        const materialsWithoutDeletedPins = existingMaterials.filter((m: any) => 
          m.source_type !== 'pin' || currentPinIds.has(m.pin_id)
        );
        
        // Add new pin materials that don't exist yet
        const newPinMaterials = currentPins
          .filter(pin => !existingPinMaterials.has(pin.id))
          .map(pin => {
            const unitCost = (pin.labor_cost || 0) + (pin.material_cost || 0);
            const total = pin.total || unitCost;
            
            return {
              id: `pin-material-${pin.id}`,
              pin_id: pin.id,
              name: pin.name,
              image_url: pin.imageUrl,
              picture: pin.imageUrl,
              category: pin.category || 'Pins',
              unit: pin.unit || 'ea',
              source_type: 'pin',
              quantity: 1,
              unit_cost: unitCost,
              markup_pct: 0,
              total: total,
              labor: pin.labor_cost || 0,
              material: pin.material_cost || 0,
              coverage: pin.coverage || 1,
              factor: pin.factor || 1,
              show_in_app: true,
              show_on_estimate: true,
              show_on_contract: false,
              show_on_material_order: false,
              show_on_labor_report: false,
            };
          });
        
        // Combine materials
        const updatedMaterials = [...materialsWithoutDeletedPins, ...newPinMaterials];
        
        // Only update if there are changes
        if (newPinMaterials.length > 0 || existingMaterials.length !== updatedMaterials.length) {
          await supabase
            .from('quote_requests')
            .update({ material_items: updatedMaterials })
            .eq('id', quoteId);
          
          if (newPinMaterials.length > 0) {
            toast.success(`Added ${newPinMaterials.length} pin(s) to Estimator`);
          }
        }
      } catch (error) {
        console.error('Error syncing pins to estimator:', error);
      }
    };

    // Debounce the sync to avoid too many updates
    const timeoutId = setTimeout(syncPinsToEstimator, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPins, quoteId]);

  // Keep refs in sync with state
  useEffect(() => {
    currentFacetsRef.current = currentFacets;
  }, [currentFacets]);
  
  useEffect(() => {
    currentPitchesRef.current = currentPitches;
  }, [currentPitches]);
  
  useEffect(() => {
    currentPinsRef.current = currentPins;
  }, [currentPins]);
  
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showLength, setShowLength] = useState(true);
  const [selectedEdgeAction, setSelectedEdgeAction] = useState<EdgeItem | null>(null);
  const [selectedEdgeLabels, setSelectedEdgeLabels] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [bearing, setBearing] = useState(0);
  const [activeTab, setActiveTab] = useState('draw');
  const [selectedFacet, setSelectedFacet] = useState<string | null>(null);
  const [selectedFacetValue, setSelectedFacetValue] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isVertexDragMode, setIsVertexDragMode] = useState(false);
  const [isVertexMoveActive, setIsVertexMoveActive] = useState(false);
  const [showSolarOverlay, setShowSolarOverlay] = useState(false);
  const [viewTab, setViewTab] = useState('satellite');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [showTrackedLines, setShowTrackedLines] = useState(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isSmartSelectMode, setIsSmartSelectMode] = useState(false);
  const [isSAMClickMode, setIsSAMClickMode] = useState(false);
  
  // Calibration state for measurement accuracy
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [showSetScaleDialog, setShowSetScaleDialog] = useState(false); // Initial "Please set scale" dialog
  const [calibrationLineId, setCalibrationLineId] = useState<string | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationInput, setCalibrationInput] = useState('');
  const [pixelToFeetRatio, setPixelToFeetRatio] = useState<number | null>(null);

  // Fetch aerial images for vision analysis
  const { data: aerialImages } = useQuery({
    queryKey: ['aerial-images', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aerial_images')
        .select('*')
        .eq('quote_request_id', quoteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
  const [trackedLinesData, setTrackedLinesData] = useState<Line[]>([]);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  
  // Solar API integration
  const { solarAnalysis, analyzeSolar } = useSolarAnalysis(quoteId);
  const { data: edgeCategories } = useEdgeCategories();
  
  // Roof measurements with AI (use quoteId as projectId)
  const { roofMeasurement, measureRoof } = useRoofMeasurements(quoteId);
  
  // Debug location data
  useEffect(() => {
    console.log('📍 DrawTab location props:', { latitude, longitude });
  }, [latitude, longitude]);
  
  // Auto-select UNLABELED when DRAW tab is active (removed - allow manual toggle)
  
  // AI Learning tracking
  const { 
    trackAction, 
    saveEdgeTraining, 
    saveFacetTraining, 
    savePinTraining, 
    stats, 
    isTracking, 
    startSession, 
    stopSession 
  } = useTrainingSession({ 
    quoteId,
    enabled: true 
  });

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch(`${FUNCTIONS_BASE}/map-config`);
        const data = await response.json();
        if (data.googleMapsApiKey) {
          setGoogleMapsApiKey(data.googleMapsApiKey);
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
      }
    };
    fetchApiKey();
  }, []);

  // Load saved map position from localStorage on mount and always unlock
  useEffect(() => {
    const savedPosKey = `map-position-${quoteId}`;
    const savedPosStr = localStorage.getItem(savedPosKey);
    if (savedPosStr) {
      try {
        const pos = JSON.parse(savedPosStr);
        setSavedPosition(pos);
      } catch (e) {
        console.error('Error parsing saved position:', e);
      }
    }
    // Force unlock on mount
    setIsMapLocked(false);
    localStorage.removeItem(savedPosKey);
  }, [quoteId]);

  // Fetch enhanced background image URL and map state when on satellite view
  const { data: backgroundImageData } = useQuery({
    queryKey: ['background-image', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('roi_image_url, roi_image_center_lat, roi_image_center_lng, roi_image_zoom, roi_image_bearing')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: viewTab === 'satellite' // Only fetch when on satellite view
  });

  // Load saved lines from database on mount
  useEffect(() => {
    const loadSavedLines = async () => {
      try {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('edges')
          .eq('id', quoteId)
          .maybeSingle();

        if (error) throw error;

        if (data?.edges && Array.isArray(data.edges) && data.edges.length > 0) {
          // Transform database format back to Line format
          const loadedLines: Line[] = data.edges.map((edge: any) => ({
            id: edge.id,
            coords: [edge.start, edge.end],
            edgeLabel: edge.edgeLabel || 'UNLABELED',
            edgeLabels: edge.edgeLabels || [edge.edgeLabel || 'UNLABELED'],
            edgeColor: edge.edgeColor,
            length: edge.length
          }));

          setLines(loadedLines);
          setHistory([{ lines: loadedLines, facets: {}, pitches: {}, pins: [] }]);
          setHistoryIndex(0);
          
          console.log(`Loaded ${loadedLines.length} lines`);
          toast.success(`Loaded ${loadedLines.length} saved line${loadedLines.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        console.error('Error loading saved lines:', error);
        toast.error('Failed to load saved lines');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLines();
  }, [quoteId]);

  // Extract polygon from mask overlay when it changes
  useEffect(() => {
    if (maskOverlayUrl && sam2SourceImageUrl) {
      extractPolygonFromMaskImage(maskOverlayUrl, 1024, 1024)
        .then(polygon => {
          setExtractedMaskPolygon(polygon);
          console.log('Extracted mask polygon:', polygon.length, 'vertices');
        })
        .catch(error => {
          console.error('Error extracting mask polygon:', error);
        });
    }
  }, [maskOverlayUrl, sam2SourceImageUrl]);

  // Imagery test function removed - using Mapbox as primary provider
  
  const captureMapThumbnail = async () => {
    if (isCapturingThumbnail) {
      console.log('Already capturing thumbnail, skipping...');
      return;
    }
    
    try {
      setIsCapturingThumbnail(true);
      toast.loading('Capturing thumbnail...');
      
      // Wait for tiles to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find the maplibre canvas element
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) {
        toast.error('Could not find map canvas');
        return;
      }

      // Check if canvas has content
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const checkWidth = Math.min(200, canvas.width);
        const checkHeight = Math.min(200, canvas.height);
        const imageData = ctx.getImageData(0, 0, checkWidth, checkHeight);
        const data = imageData.data;
        let colorPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 10 || g > 10 || b > 10) {
            colorPixels++;
          }
        }
        
        const totalPixels = (checkWidth * checkHeight);
        const colorPercentage = colorPixels / totalPixels;
        const hasColor = colorPercentage > 0.1;
        
        if (!hasColor) {
          toast.error('Map tiles not loaded', {
            description: 'Please wait for the map to fully load and try again.'
          });
          return;
        }
      }

      // Convert canvas to blob
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
      const filename = `quote-${quoteId}-thumbnail-${Date.now()}.jpg`;
      const filePath = `${quoteId}/${filename}`;

      // Upload to Supabase storage
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

      // Update quote_requests with the thumbnail URL
      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ roi_image_url: publicUrl })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      toast.success('Thumbnail saved for quote card!');
      console.log('Thumbnail saved:', publicUrl);
    } catch (error) {
      console.error('Error capturing thumbnail:', error);
      toast.error('Failed to capture thumbnail');
    } finally {
      setIsCapturingThumbnail(false);
    }
  };
  
  const handleEnhanceImage = async () => {
    setIsEnhancing(true);
    try {
      if (!originalCaptureDataUrl) {
        toast.error('Please capture a thumbnail first before enhancing.', {
          description: "Click 'Capture Thumbnail' to save the current view"
        });
        setIsEnhancing(false);
        return;
      }

      toast.info('Enhancing Image', {
        description: 'Using AI to enhance image quality. This may take up to 60 seconds...',
      });

      const { data, error } = await supabase.functions.invoke('enhance-imagery', {
        body: { imageUrl: originalCaptureDataUrl }
      });

      if (error) throw error;

      if (data?.enhancedUrl) {
        // Convert enhanced base64 to blob
        const base64Data = data.enhancedUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Upload enhanced image to storage
        const fileName = `quote-${quoteId}-thumbnail-enhanced-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('roi-images')
          .upload(`${quoteId}/${fileName}`, blob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('roi-images')
          .getPublicUrl(`${quoteId}/${fileName}`);

        // Get the saved bounds from localStorage
        const savedPositionStr = localStorage.getItem(`map-position-${quoteId}`);
        const savedPosition = savedPositionStr ? JSON.parse(savedPositionStr) : null;
        const savedBounds = savedPosition?.bounds;

        // Update quote_requests with enhanced thumbnail URL
        const { error: updateError } = await supabase
          .from('quote_requests')
          .update({ 
            roi_image_url: publicUrl
          })
          .eq('id', quoteId);

        if (updateError) throw updateError;

        // Add enhanced image as background on the canvas (replaces saved thumbnail)
        const mapGLComponent = mapGLRef.current;
        if (mapGLComponent) {
          // Access the MapLibre map instance
          const mapInstance = (mapGLComponent as any).map;
          
          if (mapInstance && mapInstance.loaded()) {
            // Use saved bounds instead of current bounds
            const bounds = savedBounds || mapInstance.getBounds();
            
            // Remove existing background layers
            const layersToRemove = ['enhanced-overlay', 'saved-thumbnail-layer'];
            const sourcesToRemove = ['enhanced-image', 'saved-thumbnail'];
            
            layersToRemove.forEach(layerId => {
              if (mapInstance.getLayer(layerId)) {
                mapInstance.removeLayer(layerId);
                console.log('🗑️ Removed layer:', layerId);
              }
            });
            
            sourcesToRemove.forEach(sourceId => {
              if (mapInstance.getSource(sourceId)) {
                mapInstance.removeSource(sourceId);
                console.log('🗑️ Removed source:', sourceId);
              }
            });

            // Add the enhanced image as the new drawable background
            const coordinates: [[number, number], [number, number], [number, number], [number, number]] = savedBounds ? [
              [savedBounds.west, savedBounds.north],
              [savedBounds.east, savedBounds.north],
              [savedBounds.east, savedBounds.south],
              [savedBounds.west, savedBounds.south]
            ] : [
              [bounds.getWest(), bounds.getNorth()],
              [bounds.getEast(), bounds.getNorth()],
              [bounds.getEast(), bounds.getSouth()],
              [bounds.getWest(), bounds.getSouth()]
            ];

            mapInstance.addSource('saved-thumbnail', {
              type: 'image',
              url: publicUrl,
              coordinates: coordinates
            });

            // Add as first layer (bottom-most) so all drawings are on top
            mapInstance.addLayer({
              id: 'saved-thumbnail-layer',
              type: 'raster',
              source: 'saved-thumbnail',
              paint: {
                'raster-opacity': 1,
                'raster-fade-duration': 0
              }
            }, mapInstance.getStyle().layers[0]?.id);
            
            console.log('✅ Enhanced image loaded as drawable background on canvas');
          }
        }

        // Keep map locked and update screenshot reference
        setIsMapLocked(true);
        setCapturedScreenshot(publicUrl);

        setNeedsCalibration(true); // Enable calibration mode
        setPixelToFeetRatio(null); // Reset any previous calibration
        setShowSetScaleDialog(true); // Show initial calibration instruction dialog
      }
    } catch (error) {
      console.error('Error enhancing image:', error);
      toast.error('Enhancement Failed', {
        description: error instanceof Error ? error.message : "Failed to enhance image",
      });
    } finally {
      setIsEnhancing(false);
    }
  };
  
  const addToHistory = (newState: Partial<HistoryState>) => {
    const currentState = history[historyIndex];
    const fullNewState: HistoryState = {
      lines: newState.lines ?? currentState.lines,
      facets: newState.facets ?? currentState.facets,
      pitches: newState.pitches ?? currentState.pitches,
      pins: newState.pins ?? currentState.pins
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(fullNewState);
    console.log(`History: Adding state. Total history entries: ${newHistory.length}`);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      console.log(`Undo: Going to state ${newIndex}`);
      setHistoryIndex(newIndex);
      setLines(previousState.lines);
      setCurrentFacets(previousState.facets);
      setCurrentPitches(previousState.pitches);
      setCurrentPins(previousState.pins);
      
      // Also update refs to keep them in sync
      linesRef.current = previousState.lines;
      currentFacetsRef.current = previousState.facets;
      currentPitchesRef.current = previousState.pitches;
      currentPinsRef.current = previousState.pins;
      
      saveLines(previousState.lines);
      toast.success('Undone');
      
      // Track undo action
      trackAction('undo', { historyIndex: newIndex });
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      console.log(`Redo: Going to state ${newIndex}`);
      setHistoryIndex(newIndex);
      setLines(nextState.lines);
      setCurrentFacets(nextState.facets);
      setCurrentPitches(nextState.pitches);
      setCurrentPins(nextState.pins);
      
      // Also update refs to keep them in sync
      linesRef.current = nextState.lines;
      currentFacetsRef.current = nextState.facets;
      currentPitchesRef.current = nextState.pitches;
      currentPinsRef.current = nextState.pins;
      
      saveLines(nextState.lines);
      toast.success('Redone');
      
      // Track redo action
      trackAction('redo', { historyIndex: newIndex });
    }
  };
  const deleteSelectedLine = () => {
    if (!selectedLine) return;
    const newLines = lines.filter(l => l.id !== selectedLine);
    setLines(newLines);
    addToHistory({ lines: newLines });
    setSelectedLine(null);
    saveLines(newLines);
  };
  
  const handleLineClick = (lineId: string) => {
    if (isDeleteMode) {
      // Don't allow line deletion when on pins tab
      if (activeTab === 'pins') {
        toast.error('Switch to Draw or Edges tab to delete lines');
        return;
      }
      const newLines = lines.filter(l => l.id !== lineId);
      setLines(newLines);
      addToHistory({ lines: newLines });
      saveLines(newLines);
      toast.success('Line deleted');
    }
  };
  const saveLines = async (linesToSave: Line[]) => {
    try {
      // Transform to simple format for DB
      const edgesData = linesToSave.map(line => ({
        id: line.id,
        start: line.coords[0],
        end: line.coords[line.coords.length - 1],
        edgeLabel: line.edgeLabel,
        edgeLabels: line.edgeLabels || [line.edgeLabel],
        edgeColor: line.edgeColor,
        length: line.length
      }));
      
      const { error } = await supabase
        .from('quote_requests')
        .update({ edges: edgesData })
        .eq('id', quoteId);
        
      if (error) throw error;
      
      // NOTE: Training data is only saved for NEW lines in handleLinesChange
      // Don't save training data here to avoid blocking UI with 1000+ lines
    } catch (error) {
      console.error('Error saving lines:', error);
    }
  };
  
  // Helper functions for training data
  const calculateLineAngle = (line: Line): number => {
    const [start, end] = [line.coords[0], line.coords[line.coords.length - 1]];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };
  
  const findNeighboringLines = (line: Line, allLines: Line[]): any[] => {
    const threshold = 0.0001; // ~10 meters
    return allLines
      .filter(l => l.id !== line.id)
      .filter(l => {
        const lineStart = line.coords[0];
        const lineEnd = line.coords[line.coords.length - 1];
        const otherStart = l.coords[0];
        const otherEnd = l.coords[l.coords.length - 1];
        
        const dist = Math.min(
          distance(lineStart, otherStart),
          distance(lineStart, otherEnd),
          distance(lineEnd, otherStart),
          distance(lineEnd, otherEnd)
        );
        
        return dist < threshold;
      })
      .map(l => ({
        id: l.id,
        edgeType: l.edgeLabel,
        length: l.length
      }));
  };
  
  const distance = (p1: [number, number], p2: [number, number]): number => {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  };
  
  // Calculate roof complexity for AI training context
  const calculateRoofComplexity = (lines: Line[]): string => {
    const uniqueTypes = new Set(lines.map(l => l.edgeLabel));
    const avgConnections = lines.reduce((sum, line) => {
      const connections = findNeighboringLines(line, lines).length;
      return sum + connections;
    }, 0) / lines.length;
    
    if (uniqueTypes.size > 5 || avgConnections > 4) return 'complex';
    if (uniqueTypes.size > 3 || avgConnections > 2) return 'moderate';
    return 'simple';
  };
  
  // Detect common edge patterns for AI learning
  const detectEdgePatterns = (lines: Line[]): string[] => {
    const patterns: string[] = [];
    
    // Detect rectangles (4 edges forming closed shape)
    const rectangles = lines.filter(l => findNeighboringLines(l, lines).length === 2);
    if (rectangles.length >= 4) patterns.push('rectangular_section');
    
    // Detect valleys (two edges meeting at angle)
    const valleys = lines.filter(l => 
      hasLabel(l, 'valley') && findNeighboringLines(l, lines).length >= 2
    );
    if (valleys.length > 0) patterns.push('valley_configuration');
    
    // Detect hips
    const hips = lines.filter(l => hasLabel(l, 'hip'));
    if (hips.length > 0) patterns.push('hip_configuration');
    
    // Detect parallel edges (eaves, ridges)
    const parallelPairs = lines.filter(l1 => {
      return lines.some(l2 => {
        if (l1.id === l2.id) return false;
        const angle1 = calculateLineAngle(l1);
        const angle2 = calculateLineAngle(l2);
        return Math.abs(angle1 - angle2) < 5; // Within 5 degrees
      });
    });
    if (parallelPairs.length > 0) patterns.push('parallel_edges');
    
    return patterns;
  };

  // Display SAM 2 mask as a semi-transparent overlay (like Canva/Photoshop)
  const displayMaskOverlay = (maskUrl: string, sourceImageUrl: string, canvasWidth: number, canvasHeight: number, bounds: any): Promise<void> => {
    return new Promise((resolve) => {
      // Set the mask URL, source image, and bounds in state to display it as an overlay
      setMaskOverlayUrl(maskUrl);
      setMaskBounds(bounds);
      setSam2SourceImageUrl(sourceImageUrl);
      console.log('Mask overlay URL set:', maskUrl);
      console.log('Source image URL stored for measurement');
      console.log('Mask bounds set:', bounds);
      resolve();
    });
  };

  // Convert SAM 2 mask boundary to drawable lines for measurements
  const convertMaskToLines = async () => {
    if (!maskOverlayUrl || !maskBounds) {
      toast.error('No SAM 2 mask available. Segment a roof first.');
      return;
    }

    try {
      toast.info('Converting mask to edges...');
      
      // Extract the boundary polygon from the mask
      const boundaryPoints = await extractPolygonFromMaskImage(maskOverlayUrl, 800, 800);
      
      if (boundaryPoints.length < 3) {
        toast.error('Could not extract valid boundary from mask');
        return;
      }

      console.log(`Extracted ${boundaryPoints.length} boundary points from mask`);
      console.log('Mask bounds:', maskBounds);
      console.log('Sample boundary point:', boundaryPoints[0]);

      // Convert normalized points (0-1) to geographic coordinates using mask bounds
      const lngRange = maskBounds.east - maskBounds.west;
      const latRange = maskBounds.north - maskBounds.south;

      console.log(`Lng range: ${lngRange}, Lat range: ${latRange}`);

      const geoCoords = boundaryPoints.map(pt => {
        const lng = maskBounds.west + (pt.x * lngRange);
        const lat = maskBounds.north - (pt.y * latRange); // Subtract because y increases downward
        return [lng, lat] as [number, number];
      });

      console.log('Sample geo coordinate:', geoCoords[0]);

      // Create lines connecting all boundary points
      const newLines: Line[] = geoCoords.map((coord, i) => {
        const nextCoord = geoCoords[(i + 1) % geoCoords.length];
        
        // Calculate length in feet
        const length = Math.round(
          Math.sqrt(
            Math.pow((nextCoord[0] - coord[0]) * 111000 * Math.cos(coord[1] * Math.PI / 180), 2) +
            Math.pow((nextCoord[1] - coord[1]) * 111000, 2)
          ) * 3.28084
        );

        // Assign edge types intelligently based on position
        // For now, alternate between EAVE and RAKE (can be refined with Vision AI later)
        const edgeLabel: EdgeLabel = i % 2 === 0 ? 'EAVE' : 'RAKE';
        const edgeType = EDGE_TYPES.find(e => e.key === edgeLabel.toLowerCase());

        return {
          id: `mask-${Date.now()}-${i}`,
          coords: [coord, nextCoord],
          edgeLabel,
          edgeLabels: [edgeLabel],
          edgeColor: edgeType?.color || '#FF0000',
          length
        };
      });

      console.log(`Created ${newLines.length} lines, sample:`, newLines[0]);

      // Add the new lines to the drawing
      setLines(prev => {
        const updated = [...prev, ...newLines];
        console.log('Updated lines array:', updated);
        return updated;
      });
      
      // Add to history
      addToHistory({
        lines: [...linesRef.current, ...newLines],
        facets: currentFacetsRef.current,
        pitches: currentPitchesRef.current,
        pins: currentPinsRef.current
      });

      // Calculate total perimeter
      const totalLength = newLines.reduce((sum, line) => sum + line.length, 0);
      console.log(`Total perimeter: ${totalLength.toFixed(1)} feet`);

      // Calculate center of the new lines to zoom to them
      const allLats = geoCoords.map(c => c[1]);
      const allLngs = geoCoords.map(c => c[0]);
      const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
      const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;
      
      // Zoom map to the traced edges
      if (mapGLRef.current) {
        mapGLRef.current.setCenter([centerLng, centerLat]);
        mapGLRef.current.setZoom(19); // Close zoom to see the edges clearly
      }

      toast.success(`✅ Created ${newLines.length} edges (${totalLength.toFixed(0)} ft) - zoomed to roof!`);

    } catch (error) {
      console.error('Error converting mask to lines:', error);
      toast.error('Failed to convert mask to edges');
    }
  };

  // Measure roof using AI from the current aerial image
  const measureRoofFromMask = async () => {
    try {
      toast.info('Analyzing roof with AI...');
      
      // Get the image URL - prioritize SAM 2 source image, then fallback to other sources
      const imageUrl = sam2SourceImageUrl || imageryUrl || aerialImages?.[0]?.image_url;
      
      if (!imageUrl) {
        toast.error('No aerial image available');
        return;
      }
      
      await measureRoof.mutateAsync({
        projectId: quoteId,
        imageUrl,
        address: undefined,
        lat: latitude,
        lng: longitude,
        bounds: maskBounds, // Pass the geographic bounds for scale reference
        fallbackPitch: "6/12"
      });
      
    } catch (error) {
      console.error('Error measuring roof:', error);
      toast.error('Failed to measure roof with AI');
    }
  };

  // Smart Select Roof - Click to detect
  const handleSmartSelect = async (event: maplibregl.MapMouseEvent) => {
    if (!mapGLRef.current || !isSmartSelectMode) return;

    try {
      setIsAutoDetecting(true);
      toast.info('Analyzing roof at clicked location...');
      
      // Get click coordinates relative to the image
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Could not find map canvas');

      const rect = canvas.getBoundingClientRect();
      const clickX = (event.originalEvent.clientX - rect.left) / rect.width;
      const clickY = (event.originalEvent.clientY - rect.top) / rect.height;

      console.log('Click position (relative):', { clickX, clickY });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.8);
      });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const imageDataUrl = await base64Promise;

      console.log('Calling smart-select-roof function...');

      // Get map bounds for geographic context
      const mapStateForGeo = mapGLRef.current?.getState();
      const geoBounds = mapGLRef.current && mapStateForGeo ? {
        north: mapStateForGeo.center[1] + (canvas.height / 2) * (156543.03392 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)) / Math.pow(2, mapStateForGeo.zoom) / 111000,
        south: mapStateForGeo.center[1] - (canvas.height / 2) * (156543.03392 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)) / Math.pow(2, mapStateForGeo.zoom) / 111000,
        east: mapStateForGeo.center[0] + (canvas.width / 2) * (156543.03392 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)) / Math.pow(2, mapStateForGeo.zoom) / (111000 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)),
        west: mapStateForGeo.center[0] - (canvas.width / 2) * (156543.03392 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)) / Math.pow(2, mapStateForGeo.zoom) / (111000 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180))
      } : undefined;

      // Calculate click geographic coordinates
      const clickLat = geoBounds ? geoBounds.north - (clickY * (geoBounds.north - geoBounds.south)) : undefined;
      const clickLng = geoBounds ? geoBounds.west + (clickX * (geoBounds.east - geoBounds.west)) : undefined;
      
      // Calculate scale (meters per pixel)
      const metersPerPixel = geoBounds && mapStateForGeo ? 
        (Math.abs(geoBounds.east - geoBounds.west) * 111320 * Math.cos(mapStateForGeo.center[1] * Math.PI / 180)) / canvas.width : 
        undefined;

      console.log('Geographic context:', { geoBounds, clickLat, clickLng, metersPerPixel });

      // Call the edge function with click coordinates and geographic context
      const { data, error } = await supabase.functions.invoke('smart-select-roof', {
        body: { 
          imageDataUrl,
          clickX,
          clickY,
          bounds: geoBounds,
          clickLat,
          clickLng,
          metersPerPixel
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to detect roof');
      }

      console.log('Received detection result:', data);

      if (!data || !data.roofData) {
        throw new Error('No roof data received from AI');
      }

      const { roofDetected, boundingBox, confidence, polygonPoints } = data.roofData;

      if (!roofDetected) {
        toast.warning('No roof detected at clicked location. Try clicking directly on the roof.');
        return;
      }

      // Get map state for coordinate conversion
      const mapState = mapGLRef.current?.getState();
      if (!mapState) throw new Error('Could not get map state');

      // Get the map bounds to convert relative coordinates to lat/lng
      const bounds = {
        north: mapState.center[1] + (canvas.height / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / 111000,
        south: mapState.center[1] - (canvas.height / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / 111000,
        east: mapState.center[0] + (canvas.width / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / (111000 * Math.cos(mapState.center[1] * Math.PI / 180)),
        west: mapState.center[0] - (canvas.width / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / (111000 * Math.cos(mapState.center[1] * Math.PI / 180))
      };
      
      const lngRange = bounds.east - bounds.west;
      const latRange = bounds.north - bounds.south;

      // If we have polygon points, use them; otherwise use bounding box
      let roofBoundary: Line[];
      
      if (polygonPoints && polygonPoints.length >= 3) {
        // Convert polygon points from relative (0-1) to lat/lng
        const coords = polygonPoints.map((pt: { x: number; y: number }) => {
          // Convert from image coordinates (0-1) to map coordinates
          const lng = bounds.west + (pt.x * lngRange);
          const lat = bounds.north - (pt.y * latRange); // Subtract because y increases downward in images
          return [lng, lat] as [number, number];
        });

        // Create lines connecting all points
        roofBoundary = coords.map((coord, i) => {
          const nextCoord = coords[(i + 1) % coords.length];
          const length = Math.round(
            Math.sqrt(
              Math.pow((nextCoord[0] - coord[0]) * 111000 * Math.cos(coord[1] * Math.PI / 180), 2) +
              Math.pow((nextCoord[1] - coord[1]) * 111000, 2)
            ) * 3.28084
          );
          return {
            id: `smart-${Date.now()}-${i}`,
            coords: [coord, nextCoord],
            edgeLabel: i % 2 === 0 ? 'EAVE' : 'RAKE',
            edgeLabels: [i % 2 === 0 ? 'EAVE' : 'RAKE'],
            edgeColor: EDGE_TYPES.find(e => e.key === (i % 2 === 0 ? 'eave' : 'rake'))?.color || '#FF0000',
            length
          };
        });
      } else if (boundingBox) {
        // Fallback to bounding box
        const roofCenterLng = bounds.west + (boundingBox.centerX * lngRange);
        const roofCenterLat = bounds.north - (boundingBox.centerY * latRange);
        
        const halfWidth = (boundingBox.width * lngRange) / 2;
        const halfHeight = (boundingBox.height * latRange) / 2;

        roofBoundary = [
          {
            id: `smart-${Date.now()}-1`,
            coords: [
              [roofCenterLng - halfWidth, roofCenterLat + halfHeight] as [number, number],
              [roofCenterLng + halfWidth, roofCenterLat + halfHeight] as [number, number]
            ],
            edgeLabel: 'EAVE',
            edgeLabels: ['EAVE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'eave')?.color || '#FF0000',
            length: Math.round(halfWidth * 2 * 111000 * 3.28084)
          },
          {
            id: `smart-${Date.now()}-2`,
            coords: [
              [roofCenterLng + halfWidth, roofCenterLat + halfHeight] as [number, number],
              [roofCenterLng + halfWidth, roofCenterLat - halfHeight] as [number, number]
            ],
            edgeLabel: 'RAKE',
            edgeLabels: ['RAKE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'rake')?.color || '#808080',
            length: Math.round(halfHeight * 2 * 111000 * 3.28084)
          },
          {
            id: `smart-${Date.now()}-3`,
            coords: [
              [roofCenterLng + halfWidth, roofCenterLat - halfHeight] as [number, number],
              [roofCenterLng - halfWidth, roofCenterLat - halfHeight] as [number, number]
            ],
            edgeLabel: 'EAVE',
            edgeLabels: ['EAVE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'eave')?.color || '#FF0000',
            length: Math.round(halfWidth * 2 * 111000 * 3.28084)
          },
          {
            id: `smart-${Date.now()}-4`,
            coords: [
              [roofCenterLng - halfWidth, roofCenterLat - halfHeight] as [number, number],
              [roofCenterLng - halfWidth, roofCenterLat + halfHeight] as [number, number]
            ],
            edgeLabel: 'RAKE',
            edgeLabels: ['RAKE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'rake')?.color || '#808080',
            length: Math.round(halfHeight * 2 * 111000 * 3.28084)
          }
        ];
      } else {
        throw new Error('No polygon or bounding box data received');
      }

      // Add the lines
      const newLines = [...lines, ...roofBoundary];
      
      // Detect polygons BEFORE setting state to get the correct index
      const { detectPolygons } = await import('@/lib/polygonDetection');
      const detectedPolygons = detectPolygons(newLines);
      
      console.log('Detected polygons after adding roof:', detectedPolygons.length);
      
      // Find the newly created polygon - it should be the one that matches our roof boundary
      // Get the last/newest polygon (usually the smallest or most recent)
      const newPolygonIndex = detectedPolygons.length - 1;
      
      console.log('Creating facet for polygon index:', newPolygonIndex);
      
      // Create a filled facet for the detected roof BEFORE updating state
      const newFacets = {
        ...currentFacetsRef.current,
        [newPolygonIndex]: ['DM'] // DM = Dimensional Measurement (visible filled polygon)
      };
      
      console.log('New facets state:', newFacets);
      
      // Update everything at once
      setLines(newLines);
      setCurrentFacets(newFacets);
      
      // Save to database
      saveLines(newLines);
      
      // Add to history with the new facet
      addToHistory({ 
        lines: newLines,
        facets: newFacets,
        pitches: currentPitchesRef.current,
        pins: currentPinsRef.current
      });
      
      // Exit smart select mode after successful detection
      setIsSmartSelectMode(false);
      
      toast.success(
        `Roof detected! Confidence: ${Math.round(confidence * 100)}%`,
        {
          description: 'Purple filled polygon created. Switch to Facets tab to edit.'
        }
      );
    } catch (error) {
      console.error('Error in smart select:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to detect roof');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // SAM 2 Click-to-Segment
  const handleSAMClickSegment = async (event: maplibregl.MapMouseEvent) => {
    if (!mapGLRef.current || !isSAMClickMode || isAutoDetecting) return;

    try {
      setIsAutoDetecting(true);
      toast.loading('Segmenting roof with SAM 2...', { id: 'sam2-segment' });
      
      // Get canvas and click coordinates
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Could not find map canvas');

      const rect = canvas.getBoundingClientRect();
      const clickX = (event.originalEvent.clientX - rect.left) / rect.width;
      const clickY = (event.originalEvent.clientY - rect.top) / rect.height;

      console.log('SAM 2 click position (normalized):', { clickX, clickY });

      // Optimize image size to reduce API costs - resize to max 1024px
      const maxSize = 1024;
      const scale = Math.min(1, maxSize / Math.max(canvas.width, canvas.height));
      
      let imageDataUrl: string;
      if (scale < 1) {
        // Create smaller canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Convert to base64 with moderate compression
        const blob = await new Promise<Blob>((resolve, reject) => {
          tempCanvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to capture image')), 'image/jpeg', 0.75);
        });
        
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Use original size
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to capture image')), 'image/jpeg', 0.75);
        });
        
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      console.log('Image size optimized for SAM 2 API');

      // Call SAM 2 edge function with click coordinates
      const { data, error } = await supabase.functions.invoke('segment-roof', {
        body: { 
          imageDataUrl,
          clickX,
          clickY
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to segment roof');
      }

      if (!data || !data.roofDetected) {
        toast.warning('Could not detect roof at click location. Try clicking directly on the roof.', { id: 'sam2-segment' });
        setIsSAMClickMode(false);
        return;
      }

      const { confidence, masks } = data;
      
      if (!masks || !Array.isArray(masks) || masks.length === 0) {
        throw new Error('No masks returned from SAM 2');
      }

      console.log(`Received ${masks.length} masks from SAM 2, analyzing to find best match for click point...`);

      // Try each mask and pick the smallest one that contains the click point
      // This ensures we select the precise object clicked, not adjacent objects
      let bestMask = masks[0]; // Default to first mask
      let smallestNonZeroPixels = Infinity;

      for (const maskUrl of masks) {
        try {
          // Load mask image
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = maskUrl;
          });

          // Create canvas to analyze mask
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.naturalWidth;
          tempCanvas.height = img.naturalHeight;
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) continue;

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          // Check if click point is in this mask (white pixel at click location)
          const clickPixelX = Math.floor(clickX * tempCanvas.width);
          const clickPixelY = Math.floor(clickY * tempCanvas.height);
          const clickPixelIndex = (clickPixelY * tempCanvas.width + clickPixelX) * 4;
          const clickPixelBrightness = (
            imageData.data[clickPixelIndex] + 
            imageData.data[clickPixelIndex + 1] + 
            imageData.data[clickPixelIndex + 2]
          ) / 3;

          if (clickPixelBrightness > 128) {
            // Click point is in this mask, count white pixels to find smallest mask
            let whitePixelCount = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
              const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
              if (brightness > 128) whitePixelCount++;
            }

            if (whitePixelCount < smallestNonZeroPixels && whitePixelCount > 0) {
              smallestNonZeroPixels = whitePixelCount;
              bestMask = maskUrl;
              console.log(`Found better mask with ${whitePixelCount} pixels`);
            }
          }
        } catch (err) {
          console.warn('Error analyzing mask:', err);
        }
      }

      console.log(`Selected best mask with ${smallestNonZeroPixels} pixels`);
      const maskUrl = bestMask;

      console.log('Processing mask from URL:', maskUrl);

      // Get map state for coordinate conversion (needed for overlay bounds)
      const mapState = mapGLRef.current?.getState();
      if (!mapState) throw new Error('Could not get map state');

      // Calculate map bounds
      const bounds = {
        north: mapState.center[1] + (canvas.height / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / 111000,
        south: mapState.center[1] - (canvas.height / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / 111000,
        east: mapState.center[0] + (canvas.width / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / (111000 * Math.cos(mapState.center[1] * Math.PI / 180)),
        west: mapState.center[0] - (canvas.width / 2) * (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, mapState.zoom) / (111000 * Math.cos(mapState.center[1] * Math.PI / 180))
      };

      // Display mask as overlay (like Canva/SAM 2) - no edge tracing!
      await displayMaskOverlay(maskUrl, imageDataUrl, canvas.width, canvas.height, bounds);
      
      toast.success('Roof segmented! Mask overlay applied.', { id: 'sam2-segment' });
      setIsSAMClickMode(false);
    } catch (error) {
      console.error('Error in SAM 2 segmentation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to segment roof',
        { id: 'sam2-segment' }
      );
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Auto-Detect Roof Boundary using SAM
  const handleAutoDetectRoof = async () => {
    if (!latitude || !longitude) {
      toast.error('Location data required for roof detection');
      return;
    }

    setIsAutoDetecting(true);
    toast.loading('Detecting roof boundary with AI...', { id: 'auto-detect' });

    try {
      // Capture the current map view as a base64 image
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('Could not find map canvas');
      }

      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to capture image'));
            return;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.85);
      });

      toast.loading('Processing with SAM AI...', { id: 'auto-detect' });

      const { data, error } = await supabase.functions.invoke('detect-roof-boundary', {
        body: { imageDataUrl }
      });

      if (error) throw error;

      console.log('AI detection result:', data);

      if (data.roofData?.roofDetected) {
        const bbox = data.roofData.boundingBox;
        const mapState = mapGLRef.current?.getState();
        if (!mapState) throw new Error('Could not get map state');

        // Get the canvas element to understand the viewport
        const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('Could not find map canvas');

        // Calculate approximate bounds based on zoom level
        // At zoom 20: 1 degree ≈ 111km, so we need to scale based on the canvas
        const zoom = mapState.zoom;
        const metersPerPixel = (156543.03392 * Math.cos(mapState.center[1] * Math.PI / 180)) / Math.pow(2, zoom);
        
        // Estimate visible area in degrees
        const canvasWidthMeters = canvas.width * metersPerPixel;
        const canvasHeightMeters = canvas.height * metersPerPixel;
        const degreesPerMeter = 1 / 111000; // Approximate at equator
        
        const viewWidthDegrees = canvasWidthMeters * degreesPerMeter;
        const viewHeightDegrees = canvasHeightMeters * degreesPerMeter;
        
        // Convert AI's relative coordinates (0-1) to actual lat/lng
        // AI gives us centerX/Y relative to the image
        const roofCenterLng = mapState.center[0] + ((bbox.centerX - 0.5) * viewWidthDegrees);
        const roofCenterLat = mapState.center[1] + ((0.5 - bbox.centerY) * viewHeightDegrees); // Flip Y
        
        // Convert AI's relative size to actual degrees
        const halfWidth = (bbox.width * viewWidthDegrees) / 2;
        const halfHeight = (bbox.height * viewHeightDegrees) / 2;

        // Create rectangular boundary based on AI detection
        const roofBoundary: Line[] = [
          {
            id: `auto-${Date.now()}-1`,
            coords: [
              [roofCenterLng - halfWidth, roofCenterLat + halfHeight] as [number, number],
              [roofCenterLng + halfWidth, roofCenterLat + halfHeight] as [number, number]
            ],
            edgeLabel: 'EAVE',
            edgeLabels: ['EAVE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'eave')?.color || '#FF0000',
            length: Math.round(halfWidth * 2 * 111000 * 3.28084) // Convert to feet
          },
          {
            id: `auto-${Date.now()}-2`,
            coords: [
              [roofCenterLng + halfWidth, roofCenterLat + halfHeight] as [number, number],
              [roofCenterLng + halfWidth, roofCenterLat - halfHeight] as [number, number]
            ],
            edgeLabel: 'RAKE',
            edgeLabels: ['RAKE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'rake')?.color || '#808080',
            length: Math.round(halfHeight * 2 * 111000 * 3.28084)
          },
          {
            id: `auto-${Date.now()}-3`,
            coords: [
              [roofCenterLng + halfWidth, roofCenterLat - halfHeight] as [number, number],
              [roofCenterLng - halfWidth, roofCenterLat - halfHeight] as [number, number]
            ],
            edgeLabel: 'EAVE',
            edgeLabels: ['EAVE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'eave')?.color || '#FF0000',
            length: Math.round(halfWidth * 2 * 111000 * 3.28084)
          },
          {
            id: `auto-${Date.now()}-4`,
            coords: [
              [roofCenterLng - halfWidth, roofCenterLat - halfHeight] as [number, number],
              [roofCenterLng - halfWidth, roofCenterLat + halfHeight] as [number, number]
            ],
            edgeLabel: 'RAKE',
            edgeLabels: ['RAKE'],
            edgeColor: EDGE_TYPES.find(e => e.key === 'rake')?.color || '#808080',
            length: Math.round(halfHeight * 2 * 111000 * 3.28084)
          }
        ];

        setLines(prev => [...prev, ...roofBoundary]);
        addToHistory({ lines: [...lines, ...roofBoundary] });
        saveLines([...lines, ...roofBoundary]);

        toast.success(`Roof detected! ${data.roofData.roofShape} - ${Math.round(data.roofData.confidence * 100)}% confidence`, { 
          id: 'auto-detect',
          description: 'Adjust vertices and edge types as needed'
        });
      } else {
        toast.warning('No roof detected. Try manual drawing instead.', { id: 'auto-detect' });
      }
    } catch (error: any) {
      console.error('Auto-detection error:', error);
      toast.error('Failed to auto-detect roof boundary', { 
        id: 'auto-detect',
        description: error.message 
      });
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Helper: Compress image data URL to reduce payload size
  const compressImageDataUrl = async (
    dataUrl: string, 
    maxSizeKB: number = 500, 
    maxDimension: number = 1024
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Reduce resolution to specified max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.7 and reduce if needed
        let quality = 0.7;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Keep reducing quality until under maxSizeKB
        while (compressed.length > maxSizeKB * 1024 && quality > 0.2) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        
        console.log(`📦 Compressed: ${(dataUrl.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (${width}x${height}, q:${quality.toFixed(1)})`);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = dataUrl;
    });
  };

  // Smart Complete Analysis - AI-powered with geographic context
  const runSmartCompleteAnalysis = async () => {
    if (!maskOverlayUrl || !maskBounds) {
      toast.info('Click on the roof to create the purple mask first', { duration: 3000 });
      setIsSAMClickMode(true);
      return;
    }

    if (!latitude || !longitude) {
      toast.error('Location data required for AI analysis');
      return;
    }

    setIsAnalyzingVision(true);
    const startTime = Date.now();
    
    try {
      console.log('🤖 Starting AI Roof Analysis with Gemini...');
      toast.loading('🤖 AI analyzing roof with geographic context...', { id: 'smart-analysis' });
      
      // Get current map view
      const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (!mapCanvas) {
        throw new Error('Map canvas not found');
      }
      
      const aerialImageUrl = mapCanvas.toDataURL('image/jpeg', 0.85);
      console.log(`📸 Captured aerial image: ${(aerialImageUrl.length / 1024).toFixed(0)}KB`);
      
      // Calculate scale
      const mapState = mapGLRef.current?.getState();
      const metersPerPixel = mapState ? 
        (Math.abs(maskBounds.east - maskBounds.west) * 111320 * Math.cos(latitude * Math.PI / 180)) / mapCanvas.width : 
        0.5;

      console.log('📍 Geographic context:', {
        bounds: maskBounds,
        centerLat: latitude,
        centerLng: longitude,
        metersPerPixel
      });

      // Call AI edge function with geographic context
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('ai-roof-analysis', {
        body: {
          aerialImageUrl,
          maskImageUrl: maskOverlayUrl,
          bounds: maskBounds,
          centerLat: latitude,
          centerLng: longitude,
          metersPerPixel
        }
      });
      
      if (analysisError) {
        console.error('Edge function error:', analysisError);
        throw new Error(analysisError.message || 'AI analysis failed');
      }
      
      if (!analysisData?.analysis?.edges || analysisData.analysis.edges.length === 0) {
        throw new Error('No roof edges detected by AI');
      }
      
      const { analysis } = analysisData;
      console.log(`✅ AI detected ${analysis.edges.length} edges`);
      console.log(`📊 Roof type: ${analysis.roofType}, confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      
      // Convert AI edges to our Line format
      const detectedLines: Line[] = analysis.edges.map((edge: any, i: number) => {
        const edgeColor = EDGE_TYPES.find(e => e.key === edge.edgeType.toLowerCase())?.color || '#808080';
        
        return {
          id: `ai-geo-${Date.now()}-${i}`,
          coords: [edge.start, edge.end],
          edgeLabel: edge.edgeType,
          edgeLabels: [edge.edgeType],
          edgeColor,
          length: Math.round(edge.lengthFeet || 0)
        };
      });
      
      // Add edges to map
      const updatedLines = [...lines, ...detectedLines];
      setLines(updatedLines);
      addToHistory({ lines: updatedLines });
      saveLines(updatedLines);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      toast.success(`✅ AI Analysis Complete in ${elapsed}s!`, { 
        id: 'smart-analysis',
        description: `${analysis.roofType} roof - ${detectedLines.length} edges - ${(analysis.confidence * 100).toFixed(0)}% confidence`
      });
      
    } catch (error: any) {
      console.error('❌ AI analysis failed:', error);
      toast.error('AI Analysis Failed', { 
        id: 'smart-analysis',
        description: error.message
      });
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Complete AI Roof Analysis with Gemini Vision
  const runVisionAnalysis = async (roofPoints?: {lng: number, lat: number}[]) => {
    if (!latitude || !longitude) {
      toast.error('Location data required');
      return;
    }

    setIsAnalyzingVision(true);
    const startTime = Date.now();
    
    try {
      console.log('🤖 Starting AI Vision Analysis with Gemini...');
      if (roofPoints && roofPoints.length > 0) {
        console.log(`📍 Using ${roofPoints.length} guided roof points`);
      }
      toast.loading('🤖 Calling Gemini AI to analyze roof edges...', { id: 'vision-analysis' });
      
      // Capture current map view as data URL - try multiple canvas selectors
      let mapCanvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
      if (!mapCanvas) {
        mapCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      }
      if (!mapCanvas) {
        throw new Error('Map canvas not found - please ensure map is loaded');
      }
      
      const imageDataUrl = mapCanvas.toDataURL('image/jpeg', 0.85);
      console.log(`📸 Map image captured: ${(imageDataUrl.length / 1024).toFixed(0)}KB`);
      
      toast.loading('📡 Sending to AI edge function...', { id: 'vision-analysis' });
      
      // Call the vision analysis edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('vision-roof-analysis', {
        body: {
          imageDataUrl,
          maskImageUrl: maskOverlayUrl,
          maskBounds,
          latitude,
          longitude,
          quoteId,
          roofPoints // Pass guided points if provided
        }
      });
      
      if (analysisError) {
        console.error('Edge function error:', analysisError);
        throw new Error(analysisError.message || 'AI analysis failed');
      }
      
      if (!analysisData?.analysis?.edges || analysisData.analysis.edges.length === 0) {
        throw new Error('No roof edges detected by AI');
      }
      
      const { analysis } = analysisData;
      console.log(`✅ AI detected ${analysis.edges.length} edges`);
      console.log(`📊 Roof type: ${analysis.roofType}, confidence: ${(analysis.confidenceScore * 100).toFixed(1)}%`);
      
      toast.loading(`📊 Drawing ${analysis.edges.length} detected edges...`, { id: 'vision-analysis' });
      
      // Convert AI edges to our Line format
      const detectedLines: Line[] = analysis.edges.map((edge: any, i: number) => {
        const edgeColor = EDGE_TYPES.find(e => e.key === edge.edgeType.toLowerCase())?.color || '#808080';
        
        return {
          id: `ai-vision-${Date.now()}-${i}`,
          coords: [edge.start, edge.end],
          edgeLabel: edge.edgeType,
          edgeLabels: [edge.edgeType],
          edgeColor,
          length: Math.round(edge.length)
        };
      });
      
      // Add edges to map
      const updatedLines = [...lines, ...detectedLines];
      setLines(updatedLines);
      addToHistory({ lines: updatedLines });
      saveLines(updatedLines);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      toast.success(`✅ AI Analysis Complete! ${detectedLines.length} edges in ${elapsed}s`, { 
        id: 'vision-analysis',
        description: `${analysis.roofType} roof - ${(analysis.confidenceScore * 100).toFixed(0)}% confidence`
      });
      
      setTimeout(() => {
        toast.info('💡 Review edges in the Draw tab. Adjust as needed!', {
          duration: 3000
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ AI vision analysis failed:', error);
      toast.error('AI Analysis Failed', { 
        id: 'vision-analysis',
        description: error.message
      });
    } finally {
      setIsAnalyzingVision(false);
    }
  };
  
  // Handle canvas resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = {
      startY: e.clientY,
      startHeight: canvasHeight
    };
    setIsResizing(true);
  };
  
  useEffect(() => {
    if (!isResizing || !resizeStartRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const delta = e.clientY - resizeStartRef.current.startY;
      const newHeight = resizeStartRef.current.startHeight + delta;
      const clampedHeight = Math.max(300, Math.min(newHeight, window.innerHeight - 200));
      setCanvasHeight(clampedHeight);
      // Save to localStorage immediately during resize
      localStorage.setItem(`canvas-height-${quoteId}`, clampedHeight.toString());
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, canvasHeight, quoteId]);
  const handleLinesChange = (newLines: Line[]) => {
    const prevLines = lines;
    
    // Check if we need calibration FIRST (first line after AI enhancement)
    if (needsCalibration && newLines.length > prevLines.length) {
      const newlyAddedLines = newLines.filter(
        newLine => !prevLines.some(oldLine => oldLine.id === newLine.id)
      );
      
      if (newlyAddedLines.length > 0) {
        const firstNewLine = newlyAddedLines[0];
        setLines(newLines);
        setCalibrationLineId(firstNewLine.id);
        setShowCalibrationDialog(true);
        setNeedsCalibration(false); // Only calibrate once
        return; // Don't save or track until calibration is done
      }
    }
    
    // Apply calibration ratio to new lines if we have one
    let processedLines = newLines;
    if (pixelToFeetRatio && newLines.length > prevLines.length) {
      processedLines = newLines.map(line => {
        const [s, e] = line.coords;
        const pxLen = Math.sqrt(Math.pow(e[0] - s[0], 2) + Math.pow(e[1] - s[1], 2));
        return {
          ...line,
          length: Math.round(pxLen * pixelToFeetRatio)
        };
      });
    }
    
    setLines(processedLines);
    addToHistory({ lines: processedLines });
    saveLines(processedLines);
    
    // Track line changes
    trackAction('lines_changed', {
      previousCount: prevLines.length,
      newCount: processedLines.length,
      added: processedLines.length - prevLines.length,
      removed: prevLines.length - processedLines.length
    });
    
    // Save new lines to AI training data during active training session
    if (isTracking && processedLines.length > prevLines.length) {
      // Find newly added lines
      const newlyAddedLines = newLines.filter(
        newLine => !prevLines.some(oldLine => oldLine.id === newLine.id)
      );
      
      // Save each new line to training data
      newlyAddedLines.forEach(line => {
        const lineAngle = calculateLineAngle(line);
        saveEdgeTraining({
          lineGeometry: { type: 'LineString', coordinates: line.coords },
          edgeType: line.edgeLabel || 'UNLABELED',
          lengthFt: line.length,
          angleDegrees: lineAngle,
          neighboringLines: findNeighboringLines(line, newLines),
          roofContext: {
            totalEdges: newLines.length,
            complexity: calculateRoofComplexity(newLines),
            patterns: detectEdgePatterns(newLines)
          },
          drawingSequence: {
            orderInSession: newLines.length,
            timeSinceSessionStart: Date.now()
          }
        });
      });
      
      console.log('💾 Saved', newlyAddedLines.length, 'new lines to AI training data');
    }
  };

  // Handle calibration submission
  const handleCalibrationSubmit = () => {
    const actualFeet = parseFloat(calibrationInput);
    
    if (!actualFeet || actualFeet <= 0 || !calibrationLineId) {
      toast.error('Please enter a valid measurement');
      return;
    }
    
    // Find the calibration line
    const calibLine = lines.find(l => l.id === calibrationLineId);
    if (!calibLine) {
      toast.error('Calibration line not found');
      return;
    }
    
    // Calculate pixel length
    const [start, end] = calibLine.coords;
    const pixelLength = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
    );
    
    // Calculate ratio: actual feet / pixel length
    const ratio = actualFeet / pixelLength;
    setPixelToFeetRatio(ratio);
    
    // Update all existing lines with new calibrated measurements
    const recalibratedLines = lines.map(line => {
      const [s, e] = line.coords;
      const pxLen = Math.sqrt(Math.pow(e[0] - s[0], 2) + Math.pow(e[1] - s[1], 2));
      return {
        ...line,
        length: Math.round(pxLen * ratio)
      };
    });
    
    setLines(recalibratedLines);
    saveLines(recalibratedLines);
    
    toast.success(`Calibrated! 1 pixel = ${ratio.toFixed(4)} feet`, {
      description: 'All measurements will now use this calibration'
    });
    
    setShowCalibrationDialog(false);
    setCalibrationInput('');
    setCalibrationLineId(null);
  };

  // Fetch and visualize AI learned lines from training data one by one
  const showAITrackedLines = async () => {
    try {
      // Fetch actual training data the AI has learned from this quote
      const { data: trainingData, error } = await supabase
        .from('edge_training_data')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true }); // Show in order they were drawn
      
      if (error) throw error;
      
      if (trainingData && trainingData.length > 0) {
        console.log('🤖 Raw AI Training Data:', trainingData);
        
        // Convert training data back to Line format for visualization
        const learned: Line[] = trainingData
          .filter((data: any) => {
            const geom = data.line_geometry as any;
            return geom && geom.coordinates && Array.isArray(geom.coordinates) && geom.coordinates.length === 2;
          })
          .map((data: any, index: number) => {
            const geom = data.line_geometry as any;
            const coords = geom.coordinates;
            
            // Ensure coords are in the correct format [start, end]
            const validCoords = coords.map((c: any) => 
              Array.isArray(c) ? [c[0], c[1]] : [c.lng || c[0], c.lat || c[1]]
            );
            
            return {
              id: `ai-learned-${index}-${Date.now()}`,
              coords: validCoords as [[number, number], [number, number]],
              edgeLabel: data.edge_type || 'LEARNED',
              edgeLabels: [data.edge_type || 'LEARNED'],
              edgeColor: '#00FF00', // Bright green to show AI mastered these
              length: data.length_ft || 0
            };
          });
        
        if (learned.length > 0) {
          setShowTrackedLines(true);
          
          const edgeTypes = [...new Set(learned.map(l => l.edgeLabel))];
          toast.success(`AI replaying ${learned.length} learned drawings`, {
            description: 'Watch the AI recreate what it learned'
          });
          
          // Show lines one by one with delay
          for (let i = 0; i < learned.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay between each line
            setTrackedLinesData(prev => [...prev, learned[i]]);
          }
          
          console.log('✅ AI Learned Visualization:', {
            totalLearned: learned.length,
            edgeTypes,
            sampleLine: learned[0]
          });
        } else {
          toast.info('AI training data exists but no valid line geometries found');
        }
      } else {
        toast.info('No AI training data yet', {
          description: 'Start training and draw lines to teach the AI'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching AI training data:', error);
      toast.error('Failed to fetch AI learning data');
    }
  };

  // AI Auto-Draw: Intelligently predict roof lines using learned patterns from ALL training data
  const aiAutoDraw = async () => {
    if (!latitude || !longitude) {
      toast.error('Location required', {
        description: 'Property location is needed for AI prediction'
      });
      return;
    }
    
    setIsAutoDrawing(true);
    toast.loading('AI analyzing roof imagery...', { id: 'auto-draw' });
    
    try {
      // Fetch aerial imagery for vision analysis
      const { data: imageryData } = await supabase
        .from('aerial_images')
        .select('*')
        .eq('quote_request_id', quoteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const useVisionMode = !!imageryData?.image_url;
      
      if (useVisionMode) {
        console.log('🔍 Using Computer Vision mode with aerial imagery');
        toast.loading('Using ML vision to analyze roof from satellite imagery...', { id: 'auto-draw' });
      } else {
        console.log('📊 Using Statistical Learning mode (no imagery available)');
        toast.loading('Using statistical patterns from training data...', { id: 'auto-draw' });
      }
      
      // Call AI edge function with vision capabilities
      const { data, error } = await supabase.functions.invoke('ai-roof-prediction', {
        body: {
          latitude,
          longitude,
          quoteId,
          existingLines: lines, // Pass current lines so AI can complete the roof
          imageUrl: imageryData?.image_url, // Provide imagery if available
          useVision: useVisionMode // Enable vision mode
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error('AI prediction failed');
      
      const analysisMethod = data.method === 'computer-vision' ? 'Computer Vision' : 'Statistical Learning';
      const confidenceScore = Math.round((data.confidenceScore || 0.7) * 100);
      
      console.log(`🤖 AI ${analysisMethod} analysis:`, data);
      console.log(`📊 Confidence Score: ${confidenceScore}%`);
      
      toast.loading(`${analysisMethod} predicted ${data.lines.length} edges (${confidenceScore}% confidence)`, { id: 'auto-draw' });
      
      const newLines: Line[] = data.lines.map((line: any, index: number) => {
        const edgeColor = EDGE_TYPES.find(e => e.key === line.edgeType.toLowerCase())?.color || '#FF6B6B';
        
        return {
          id: `ai-auto-${Date.now()}-${index}`,
          coords: [line.start as [number, number], line.end as [number, number]],
          edgeLabel: line.edgeType,
          edgeLabels: [line.edgeType],
          edgeColor,
          length: Math.round(line.length)
        };
      });
          
      if (newLines.length > 0) {
        toast.success(`Drawing ${newLines.length} AI-predicted lines...`, { id: 'auto-draw' });
        
        // Add lines one by one with delay for visual effect
        for (let i = 0; i < newLines.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setLines(prev => [...prev, newLines[i]]);
          toast.loading(`Drawing line ${i + 1} of ${newLines.length}...`, { id: 'auto-draw' });
        }
        
        // Add to history and save the AI predictions
        addToHistory({ lines: newLines });
        saveLines(newLines);
        
        const learningMessage = data.method === 'computer-vision' 
          ? `${analysisMethod} analyzed satellite imagery with ${confidenceScore}% confidence!`
          : `${analysisMethod} used patterns from ${data.trainingContext?.samplesUsed || 0} learned examples!`;
        
        toast.success(learningMessage, { id: 'auto-draw' });
      } else {
        toast.info('AI couldn\'t detect roof edges. Try drawing a few lines first!', { id: 'auto-draw' });
      }
    } catch (error) {
      console.error('❌ Error with AI auto-draw:', error);
      toast.error('Failed to auto-draw', { id: 'auto-draw' });
    } finally {
      setIsAutoDrawing(false);
    }
  };

  // Calculate metrics
  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  
  // Calculate total area from detected polygons
  const detectedPolygons = detectPolygons(lines);
  const totalArea = detectedPolygons.reduce((sum, polygon) => {
    // Convert polygon coords to format expected by geodesicArea
    const coords = polygon.coords.map(coord => [coord[0], coord[1]]);
    // Close the polygon if not already closed
    if (coords.length > 0 && 
        (coords[0][0] !== coords[coords.length - 1][0] || 
         coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]);
    }
    return sum + geodesicArea(coords);
  }, 0);
  
  // Check both edgeLabel and edgeLabels for filtering
  const hasLabel = (line: Line, search: string) => {
    const labels = line.edgeLabels && line.edgeLabels.length > 0 ? line.edgeLabels : [line.edgeLabel];
    return labels.some(label => label.toLowerCase().includes(search.toLowerCase()));
  };
  
  const eaveLength = lines.filter(l => hasLabel(l, 'eave')).reduce((sum, l) => sum + l.length, 0);
  const rakeLength = lines.filter(l => hasLabel(l, 'rake')).reduce((sum, l) => sum + l.length, 0);
  const ridgeLength = lines.filter(l => hasLabel(l, 'ridge')).reduce((sum, l) => sum + l.length, 0);

  if (!latitude || !longitude) {
    return <div className="flex items-center justify-center h-[calc(100vh-7rem)] text-gray-500">
        No location data available for this quote
      </div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-7rem)] text-gray-500">
        Loading saved drawings...
      </div>;
  }

  return <div className={`flex gap-4 ${isFullscreen ? 'flex-1 min-h-0' : 'h-[calc(100vh-7rem)]'}`}>
      {/* Initial "Please set scale" Dialog */}
      <Dialog open={showSetScaleDialog} onOpenChange={setShowSetScaleDialog}>
        <DialogContent className="max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle>Please set scale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please draw a line of a known length. You will then be prompted to input that length to set the scale.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowSetScaleDialog(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calibration Input Dialog */}
      <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
        <DialogContent className="max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle>
              Please input the length in FEET of the line drawn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={calibrationInput}
              onChange={(e) => setCalibrationInput(e.target.value)}
              placeholder="Distance in feet"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCalibrationSubmit();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCalibrationDialog(false);
                setCalibrationInput('');
                setCalibrationLineId(null);
              }}
            >
              CANCEL
            </Button>
            <Button onClick={handleCalibrationSubmit}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Canvas */}
      <div className={`flex-1 flex flex-col gap-2 ${isFullscreen ? 'min-h-0' : ''}`}>
        {/* View Tabs: Satellite vs Street */}
        <Tabs value={viewTab} onValueChange={setViewTab} className={isFullscreen ? "w-full flex-1 flex flex-col min-h-0" : "w-full"}>
          <TabsList className="bg-white border rounded-lg p-1">
            <TabsTrigger value="satellite" className="px-6">Satellite</TabsTrigger>
            <TabsTrigger value="imagery" className="px-6">Satellite 3D</TabsTrigger>
          </TabsList>

          <TabsContent value="imagery" className="mt-2">
            <ImageryTab projectId={quoteId} latitude={latitude} longitude={longitude} />
          </TabsContent>

          <TabsContent value="satellite" className={`mt-2 flex flex-col gap-2 ${isFullscreen ? 'flex-1 min-h-0' : 'h-full'}`}>
            {/* Satellite View Content */}
        {/* View Options Bar */}
        <div className="bg-white/95 backdrop-blur-sm border-b px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-t-lg shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">View:</span>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
              Grid
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
              Labels
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={showLength} onChange={e => setShowLength(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
              Lengths
            </label>
            {solarAnalysis && (
              <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors sm:border-l sm:pl-4 sm:ml-2">
                <input 
                  type="checkbox" 
                  checked={showSolarOverlay} 
                  onChange={e => setShowSolarOverlay(e.target.checked)} 
                  className="w-3.5 h-3.5 cursor-pointer" 
                />
                Solar API Overlay
              </label>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <div className="hidden">
              <LearningProgressBadge 
                isTracking={isTracking}
                onStartLearning={startSession}
                onStopLearning={stopSession}
                stats={stats}
              />
            </div>
            
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                console.log('🎯 AI Auto-Draw clicked', { latitude, longitude, isAutoDrawing });
                aiAutoDraw();
              }}
              className="hidden gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs"
              disabled={isAutoDrawing || !latitude || !longitude}
              title={!latitude || !longitude ? "Location required" : isAutoDrawing ? "AI analyzing patterns..." : "AI will predict roof lines from learned drawings"}
            >
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isAutoDrawing ? 'Predicting...' : 'AI Auto-Draw'}</span>
              <span className="sm:hidden">AI</span>
            </Button>
            
            <Button
              size="sm"
              variant={showTrackedLines ? "default" : "outline"}
              onClick={() => {
                if (showTrackedLines) {
                  setShowTrackedLines(false);
                  setTrackedLinesData([]);
                  toast.info('Hidden AI mastered drawings');
                } else {
                  showAITrackedLines();
                }
              }}
              className="hidden gap-2 text-xs"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{showTrackedLines ? 'Hide' : 'Show'} Learned</span>
            </Button>
            
            <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Clear multi-select when switching tabs
            if (value === 'draw') {
              setSelectedEdgeLabels([]);
              setSelectedGroupId(null);
            }
          }}>
            <TabsList className="h-8">
              <TabsTrigger value="draw" className="gap-1 text-xs px-2">
                <Pencil className="w-3 h-3" />
                <span className="hidden sm:inline">DRAW</span>
              </TabsTrigger>
              <TabsTrigger value="edges" className="gap-1 text-xs px-2">
                <Minus className="w-3 h-3" />
                <span className="hidden sm:inline">EDGES</span>
              </TabsTrigger>
              <TabsTrigger value="facets" className="gap-1 text-xs px-2">
                <Square className="w-3 h-3" />
                <span className="hidden sm:inline">FACETS</span>
              </TabsTrigger>
              <TabsTrigger value="pins" className="gap-1 text-xs px-2">
                <MapPin className="w-3 h-3" />
                <span className="hidden sm:inline">PINS</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          </div>
        </div>

        {/* Map Container with Integrated Drawing */}
        <div 
          ref={mapContainerRef}
          style={isFullscreen ? undefined : { height: `${canvasHeight}px` }}
          className={`bg-gray-900 rounded-lg overflow-hidden relative ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
          onContextMenu={(e) => {
            e.preventDefault();
            
            // Allow toggling with right-click in all modes
            if (!selectedEdgeAction) {
              const unlabeled = edgeCategories?.find(cat => cat.key === 'unlabeled');
              if (unlabeled) {
                setSelectedEdgeAction({
                  key: unlabeled.key,
                  label: unlabeled.label,
                  color: unlabeled.color
                });
                toast.info(`Drawing: ${unlabeled.label}`, { duration: 1500 });
              }
            } else {
              setSelectedEdgeAction(null);
              toast.info('Drawing tool deselected', { duration: 1500 });
            }
          }}
        >
          <MapCanvasGL
            ref={mapGLRef} 
            initialCenter={
              viewTab === 'satellite' && backgroundImageData?.roi_image_center_lng && backgroundImageData?.roi_image_center_lat
                ? [backgroundImageData.roi_image_center_lng, backgroundImageData.roi_image_center_lat]
                : savedPosition ? savedPosition.center : [longitude, latitude]
            }
            initialZoom={
              viewTab === 'satellite' && backgroundImageData?.roi_image_zoom
                ? backgroundImageData.roi_image_zoom
                : savedPosition ? savedPosition.zoom : 19
            }
            initialBearing={
              viewTab === 'satellite' && backgroundImageData?.roi_image_bearing !== undefined
                ? backgroundImageData.roi_image_bearing
                : savedPosition ? savedPosition.bearing : 0
            }
            selectedEdgeAction={selectedEdgeAction}
            selectedLabels={selectedEdgeLabels}
            lines={showTrackedLines ? [...lines, ...trackedLinesData.map(l => ({ ...l, edgeColor: '#00FF00' }))] : lines}
            mode={activeTab === 'draw' ? 'draw' : activeTab === 'facets' ? 'facets' : activeTab === 'pins' ? 'pins' : 'edges'}
            selectedFacet={selectedFacet}
            selectedFacetValue={selectedFacetValue}
            selectedPin={selectedPin}
            initialFacets={currentFacets}
            initialPitches={currentPitches}
            initialPins={currentPins}
            isDeleteMode={isDeleteMode}
            isVertexDragMode={isVertexDragMode}
            onVertexMoveActiveChange={setIsVertexMoveActive}
            onLineClick={handleLineClick}
            onDeleteModeCancel={() => {
              setIsDeleteMode(false);
              toast.info('Delete mode cancelled');
            }}
            solarSegments={showSolarOverlay && solarAnalysis?.parsed_roof_data?.segments ? solarAnalysis.parsed_roof_data.segments : undefined}
            onMove={state => {
              setBearing(state.bearing);
              // Save map position to localStorage for persistence
              const positionData = {
                center: state.center,
                zoom: state.zoom,
                bearing: state.bearing
              };
              localStorage.setItem(`map-position-${quoteId}`, JSON.stringify(positionData));
              setSavedPosition(positionData);
            }}
            onLinesChange={handleLinesChange}
            onMapClick={isSmartSelectMode ? handleSmartSelect : isSAMClickMode ? handleSAMClickSegment : undefined}
            onStateChange={(state) => {
              // Update refs immediately
              if (state.facets !== undefined) currentFacetsRef.current = state.facets;
              if (state.pitches !== undefined) currentPitchesRef.current = state.pitches;
              if (state.pins !== undefined) currentPinsRef.current = state.pins;
              
              // CRITICAL: Also update state immediately to keep props in sync
              // This prevents stale props from reverting changes when parent re-renders
              if (state.facets !== undefined) setCurrentFacets(state.facets);
              if (state.pitches !== undefined) setCurrentPitches(state.pitches);
              if (state.pins !== undefined) setCurrentPins(state.pins);
              
              // Check if state actually changed before adding to history
              const currentState = history[historyIndex];
              const facetsChanged = state.facets !== undefined && JSON.stringify(state.facets) !== JSON.stringify(currentState.facets);
              const pitchesChanged = state.pitches !== undefined && JSON.stringify(state.pitches) !== JSON.stringify(currentState.pitches);
              const pinsChanged = state.pins !== undefined && JSON.stringify(state.pins) !== JSON.stringify(currentState.pins);
              
              // Only add to history if something actually changed
              if (facetsChanged || pitchesChanged || pinsChanged) {
                addToHistory({
                  lines: linesRef.current,
                  facets: currentFacetsRef.current,
                  pitches: currentPitchesRef.current,
                  pins: currentPinsRef.current
                });
              }
            }}
            showGrid={showGrid} 
            showLabels={showLabels} 
            showLength={showLength} 
            showDebug={showDebug} 
            isLocked={false}
            onLockChange={(locked) => {
              console.log('🔓 Map lock change requested:', locked);
              setIsMapLocked(locked);
              // Save position to localStorage when locking
              if (locked && mapGLRef.current) {
                const state = mapGLRef.current.getState();
                const position = {
                  center: state.center,
                  zoom: state.zoom,
                  bearing: state.bearing,
                  isLocked: true
                };
                localStorage.setItem(`map-position-${quoteId}`, JSON.stringify(position));
                toast.success('Map position saved');
              } else {
                // Clear saved position when unlocking
                localStorage.removeItem(`map-position-${quoteId}`);
              }
            }} 
            backgroundImageUrl={null}
            backgroundImageBounds={null}
            className="w-full h-full"
          />
          
          {/* SAM 2 Mask Overlay - Display ONLY the selected object (like Canva) */}
          {maskOverlayUrl && (
            <div className="absolute inset-0 z-[600] pointer-events-none">
              <img 
                src={maskOverlayUrl} 
                alt="Selected area mask" 
                crossOrigin="anonymous"
                className="w-full h-full object-cover opacity-0"
                style={{ visibility: 'hidden' }}
                onLoad={(e) => {
                  // When mask loads, process it to show only the selected area
                  const img = e.currentTarget;
                  const canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    try {
                      // Draw the mask
                      ctx.drawImage(img, 0, 0);
                      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                      const data = imageData.data;
                      
                      // Convert mask to purple overlay: white pixels become purple, black stays transparent
                      for (let i = 0; i < data.length; i += 4) {
                        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        if (brightness > 128) {
                          // White area (selected object) → show purple with 60% opacity
                          data[i] = 168;     // R
                          data[i + 1] = 85;   // G
                          data[i + 2] = 247;  // B
                          data[i + 3] = 153;  // A (60% of 255)
                        } else {
                          // Black area (not selected) → transparent
                          data[i + 3] = 0;
                        }
                      }
                      
                      ctx.putImageData(imageData, 0, 0);
                      
                      // Replace the overlay with the processed version
                      const overlayDiv = document.getElementById('sam-mask-overlay');
                      if (overlayDiv) {
                        overlayDiv.style.backgroundImage = `url(${canvas.toDataURL()})`;
                        overlayDiv.style.backgroundSize = '100% 100%';
                        overlayDiv.style.backgroundRepeat = 'no-repeat';
                      }
                    } catch (err) {
                      console.error('Error processing mask:', err);
                      // Fallback: show the mask directly with CSS masking
                      const overlayDiv = document.getElementById('sam-mask-overlay');
                      if (overlayDiv) {
                        overlayDiv.style.backgroundColor = 'rgba(168, 85, 247, 0.6)';
                        overlayDiv.style.maskImage = `url(${maskOverlayUrl})`;
                        overlayDiv.style.webkitMaskImage = `url(${maskOverlayUrl})`;
                        overlayDiv.style.maskSize = '100% 100%';
                        overlayDiv.style.webkitMaskSize = '100% 100%';
                      }
                    }
                  }
                }}
              />
              <div 
                id="sam-mask-overlay"
                className="absolute inset-0"
              />
              <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                <button
                  onClick={measureRoofFromMask}
                  className="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 font-medium"
                  title="Measure roof from mask"
                >
                  <Ruler className="w-4 h-4" />
                  Measure Roof
                </button>
                <button
                  onClick={() => {
                    setMaskOverlayUrl(null);
                    setMaskBounds(null);
                    setSam2SourceImageUrl(null);
                  }}
                  className="bg-white/90 hover:bg-white text-black p-2 rounded-lg shadow-lg transition-colors"
                  title="Clear mask overlay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Roof Measurement Panel */}
      {roofMeasurement && (
        <RoofMeasurementPanel 
          measurements={{
            area: roofMeasurement.data.area.total_sq_ft,
            perimeter: roofMeasurement.data.derived.total_perimeter_lf,
            squares: roofMeasurement.data.area.total_squares,
            eaves: roofMeasurement.data.linear.eave_edge_lf,
            rakes: roofMeasurement.data.linear.rake_edge_lf
          }}
          onClose={() => {}}
        />
      )}

      {/* AI Roof Quote Estimator */}
      {extractedMaskPolygon.length > 0 && (
        <QuoteEstimatorPanel
          maskPolygon={extractedMaskPolygon}
          imageUrl={sam2SourceImageUrl || imageryUrl || ''}
          quoteId={quoteId}
          onQuoteGenerated={(estimate) => {
            toast.success('Quote generated successfully!');
            console.log('Generated quote:', estimate);
          }}
        />
      )}
          
          {/* Live Metrics with Solar Comparison */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm z-[700] pointer-events-none">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400">Total Area</div>
                <div className="font-semibold">{Math.round(totalArea)} sqft</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Eave</div>
                <div className="font-semibold text-orange-400">
                  {eaveLength}'
                  {solarAnalysis?.parsed_roof_data?.edgeEstimates?.eave_lf && (
                    <span className="text-xs ml-1 text-gray-400">
                      (AI: {Math.round(solarAnalysis.parsed_roof_data.edgeEstimates.eave_lf)}')
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Rake</div>
                <div className="font-semibold text-blue-400">
                  {rakeLength}'
                  {solarAnalysis?.parsed_roof_data?.edgeEstimates?.rake_lf && (
                    <span className="text-xs ml-1 text-gray-400">
                      (AI: {Math.round(solarAnalysis.parsed_roof_data.edgeEstimates.rake_lf)}')
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Ridge</div>
                <div className="font-semibold text-purple-400">
                  {ridgeLength}'
                  {solarAnalysis?.parsed_roof_data?.edgeEstimates?.ridge_lf && (
                    <span className="text-xs ml-1 text-gray-400">
                      (AI: {Math.round(solarAnalysis.parsed_roof_data.edgeEstimates.ridge_lf)}')
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resize Handle */}
        <div 
          onMouseDown={handleResizeStart}
          className={`h-2 bg-muted hover:bg-primary/20 cursor-ns-resize transition-colors rounded-lg flex items-center justify-center group ${isResizing ? 'bg-primary/20' : ''}`}
          title="Drag to resize canvas height"
        >
          <div className="w-12 h-1 bg-muted-foreground/20 group-hover:bg-primary/40 rounded-full" />
        </div>

        {/* Action Buttons Row */}
        <div className="bg-white rounded-lg p-2 sm:p-3 border flex items-center gap-1 sm:gap-2 flex-wrap">
          {latitude && longitude && (
            <div className="hidden flex-col gap-1">
              <Button 
                onClick={() => {
                  setIsSmartSelectMode(!isSmartSelectMode);
                  if (!isSmartSelectMode) {
                    toast.info('Click anywhere on the roof to detect it');
                  }
                }}
                disabled={isAutoDetecting}
                variant={isSmartSelectMode ? "default" : "outline"}
                className={isSmartSelectMode ? "gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs" : "gap-1 sm:gap-2 text-xs"}
                size="sm"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isSmartSelectMode ? '✓ Click Roof to Select' : '🎯 Smart Select Roof'}</span>
                <span className="sm:hidden">{isSmartSelectMode ? '✓' : '🎯'}</span>
              </Button>
              {isSmartSelectMode && (
                <p className="text-xs text-muted-foreground px-1">
                  Click on any roof structure to auto-detect it
                </p>
              )}
            </div>
          )}
          
          {/* SAM 2 Click to Segment */}
          <div className="flex flex-col gap-1">
            <Button
              onClick={() => {
                setIsSAMClickMode(!isSAMClickMode);
                setIsSmartSelectMode(false);
                if (!isSAMClickMode) {
                  toast.info('Click on the roof to segment it with SAM 2');
                }
              }}
              disabled={isAutoDetecting}
              variant={isSAMClickMode ? "default" : "outline"}
              className={isSAMClickMode ? "gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-xs" : "gap-1 sm:gap-2 text-xs"}
              size="sm"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">{isSAMClickMode ? '✓ SAM 2 Active' : '🎯 SAM 2 Segment'}</span>
              <span className="lg:hidden">SAM 2</span>
            </Button>
            {isSAMClickMode && (
              <p className="text-xs text-muted-foreground px-1">
                Click once on any roof to segment it (Meta's SAM 2)
              </p>
            )}
          </div>
          
          {!solarAnalysis && latitude && longitude && (
            <Button 
              onClick={() => analyzeSolar.mutate({ latitude, longitude })} 
              disabled={analyzeSolar.isPending}
              variant="outline" 
              size="sm"
              className="gap-1 sm:gap-2 hidden text-xs"
            >
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{analyzeSolar.isPending ? 'Analyzing...' : 'Get Solar AI'}</span>
            </Button>
          )}
          {maskOverlayUrl && maskBounds && (
            <Button 
              onClick={convertMaskToLines} 
              variant="default" 
              size="sm"
              className="gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-xs"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">Trace Mask Edges</span>
              <span className="lg:hidden">Trace</span>
            </Button>
          )}
          {sam2SourceImageUrl && latitude && longitude && (
            <Button 
              onClick={runSmartCompleteAnalysis} 
              disabled={isAnalyzingVision}
              variant="default" 
              size="sm"
              className="gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">{isAnalyzingVision ? 'Analyzing...' : '🤖 Smart Complete Analysis'}</span>
              <span className="lg:hidden">🤖 Analyze</span>
            </Button>
          )}
          <Button onClick={undo} disabled={historyIndex <= 0} variant="outline" size="sm" className="text-xs" title={`Undo (${historyIndex} of ${history.length - 1} changes)`}>
            <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button onClick={redo} disabled={historyIndex >= history.length - 1} variant="outline" size="sm" className="text-xs" title={`Redo (${history.length - 1 - historyIndex} available)`}>
            <Redo2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
          <Button 
            variant={isDeleteMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setIsVertexDragMode(false);
              if (!isDeleteMode) {
                // Clear selected pin when activating delete mode on pins tab
                if (activeTab === 'pins') {
                  setSelectedPin(null);
                  toast.info('Delete mode active - click on pins to delete them');
                } else {
                  toast.info('Delete mode active - click on lines to delete them');
                }
              } else {
                toast.info('Delete mode deactivated');
              }
            }}
            className="gap-1 sm:gap-2 text-xs"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{isDeleteMode ? 'Cancel Delete' : 'Delete'}</span>
          </Button>
          <Button 
            variant={isVertexDragMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setIsVertexDragMode(!isVertexDragMode);
              setIsDeleteMode(false);
              if (!isVertexDragMode) {
                toast.info('Vertex drag mode active - click and drag green dots to move vertices');
              } else {
                toast.info('Vertex drag mode deactivated');
              }
            }}
            className="gap-2 hidden"
          >
            <Move className="w-4 h-4" />
            {isVertexDragMode ? 'Cancel Move' : 'Move Vertices'}
          </Button>
          <div className="flex-1" />
          <Button 
            onClick={captureMapThumbnail} 
            variant="outline" 
            size="sm" 
            title="Capture current canvas as thumbnail"
          >
            <Camera className="w-4 h-4" />
            Capture Snap
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleEnhanceImage}
            disabled={isEnhancing}
            title="Enhance the thumbnail with AI"
            className={`hidden ${isEnhancing ? "opacity-50" : ""}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
          </Button>
        </div>

        {/* Street View Embed */}
        <div className="h-64 relative overflow-hidden rounded-lg border bg-card shadow-sm">
          {googleMapsApiKey ? (
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?key=${googleMapsApiKey}&location=${latitude},${longitude}&heading=0&pitch=0&fov=90`}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
              <div className="text-center">
                <p className="mb-2">Google Maps API key not configured</p>
                <p className="text-sm">Please add GOOGLE_MAPS_API_KEY to Supabase secrets</p>
              </div>
            </div>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tools Panel - Hidden for Imagery tab */}
      {viewTab !== 'imagery' && (
      <div className="w-full lg:w-80 space-y-4">
        {/* Map Tools */}
        <MapTools mapRef={mapGLRef} quoteCenter={[longitude, latitude]} defaultZoom={19} />

        {/* Conditional Panel based on active tab */}
        {activeTab === 'facets' ? (
          <div className="bg-card rounded-lg p-3 border">
            <FacetsPanel 
              selectedFacet={selectedFacet}
              onFacetSelect={(facetId, value) => {
                // Handle deselection (empty string means deselect)
                if (!facetId) {
                  setSelectedFacet(null);
                  setSelectedFacetValue(null);
                  toast.info('Facet deselected');
                  return;
                }
                
                setSelectedFacet(facetId);
                if (value) {
                  setSelectedFacetValue(value);
                  toast.info(`Selected: ${value}`, {
                    duration: 2000
                  });
                } else {
                  setSelectedFacetValue(null);
                  toast.info(`Selected facet: ${facetId}`, {
                    duration: 2000
                  });
                }
              }}
              onApplyPitchToAll={(pitch) => {
                // Apply pitch to all polygons
                const updatedPitches = { ...currentPitches };
                let count = 0;
                
                // Get the number of detected polygons from lines
                const detectedPolygonsCount = lines.length >= 3 ? 50 : 0; // Assume max 50 polygons
                
                for (let i = 0; i < detectedPolygonsCount; i++) {
                  updatedPitches[i] = pitch;
                  count++;
                }
                
                if (count > 0) {
                  setCurrentPitches(updatedPitches);
                  currentPitchesRef.current = updatedPitches;
                  toast.success(`Applied ${pitch} pitch to ${count} facet${count > 1 ? 's' : ''}`);
                  
                  // Add to history
                  addToHistory({
                    lines: linesRef.current,
                    facets: currentFacetsRef.current,
                    pitches: updatedPitches,
                    pins: currentPinsRef.current
                  });
                } else {
                  toast.info('No facets with 0 pitch found');
                }
              }}
            />
          </div>
        ) : activeTab === 'pins' ? (
          <div className="bg-card rounded-lg p-3 border">
            <PinsPanel 
              quoteId={quoteId}
              selectedPin={selectedPin?.id || null}
              onPinSelect={(pin) => {
                setSelectedPin(pin);
                if (pin) {
                  toast.info(`Selected: ${pin.name}`, {
                    duration: 2000
                  });
                }
              }}
            />
          </div>
        ) : (
          <div className="bg-card rounded-lg p-3 border space-y-3">
            <EdgeActionsPanel
              value={selectedEdgeAction?.key || null}
              selectedLabels={selectedEdgeLabels}
              selectedGroupId={selectedGroupId}
              mode={activeTab === 'draw' ? 'draw' : 'edges'}
              onChange={(key, item) => {
                // In draw mode, allow toggling UNLABELED on/off
                if (activeTab === 'draw') {
                  if (key === 'unlabeled') {
                    // If UNLABELED is already selected, deselect it
                    if (selectedEdgeAction?.key === 'unlabeled') {
                      setSelectedEdgeAction(null);
                      toast.info('Drawing disabled', { duration: 1500 });
                      return;
                    }
                  } else {
                    // Don't allow selecting other edge types in draw mode
                    return;
                  }
                }
                
                setSelectedEdgeAction(item);
                setSelectedEdgeLabels([]); // Clear multi-select when single-selecting
                setSelectedGroupId(null);
                
                // If UNLABELED is selected and calibration is needed, show the dialog
                if (key === 'unlabeled' && needsCalibration) {
                  setShowCalibrationDialog(true);
                  toast.info('Please calibrate by drawing a line of known length', {
                    duration: 3000
                  });
                } else {
                  toast.info(`Drawing: ${item.label}`, {
                    duration: 2000
                  });
                }
              }}
              onMultiChange={(labels, color, groupId) => {
                setSelectedEdgeLabels(labels);
                setSelectedGroupId(groupId);
                // Only set selectedEdgeAction when we have labels selected (EDGES mode)
                if (labels.length > 0) {
                  // Create a pseudo EdgeItem for the multi-select
                  setSelectedEdgeAction({
                    key: `multi-${Date.now()}`,
                    label: labels[0],
                    color: color
                  });
                  toast.info(`Selected: ${labels.length} option${labels.length > 1 ? 's' : ''}`, {
                    duration: 2000
                  });
                }
                // Don't clear selectedEdgeAction when labels is empty
                // This preserves UNLABELED selection for drawing
              }}
              onDeselect={() => {
                // Allow deselecting in all modes including draw mode
                setSelectedEdgeAction(null);
                setSelectedEdgeLabels([]);
                setSelectedGroupId(null);
              }}
            />
          </div>
        )}
      </div>
      )}
      
      {/* Crosshair Overlay */}
      <CrosshairOverlay 
        isActive={
          ((activeTab === 'draw' || activeTab === 'edges') && selectedEdgeAction !== null) || 
          isVertexDragMode ||
          isVertexMoveActive
        } 
        containerRef={mapContainerRef}
      />
    </div>;
};