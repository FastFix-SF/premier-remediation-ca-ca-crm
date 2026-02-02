/**
 * Geometric utilities for roof polygon processing and validation
 */

export interface Point {
  x: number;
  y: number;
}

export interface GeographicPoint {
  lng: number;
  lat: number;
}

/**
 * Orthogonal snapping for roof polygons - squares off near-90° angles
 */
export function snapToOrthogonal(
  polygon: number[][],
  angleThreshold: number = 15 // degrees
): number[][] {
  if (polygon.length < 4) return polygon;
  
  const snapped = [...polygon];
  
  for (let i = 0; i < snapped.length - 1; i++) {
    const prev = i === 0 ? snapped.length - 2 : i - 1;
    const curr = i;
    const next = i + 1;
    
    const prevPoint = snapped[prev];
    const currPoint = snapped[curr];
    const nextPoint = snapped[next];
    
    // Calculate angles of adjacent edges
    const angle1 = calculateAngle(prevPoint, currPoint);
    const angle2 = calculateAngle(currPoint, nextPoint);
    
    // Check if the angle between edges is close to 90 degrees
    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    
    const deviationFrom90 = Math.abs(angleDiff - 90);
    const deviationFrom180 = Math.abs(angleDiff - 180);
    
    if (deviationFrom90 < angleThreshold) {
      // Snap to 90 degrees
      const avgAngle = (angle1 + angle2) / 2;
      const targetAngle1 = avgAngle;
      const targetAngle2 = avgAngle + 90;
      
      // Adjust the vertex to create a 90-degree angle
      snapped[curr] = adjustVertexForAngle(prevPoint, currPoint, nextPoint, 90);
    } else if (deviationFrom180 < angleThreshold) {
      // Snap to 180 degrees (straight line)
      snapped[curr] = projectPointOntoLine(currPoint, prevPoint, nextPoint);
    }
  }
  
  return snapped;
}

/**
 * Calculate angle between two points in degrees
 */
function calculateAngle(p1: number[], p2: number[]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
}

/**
 * Adjust vertex position to create a specific angle
 */
function adjustVertexForAngle(
  prev: number[],
  curr: number[],
  next: number[],
  targetAngleDeg: number
): number[] {
  const targetAngleRad = targetAngleDeg * Math.PI / 180;
  
  // Calculate current vectors
  const v1 = [curr[0] - prev[0], curr[1] - prev[1]];
  const v2 = [next[0] - curr[0], next[1] - curr[1]];
  
  // Calculate lengths
  const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
  const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
  
  if (len1 === 0 || len2 === 0) return curr;
  
  // Normalize vectors
  const u1 = [v1[0] / len1, v1[1] / len1];
  const u2 = [v2[0] / len2, v2[1] / len2];
  
  // Calculate the bisector direction
  const bisector = [u1[0] + u2[0], u1[1] + u2[1]];
  const bisectorLen = Math.sqrt(bisector[0] * bisector[0] + bisector[1] * bisector[1]);
  
  if (bisectorLen === 0) return curr;
  
  // Use the average of the two distances to maintain polygon shape
  const avgLen = (len1 + len2) / 2;
  const offset = avgLen * 0.1; // Small adjustment
  
  return [
    curr[0] + (bisector[0] / bisectorLen) * offset,
    curr[1] + (bisector[1] / bisectorLen) * offset
  ];
}

/**
 * Project point onto line defined by two other points
 */
function projectPointOntoLine(point: number[], lineStart: number[], lineEnd: number[]): number[] {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return point;
  
  const param = dot / lenSq;
  const clampedParam = Math.max(0, Math.min(1, param));
  
  return [
    x1 + clampedParam * C,
    y1 + clampedParam * D
  ];
}

/**
 * Fix self-intersecting polygons using simple polygonization
 */
export function fixSelfIntersection(polygon: number[][]): number[][] {
  if (polygon.length < 4) return polygon;
  
  // Remove duplicate consecutive points
  const cleaned = polygon.filter((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return point[0] !== next[0] || point[1] !== next[1];
  });
  
  if (cleaned.length < 3) return polygon;
  
  // Check for self-intersections and remove them
  const result = [...cleaned];
  
  for (let i = 0; i < result.length - 1; i++) {
    for (let j = i + 2; j < result.length - 1; j++) {
      if (i === 0 && j === result.length - 2) continue; // Don't check first and last segments
      
      const intersection = lineIntersection(
        result[i], result[i + 1],
        result[j], result[j + 1]
      );
      
      if (intersection) {
        // Remove the loop by keeping the shorter path
        const path1Length = j - i;
        const path2Length = result.length - path1Length;
        
        if (path1Length < path2Length) {
          result.splice(i + 1, j - i - 1);
        } else {
          result.splice(0, i + 1);
          result.splice(j - i - 1);
        }
        break;
      }
    }
  }
  
  return result;
}

