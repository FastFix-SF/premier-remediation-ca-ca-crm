/**
 * Computer vision utilities for roof segmentation and mask processing
 */

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface RoofPolygon {
  id: string;
  coordinates: number[][][]; // GeoJSON Polygon coordinates
  area_sq_ft: number;
  perimeter_ft: number;
  confidence: number;
}

export interface SegmentationResult {
  success: boolean;
  method: 'ai_segmentation' | 'opencv_fallback' | 'manual_needed';
  polygons: RoofPolygon[];
  roi_image_url?: string;
  bbox_lonlat: BoundingBox;
  error?: string;
}

/**
 * Process binary mask from AI segmentation into roof polygons
 */
export function processMaskToPolygons(
  maskData: Uint8Array | number[][],
  imageWidth: number,
  imageHeight: number,
  bbox: BoundingBox,
  minAreaSqFt: number = 120
): RoofPolygon[] {
  const polygons: RoofPolygon[] = [];
  
  // Convert mask data to 2D array if needed
  const mask = Array.isArray(maskData) ? maskData : 
    Array.from({ length: imageHeight }, (_, y) =>
      Array.from({ length: imageWidth }, (_, x) =>
        maskData[y * imageWidth + x] || 0
      )
    );

  // Apply morphological operations to clean up the mask
  const cleanedMask = applyMorphologyOperations(mask);
  
  // Find connected components (potential roof structures)
  const components = findConnectedComponents(cleanedMask);
  
  // Convert each component to a polygon
  components.forEach((component, index) => {
    const contour = extractContour(component, cleanedMask);
    if (contour.length < 3) return; // Need at least 3 points for a polygon
    
    // Simplify contour using Douglas-Peucker
    const epsilon = Math.min(imageWidth, imageHeight) * 0.015; // 1.5% of image dimension
    const simplified = douglasPeucker(contour, epsilon);
    
    // Convert pixel coordinates to geographic coordinates
    const geoCoords = simplified.map(([x, y]) => 
      pixelToGeo([x, y], imageWidth, imageHeight, bbox)
    );
    
    // Close the polygon
    if (geoCoords.length > 0) {
      geoCoords.push(geoCoords[0]);
    }
    
    // Calculate area and perimeter
    const areaM2 = calculatePolygonAreaM2(geoCoords);
    const areaSqFt = areaM2 * 10.764; // Convert m² to sq ft
    
    // Skip if too small
    if (areaSqFt < minAreaSqFt) return;
    
    const perimeterFt = calculatePerimeterFt(geoCoords);
    const confidence = calculateConfidence(component, simplified, cleanedMask);
    
    polygons.push({
      id: String.fromCharCode(65 + index), // 'A', 'B', 'C', etc.
      coordinates: [geoCoords],
      area_sq_ft: areaSqFt,
      perimeter_ft: perimeterFt,
      confidence
    });
  });
  
  return polygons.sort((a, b) => b.area_sq_ft - a.area_sq_ft); // Sort by area, largest first
}

/**
 * Apply morphological operations to clean up binary mask
 */
function applyMorphologyOperations(mask: number[][]): number[][] {
  const height = mask.length;
  const width = mask[0].length;
  
  // Create kernel for morphological operations
  const kernel = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];
  
  // Apply closing (dilation followed by erosion) to fill holes
  let result = dilate(mask, kernel);
  result = erode(result, kernel);
  
  // Apply opening (erosion followed by dilation) to remove noise
  result = erode(result, kernel);
  result = dilate(result, kernel);
  
  return result;
}

/**
 * Morphological dilation operation
 */
function dilate(mask: number[][], kernel: number[][]): number[][] {
  const height = mask.length;
  const width = mask[0].length;
  const result = Array(height).fill(null).map(() => Array(width).fill(0));
  
  const kh = kernel.length;
  const kw = kernel[0].length;
  const ky = Math.floor(kh / 2);
  const kx = Math.floor(kw / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let j = 0; j < kh; j++) {
        for (let i = 0; i < kw; i++) {
          const ny = y + j - ky;
          const nx = x + i - kx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (kernel[j][i] && mask[ny][nx]) {
              maxVal = 1;
            }
          }
        }
      }
      result[y][x] = maxVal;
    }
  }
  
  return result;
}

/**
 * Morphological erosion operation
 */
function erode(mask: number[][], kernel: number[][]): number[][] {
  const height = mask.length;
  const width = mask[0].length;
  const result = Array(height).fill(null).map(() => Array(width).fill(0));
  
  const kh = kernel.length;
  const kw = kernel[0].length;
  const ky = Math.floor(kh / 2);
  const kx = Math.floor(kw / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y][x]) continue;
      
      let allMatch = true;
      for (let j = 0; j < kh && allMatch; j++) {
        for (let i = 0; i < kw && allMatch; i++) {
          const ny = y + j - ky;
          const nx = x + i - kx;
          if (kernel[j][i]) {
            if (ny < 0 || ny >= height || nx < 0 || nx >= width || !mask[ny][nx]) {
              allMatch = false;
            }
          }
        }
      }
      result[y][x] = allMatch ? 1 : 0;
    }
  }
  
  return result;
}

