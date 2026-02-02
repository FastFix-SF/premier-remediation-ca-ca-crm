import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  planeHeightAtCenterMeters: number;
}

interface DataLayersResponse {
  imageryDate: { year: number; month: number; day: number };
  imageryProcessedDate: { year: number; month: number; day: number };
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls: string[];
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SolarApiResponse {
  name: string;
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    roofSegmentStats: RoofSegment[];
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        pitchDegrees: number;
        azimuthDegrees: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
        segmentIndex: number;
      }>;
    }>;
  };
}

function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

function calculatePitchRatio(degrees: number): string {
  const rise = Math.tan(degrees * Math.PI / 180) * 12;
  return `${Math.round(rise)}/12`;
}

function classifyEdge(azimuth: number, pitch: number): 'EAVE' | 'RAKE' | 'RIDGE' | 'HIP' | 'VALLEY' {
  // Simple classification based on azimuth and pitch
  if (pitch < 5) return 'EAVE';
  if (azimuth >= 315 || azimuth <= 45) return 'EAVE';
  if (azimuth >= 135 && azimuth <= 225) return 'RIDGE';
  if (pitch > 20) return 'HIP';
  return 'RAKE';
}

function calculatePerimeterLength(boundingBox: RoofSegment['boundingBox']): number {
  const { sw, ne } = boundingBox;
  const latDiff = ne.latitude - sw.latitude;
  const lngDiff = ne.longitude - sw.longitude;
  
  // Haversine-based approximation for small areas
  const R = 6371000; // Earth radius in meters
  const avgLat = (sw.latitude + ne.latitude) / 2;
  const latDist = latDiff * (Math.PI / 180) * R;
  const lngDist = lngDiff * (Math.PI / 180) * R * Math.cos(avgLat * Math.PI / 180);
  
  const width = Math.abs(lngDist);
  const height = Math.abs(latDist);
  const perimeter = 2 * (width + height);
  
  return metersToFeet(perimeter);
}

// Process GeoTIFF mask to extract precise polygon coordinates
async function processMaskLayer(maskUrl: string, buildingBox: any): Promise<number[][][]> {
  try {
    console.log('Fetching mask GeoTIFF from:', maskUrl);
    const response = await fetch(maskUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch mask:', response.status);
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Import GeoTIFF library
    const { fromArrayBuffer } = await import('https://cdn.skypack.dev/geotiff@2.0.7');
    const tiff = await fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();
    const width = image.getWidth();
    const height = image.getHeight();
    
    console.log(`Mask dimensions: ${width}x${height}`);
    
    // Get bounding box from building data
    const bbox = buildingBox;
    
    // Convert mask to binary matrix
    const mask: number[][] = [];
    const data = rasters[0]; // First band contains segment indices
    
    for (let y = 0; y < height; y++) {
      mask[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        mask[y][x] = data[idx] > 0 ? 1 : 0;
      }
    }
    
    // Find connected components (each roof segment)
    const segments = findConnectedComponents(mask);
    console.log(`Found ${segments.length} segments in mask`);
    
    // Convert each segment to geographic coordinates
    const polygons: number[][][] = [];
    
    for (const segment of segments) {
      const contour = extractContour(segment, mask);
      if (contour.length < 4) continue; // Skip tiny segments
      
      const simplified = douglasPeucker(contour, 2.0);
      const geoCoords = simplified.map(([x, y]) => 
        pixelToGeo([x, y], width, height, bbox)
      );
      
      if (geoCoords.length >= 4) {
        polygons.push(geoCoords);
      }
    }
    
    return polygons;
  } catch (error) {
    console.error('Error processing mask layer:', error);
    return [];
  }
}

function findConnectedComponents(mask: number[][]): number[][][] {
  const height = mask.length;
  const width = mask[0].length;
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const components: number[][][] = [];
  
  function floodFill(startY: number, startX: number): number[][] {
    const component: number[][] = [];
    const queue: [number, number][] = [[startY, startX]];
    
    while (queue.length > 0) {
      const [y, x] = queue.shift()!;
      
      if (y < 0 || y >= height || x < 0 || x >= width || visited[y][x] || mask[y][x] === 0) {
        continue;
      }
      
      visited[y][x] = true;
      component.push([x, y]);
      
      queue.push([y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]);
    }
    
    return component;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] === 1 && !visited[y][x]) {
        const component = floodFill(y, x);
        if (component.length > 50) {
          components.push(component);
        }
      }
    }
  }
  
  return components;
}