/**
 * Calculate intersection point of two line segments
 */
function lineIntersection(
  p1: number[], p2: number[],
  p3: number[], p4: number[]
): number[] | null {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const [x4, y4] = p4;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Parallel lines
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [
      x1 + t * (x2 - x1),
      y1 + t * (y2 - y1)
    ];
  }
  
  return null;
}

/**
 * Validate polygon geometry and properties
 */
export function validatePolygon(
  polygon: number[][],
  minAreaSqFt: number = 120,
  maxAreaSqFt: number = 50000
): { valid: boolean; reason?: string } {
  if (polygon.length < 3) {
    return { valid: false, reason: 'Polygon must have at least 3 vertices' };
  }
  
  if (polygon.length > 50) {
    return { valid: false, reason: 'Polygon has too many vertices (max 50)' };
  }
  
  // Check for minimum area (approximate)
  const area = calculatePolygonArea(polygon);
  if (area < minAreaSqFt / 10.764) { // Convert sq ft to sq m for comparison
    return { valid: false, reason: `Area too small: ${Math.round(area * 10.764)} sq ft (minimum ${minAreaSqFt})` };
  }
  
  if (area > maxAreaSqFt / 10.764) {
    return { valid: false, reason: `Area too large: ${Math.round(area * 10.764)} sq ft (maximum ${maxAreaSqFt})` };
  }
  
  // Check for reasonable aspect ratio
  const bounds = getPolygonBounds(polygon);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  
  if (aspectRatio > 10) {
    return { valid: false, reason: 'Polygon aspect ratio too extreme' };
  }
  
  return { valid: true };
}

/**
 * Calculate polygon area using the Shoelace formula
 */
function calculatePolygonArea(polygon: number[][]): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    area += polygon[i][0] * polygon[i + 1][1] - polygon[i + 1][0] * polygon[i][1];
  }
  
  return Math.abs(area / 2);
}

/**
 * Get bounding box of polygon
 */