/**
 * Find connected components in binary mask
 */
function findConnectedComponents(mask: number[][]): number[][][] {
  const height = mask.length;
  const width = mask[0].length;
  const visited = Array(height).fill(null).map(() => Array(width).fill(false));
  const components: number[][][] = [];
  
  function floodFill(startY: number, startX: number): number[][] {
    const component: number[][] = [];
    const stack: [number, number][] = [[startY, startX]];
    
    while (stack.length > 0) {
      const [y, x] = stack.pop()!;
      
      if (y < 0 || y >= height || x < 0 || x >= width || 
          visited[y][x] || !mask[y][x]) {
        continue;
      }
      
      visited[y][x] = true;
      component.push([x, y]); // Store as [x, y] for consistency
      
      // Add 8-connected neighbors
      for (const [dy, dx] of [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]) {
        stack.push([y + dy, x + dx]);
      }
    }
    
    return component;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] && !visited[y][x]) {
        const component = floodFill(y, x);
        if (component.length > 50) { // Minimum component size
          components.push(component);
        }
      }
    }
  }
  
  return components;
}

/**
 * Extract contour from connected component
 */
function extractContour(component: number[][], mask: number[][]): number[][] {
  // Find boundary pixels
  const boundary: Set<string> = new Set();
  
  for (const [x, y] of component) {
    // Check if this pixel is on the boundary
    let isBoundary = false;
    for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= mask.length || nx < 0 || nx >= mask[0].length || !mask[ny][nx]) {
        isBoundary = true;
        break;
      }
    }
    
    if (isBoundary) {
      boundary.add(`${x},${y}`);
    }
  }
  
  // Convert boundary set to array of coordinates
  const contour = Array.from(boundary).map(coord => {
    const [x, y] = coord.split(',').map(Number);
    return [x, y];
  });
  
  // Sort contour points to form a proper polygon
  if (contour.length > 0) {
    return sortContourPoints(contour);
  }
  
  return contour;
}

/**
 * Sort contour points to form a proper polygon outline
 */
function sortContourPoints(points: number[][]): number[][] {
  if (points.length < 3) return points;
  
  // Find centroid
  const centroidX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const centroidY = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  
  // Sort by angle from centroid
  return points.sort((a, b) => {
    const angleA = Math.atan2(a[1] - centroidY, a[0] - centroidX);
    const angleB = Math.atan2(b[1] - centroidY, b[0] - centroidX);
    return angleA - angleB;
  });
}

/**
 * Douglas-Peucker algorithm for polygon simplification
 */
function douglasPeucker(points: number[][], epsilon: number): number[][] {
  if (points.length < 3) return points;
  
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  // Find the point with maximum distance from the line segment
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  
  return [start, end];
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const [x0, y0] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x0 - x1;
  const B = y0 - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }
  
  const param = dot / lenSq;
  
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
  
  const dx = x0 - xx;
  const dy = y0 - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert pixel coordinates to geographic coordinates
 */
function pixelToGeo(
  [x, y]: [number, number],
  imageWidth: number,
  imageHeight: number,
  bbox: BoundingBox
): [number, number] {
  const lng = bbox.west + (x / imageWidth) * (bbox.east - bbox.west);
  const lat = bbox.north - (y / imageHeight) * (bbox.north - bbox.south);
  return [lng, lat];
}

/**
 * Calculate polygon area in square meters using the Shoelace formula
 */
function calculatePolygonAreaM2(coords: number[][]): number {
  if (coords.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    area += lng1 * lat2 - lng2 * lat1;
  }
  
  // Convert to square meters using approximate conversion
  const avgLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos(avgLat * Math.PI / 180);
  
  return Math.abs(area / 2) * metersPerDegreeLat * metersPerDegreeLng;
}

/**
 * Calculate polygon perimeter in feet
 */
function calculatePerimeterFt(coords: number[][]): number {
  if (coords.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    
    // Haversine distance
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceM = 6371000 * c; // Earth's radius in meters
    
    perimeter += distanceM * 3.28084; // Convert to feet
  }
  
  return perimeter;
}

/**
 * Calculate confidence score for a detected polygon
 */
function calculateConfidence(
  component: number[][],
  simplified: number[][],
  mask: number[][]
): number {
  let confidence = 0.8; // Base confidence
  
  // Penalize if polygon was heavily simplified
  const simplificationRatio = simplified.length / component.length;
  if (simplificationRatio < 0.1) {
    confidence -= 0.2;
  }
  
  // Boost confidence for more regular shapes
  if (simplified.length >= 4 && simplified.length <= 8) {
    confidence += 0.1;
  }
  
  // Ensure confidence is within bounds
  return Math.max(0.1, Math.min(1.0, confidence));
}