function extractContour(component: number[][], mask: number[][]): number[][] {
  const contour: number[][] = [];
  const height = mask.length;
  const width = mask[0].length;
  
  for (const [x, y] of component) {
    const isEdge = (
      y === 0 || y === height - 1 || x === 0 || x === width - 1 ||
      mask[y - 1]?.[x] === 0 || mask[y + 1]?.[x] === 0 ||
      mask[y]?.[x - 1] === 0 || mask[y]?.[x + 1] === 0
    );
    
    if (isEdge) {
      contour.push([x, y]);
    }
  }
  
  return sortContourPoints(contour);
}

function sortContourPoints(points: number[][]): number[][] {
  if (points.length === 0) return points;
  
  const centroid = points.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
    [0, 0]
  ).map(v => v / points.length);
  
  return points.sort((a, b) => {
    const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
    const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
    return angleA - angleB;
  });
}

function douglasPeucker(points: number[][], epsilon: number): number[][] {
  if (points.length < 3) return points;
  
  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const dist = pointToLineDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }
  
  return [points[0], points[end]];
}

function pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
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
}

function pixelToGeo([x, y]: [number, number], imageWidth: number, imageHeight: number, bbox: any): [number, number] {
  const { sw, ne } = bbox;
  const lng = sw.longitude + (x / imageWidth) * (ne.longitude - sw.longitude);
  const lat = ne.latitude - (y / imageHeight) * (ne.latitude - sw.latitude);
  return [lng, lat];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { quoteId, latitude, longitude } = await req.json();
    
    if (!quoteId || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: quoteId, latitude, longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing solar potential for quote ${quoteId} at ${latitude}, ${longitude}`);

    // Create initial record with processing status
    const { data: analysisRecord, error: insertError } = await supabase
      .from('solar_analyses')
      .insert({
        quote_request_id: quoteId,
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating analysis record:', insertError);
      throw insertError;
    }

    // Call Google Solar API
    const solarApiUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key=${googleMapsApiKey}`;
    
    const solarResponse = await fetch(solarApiUrl);
    
    if (!solarResponse.ok) {
      const errorText = await solarResponse.text();
      console.error('Solar API error:', solarResponse.status, errorText);
      
      await supabase
        .from('solar_analyses')
        .update({
          status: 'error',
          error_message: `Solar API error: ${solarResponse.status} - ${errorText}`
        })
        .eq('id', analysisRecord.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Solar API request failed',
          details: errorText,
          status: solarResponse.status
        }),
        { status: solarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const solarData: SolarApiResponse = await solarResponse.json();
    console.log('Got building insights, now fetching mask layer...');
    
    // Fetch data layers to get precise mask AND imagery
    const dataLayersUrl = `https://solar.googleapis.com/v1/${solarData.name}/dataLayers:get?key=${googleMapsApiKey}`;
    console.log('Fetching data layers from:', dataLayersUrl);
    const dataLayersResponse = await fetch(dataLayersUrl);
    
    let precisePolygons: number[][][] = [];
    let rgbImageryUrl: string | null = null;
    
    if (dataLayersResponse.ok) {
      const dataLayers: DataLayersResponse = await dataLayersResponse.json();
      console.log('Got data layers, processing mask...');
      
      // Store the actual RGB imagery URL
      rgbImageryUrl = dataLayers.rgbUrl;
      console.log('RGB Imagery URL:', rgbImageryUrl);
      
      // Process mask to get precise polygons
      precisePolygons = await processMaskLayer(dataLayers.maskUrl, solarData.boundingBox);
      console.log(`Extracted ${precisePolygons.length} precise polygons from mask`);
    } else {
      const errorText = await dataLayersResponse.text();
      console.error('Data layers API failed:', dataLayersResponse.status, errorText);
      console.warn('Falling back to bounding boxes');
    }
    
    // Parse roof segments with precise polygons if available
    const segments = solarData.solarPotential.roofSegmentStats.map((segment, index) => ({
      segmentId: `segment-${index}`,
      areaSqFt: metersToFeet(segment.stats.areaMeters2) * metersToFeet(1), // convert m² to ft²
      areaSquares: (metersToFeet(segment.stats.areaMeters2) * metersToFeet(1)) / 100, // convert to roofing squares
      pitch: calculatePitchRatio(segment.pitchDegrees),
      pitchDegrees: segment.pitchDegrees,
      azimuth: segment.azimuthDegrees,
      orientation: segment.azimuthDegrees >= 0 && segment.azimuthDegrees < 45 ? 'N' :
                   segment.azimuthDegrees >= 45 && segment.azimuthDegrees < 135 ? 'E' :
                   segment.azimuthDegrees >= 135 && segment.azimuthDegrees < 225 ? 'S' :
                   segment.azimuthDegrees >= 225 && segment.azimuthDegrees < 315 ? 'W' : 'N',
      center: segment.center,
      boundingBox: segment.boundingBox,
      perimeter: calculatePerimeterLength(segment.boundingBox),
      heightAtCenter: metersToFeet(segment.planeHeightAtCenterMeters),
      // Add precise polygon coordinates if available
      polygon: precisePolygons[index] ? precisePolygons[index].map(([lng, lat]) => ({ 
        latitude: lat, 
        longitude: lng 
      })) : undefined
    }));

    const totalAreaSqFt = segments.reduce((sum, seg) => sum + seg.areaSqFt, 0);
    const totalAreaSquares = totalAreaSqFt / 100;
    const totalPerimeter = segments.reduce((sum, seg) => sum + seg.perimeter, 0);

    // Estimate edge types and lengths
    const edgeEstimates = {
      eave_lf: Math.round(totalPerimeter * 0.35), // ~35% eaves
      rake_lf: Math.round(totalPerimeter * 0.30), // ~30% rakes
      ridge_lf: Math.round(totalPerimeter * 0.15), // ~15% ridge
      hip_lf: Math.round(totalPerimeter * 0.10), // ~10% hips
      valley_lf: Math.round(totalPerimeter * 0.10), // ~10% valleys
      wall_lf: 0,
      step_lf: 0
    };

    const parsedData = {
      totalAreaSqFt: Math.round(totalAreaSqFt),
      totalAreaSquares: Math.round(totalAreaSquares * 10) / 10,
      totalPerimeter: Math.round(totalPerimeter),
      segments,
      maxPanelsCount: solarData.solarPotential.maxArrayPanelsCount,
      maxSunshineHours: solarData.solarPotential.maxSunshineHoursPerYear,
      edgeEstimates,
      imageryUrl: rgbImageryUrl // Use the actual RGB image URL from data layers
    };

    // Update record with results
    const { error: updateError } = await supabase
      .from('solar_analyses')
      .update({
        raw_api_response: solarData,
        parsed_roof_data: parsedData,
        total_area_sqft: parsedData.totalAreaSqFt,
        total_area_squares: parsedData.totalAreaSquares,
        imagery_date: `${solarData.imageryDate.year}-${String(solarData.imageryDate.month).padStart(2, '0')}-${String(solarData.imageryDate.day).padStart(2, '0')}`,
        imagery_quality: solarData.imageryQuality,
        confidence_score: solarData.imageryQuality === 'HIGH' ? 0.95 : solarData.imageryQuality === 'MEDIUM' ? 0.75 : 0.50,
        status: 'complete'
      })
      .eq('id', analysisRecord.id);

    if (updateError) {
      console.error('Error updating analysis:', updateError);
      throw updateError;
    }

    console.log(`Solar analysis complete for quote ${quoteId}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysisId: analysisRecord.id,
        data: parsedData,
        imagery: {
          date: `${solarData.imageryDate.year}-${String(solarData.imageryDate.month).padStart(2, '0')}-${String(solarData.imageryDate.day).padStart(2, '0')}`,
          quality: solarData.imageryQuality
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-solar-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