function getPolygonBounds(polygon: number[][]): {
  minX: number; maxX: number; minY: number; maxY: number;
} {
  if (polygon.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = polygon[0][0];
  let maxX = polygon[0][0];
  let minY = polygon[0][1];
  let maxY = polygon[0][1];
  
  for (const [x, y] of polygon) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * Calculate centroid of polygon
 */
export function calculateCentroid(polygon: number[][]): [number, number] {
  if (polygon.length === 0) return [0, 0];
  
  let centroidX = 0;
  let centroidY = 0;
  let area = 0;
  
  for (let i = 0; i < polygon.length - 1; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[i + 1];
    
    const a = x0 * y1 - x1 * y0;
    area += a;
    centroidX += (x0 + x1) * a;
    centroidY += (y0 + y1) * a;
  }
  
  area *= 0.5;
  if (Math.abs(area) < 1e-10) {
    // Fallback to simple average for degenerate cases
    centroidX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
    centroidY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
    return [centroidX, centroidY];
  }
  
  centroidX /= (6 * area);
  centroidY /= (6 * area);
  
  return [centroidX, centroidY];
}

/**
 * Calculate distance between two geographic points using Haversine formula
 */
export function haversineDistance(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Snap endpoints within tolerance and merge them
 */
export function snapEndpoints<T extends { start: [number, number]; end: [number, number] }>(
  lines: T[],
  toleranceMeters: number = 0.3 // ~1 foot tolerance
): T[] {
  const snapped = [...lines];
  const snapGroups = new Map<string, [number, number]>();
  
  // Find all points that should snap together
  for (let i = 0; i < snapped.length; i++) {
    for (let j = i + 1; j < snapped.length; j++) {
      const line1 = snapped[i];
      const line2 = snapped[j];
      
      // Check start-to-start, start-to-end, end-to-start, end-to-end
      const pairs: Array<[keyof typeof line1, keyof typeof line2]> = [
        ['start', 'start'], ['start', 'end'], ['end', 'start'], ['end', 'end']
      ];
      
      for (const [key1, key2] of pairs) {
        const p1 = line1[key1] as [number, number];
        const p2 = line2[key2] as [number, number];
        const dist = haversineDistance(p1, p2);
        
        if (dist < toleranceMeters) {
          // Average the positions
          const avgPoint: [number, number] = [
            (p1[0] + p2[0]) / 2,
            (p1[1] + p2[1]) / 2
          ];
          const key = `${i}-${String(key1)}`;
          snapGroups.set(key, avgPoint);
          const key2Str = `${j}-${String(key2)}`;
          snapGroups.set(key2Str, avgPoint);
        }
      }
    }
  }
  
  // Apply snapped positions
  snapGroups.forEach((avgPoint, key) => {
    const [lineIdx, pointKey] = key.split('-');
    const idx = parseInt(lineIdx);
    if (snapped[idx]) {
      (snapped[idx] as any)[pointKey] = avgPoint;
    }
  });
  
  return snapped;
}

/**
 * Detect continuous edges and merge them if angle difference is small
 */
export function mergeContinuousEdges<T extends { start: [number, number]; end: [number, number]; id: string }>(
  lines: T[],
  angleTolerance: number = 10 // degrees
): T[] {
  const merged: T[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    if (used.has(lines[i].id)) continue;
    
    let currentLine = { ...lines[i] };
    used.add(lines[i].id);
    let didMerge = true;
    
    // Keep trying to extend the line
    while (didMerge) {
      didMerge = false;
      
      for (let j = 0; j < lines.length; j++) {
        if (used.has(lines[j].id)) continue;
        
        const nextLine = lines[j];
        
        // Check if end of current connects to start of next
        const endToStart = haversineDistance(currentLine.end, nextLine.start) < 0.5;
        const angle1 = calculateAngle(currentLine.start as number[], currentLine.end as number[]);
        const angle2 = calculateAngle(nextLine.start as number[], nextLine.end as number[]);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        if (endToStart && angleDiff < angleTolerance) {
          // Extend current line
          currentLine.end = nextLine.end;
          used.add(nextLine.id);
          didMerge = true;
          break;
        }
      }
    }
    
    merged.push(currentLine);
  }
  
  return merged;
}

/**
 * Auto-classify edge type based on geometry
 */
export function autoClassifyEdge(
  line: { start: [number, number]; end: [number, number] },
  polygonContext?: { coords: [number, number][]; isConvex?: boolean }
): 'EAVE' | 'RAKE' | 'RIDGE' | 'HIP' | 'VALLEY' | 'STEP' | 'WALL' {
  const angle = calculateAngle(line.start as number[], line.end as number[]);
  
  // Check if it's an outer boundary edge
  const isHorizontal = (angle >= 315 || angle < 45) || (angle >= 135 && angle < 225);
  
  if (!polygonContext) {
    // Without context, use simple heuristics
    return isHorizontal ? 'EAVE' : 'RAKE';
  }
  
  // Check if edge is on the boundary
  const isOnBoundary = polygonContext.coords.some((coord, idx) => {
    const nextCoord = polygonContext.coords[(idx + 1) % polygonContext.coords.length];
    return (
      (coord[0] === line.start[0] && coord[1] === line.start[1] &&
       nextCoord[0] === line.end[0] && nextCoord[1] === line.end[1]) ||
      (coord[0] === line.end[0] && coord[1] === line.end[1] &&
       nextCoord[0] === line.start[0] && nextCoord[1] === line.start[1])
    );
  });
  
  if (isOnBoundary) {
    return isHorizontal ? 'EAVE' : 'RAKE';
  }
  
  // Interior edges
  if (polygonContext.isConvex === false) {
    return 'VALLEY';
  } else if (polygonContext.isConvex === true) {
    return 'HIP';
  }
  
  return 'RIDGE';
}

/**
 * Auto-close open polygon by connecting endpoints
 */
export function autoClosePolygon(polygon: number[][]): number[][] {
  if (polygon.length < 3) return polygon;
  
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  
  // Check if already closed
  const dist = Math.sqrt(
    Math.pow(last[0] - first[0], 2) + Math.pow(last[1] - first[1], 2)
  );
  
  if (dist < 1e-6) return polygon;
  
  // Close by adding first point at the end
  return [...polygon, first];
}

/**
 * Classify edge types based on orientation and position
 */
export function classifyEdges(polygon: number[][]): {
  eaves: Array<[number[], number[]]>;
  rakes: Array<[number[], number[]]>;
  hips: Array<[number[], number[]]>;
  valleys: Array<[number[], number[]]>;
  ridges: Array<[number[], number[]]>;
} {
  if (polygon.length < 3) {
    return { eaves: [], rakes: [], hips: [], valleys: [], ridges: [] };
  }
  
  const edges = {
    eaves: [] as Array<[number[], number[]]>,
    rakes: [] as Array<[number[], number[]]>,
    hips: [] as Array<[number[], number[]]>,
    valleys: [] as Array<[number[], number[]]>,
    ridges: [] as Array<[number[], number[]]>
  };
  
  // Simple heuristic classification based on edge orientation
  for (let i = 0; i < polygon.length - 1; i++) {
    const angle = calculateAngle(polygon[i], polygon[i + 1]);
    
    // Classify based on angle (this is a basic approach)
    if (angle >= 315 || angle < 45 || (angle >= 135 && angle < 225)) {
      edges.eaves.push([polygon[i], polygon[i + 1]]); // Horizontal-ish edges
    } else {
      edges.rakes.push([polygon[i], polygon[i + 1]]); // Vertical-ish edges
    }
  }
  
  return edges;
}
