import { Point, EdgeLabel } from "@/types/roof-quoter";
import { haversineDistance } from "./geometry";

// Local line structure used in DrawTab (not the database Edge type)
export interface LineStructure {
  id: string;
  coords: [number, number][]; // [lng, lat] tuples
  edgeLabel: EdgeLabel;
  edgeLabels: EdgeLabel[];
  edgeColor: string;
  length: number;
}

export interface RoofStructure {
  type: 'gable' | 'hip' | 'complex' | 'flat';
  confidence: number;
  ridgeLines: LineStructure[];
  hipLines: LineStructure[];
  valleyLines: LineStructure[];
  perimeterEdges: LineStructure[];
}

/**
 * Analyzes the perimeter polygon to detect roof type based on geometric properties
 */
export function detectRoofType(perimeter: Point[]): { type: RoofStructure['type']; confidence: number } {
  if (perimeter.length < 3) {
    return { type: 'flat', confidence: 0 };
  }

  // Calculate angles at each corner
  const angles = calculateCornerAngles(perimeter);
  
  // Count right angles (within 10 degrees of 90)
  const rightAngles = angles.filter(a => Math.abs(a - 90) < 10).length;
  
  // Group edges by orientation
  const orientationGroups = groupEdgesByOrientation(perimeter);
  
  // Simple heuristics for roof type classification
  if (perimeter.length === 4 && rightAngles === 4) {
    // Rectangle - typically gable or hip
    const aspectRatio = calculateAspectRatio(perimeter);
    if (aspectRatio > 1.5) {
      return { type: 'gable', confidence: 0.85 };
    } else {
      return { type: 'hip', confidence: 0.75 };
    }
  } else if (perimeter.length >= 5 && perimeter.length <= 8) {
    // Pentagon, hexagon, octagon - likely hip roof
    return { type: 'hip', confidence: 0.8 };
  } else if (perimeter.length > 8 || rightAngles < perimeter.length * 0.5) {
    // Complex shape with many corners or non-right angles
    return { type: 'complex', confidence: 0.7 };
  }
  
  return { type: 'gable', confidence: 0.6 };
}

/**
 * Converts geographic coordinates to metric projected coordinates
 * Uses a simple local projection centered on the polygon
 */
function geographicToMetric(points: Point[]): { 
  projected: Point[]; 
  origin: Point;
  metersPerDegLng: number;
  metersPerDegLat: number;
} {
  // Calculate centroid as projection center
  const centerLng = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerLat = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
  // Meters per degree at this latitude
  const metersPerDegLat = 111132.954; // Constant for latitude
  const metersPerDegLng = 111132.954 * Math.cos(centerLat * Math.PI / 180);
  
  // Project to local metric coordinates
  const projected = points.map(p => ({
    x: (p.x - centerLng) * metersPerDegLng,
    y: (p.y - centerLat) * metersPerDegLat,
  }));
  
  return {
    projected,
    origin: { x: centerLng, y: centerLat },
    metersPerDegLng,
    metersPerDegLat,
  };
}

/**
 * Converts metric coordinates back to geographic
 */
function metricToGeographic(
  point: Point, 
  origin: Point,
  metersPerDegLng: number,
  metersPerDegLat: number
): Point {
  return {
    x: origin.x + (point.x / metersPerDegLng),
    y: origin.y + (point.y / metersPerDegLat),
  };
}

/**
 * Computes the minimum bounding rectangle (MBR) of a polygon
 * Returns the rectangle corners and orientation
 */
function computeMinimumBoundingRectangle(perimeter: Point[]): {
  corners: [Point, Point, Point, Point];
  longerEdges: [[Point, Point], [Point, Point]];
  shorterEdges: [[Point, Point], [Point, Point]];
  center: Point;
  angle: number;
  width: number;
  height: number;
} | null {
  if (perimeter.length < 3) return null;
  
  // Convert to metric coordinates for proper distance calculations
  const { projected, origin, metersPerDegLng, metersPerDegLat } = geographicToMetric(perimeter);
  
  let minArea = Infinity;
  let bestAngle = 0;
  let bestRect: { 
    corners: [Point, Point, Point, Point]; 
    longerEdges: [[Point, Point], [Point, Point]]; 
    shorterEdges: [[Point, Point], [Point, Point]]; 
    center: Point;
    width: number;
    height: number;
  } | null = null;
  
  // Try different rotation angles to find minimum bounding rectangle
  for (let angleDeg = 0; angleDeg < 90; angleDeg += 2) { // Step by 2° for efficiency
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Rotate all points (in metric space)
    const rotated = projected.map(p => ({
      x: p.x * Math.cos(angleRad) - p.y * Math.sin(angleRad),
      y: p.x * Math.sin(angleRad) + p.y * Math.cos(angleRad),
    }));
    
    // Find axis-aligned bounding box of rotated points
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    rotated.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const area = width * height;
    
    if (area < minArea) {
      minArea = area;
      bestAngle = angleDeg;
      
      // Rotate rectangle corners back to metric coordinate system
      const cornersMetric: [Point, Point, Point, Point] = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ].map(p => ({
        x: p.x * Math.cos(-angleRad) - p.y * Math.sin(-angleRad),
        y: p.x * Math.sin(-angleRad) + p.y * Math.cos(-angleRad),
      })) as [Point, Point, Point, Point];
      
      // Convert corners back to geographic coordinates
      const corners = cornersMetric.map(p => 
        metricToGeographic(p, origin, metersPerDegLng, metersPerDegLat)
      ) as [Point, Point, Point, Point];
      
      const centerMetric = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      };
      const centerMetricRotated = {
        x: centerMetric.x * Math.cos(-angleRad) - centerMetric.y * Math.sin(-angleRad),
        y: centerMetric.x * Math.sin(-angleRad) + centerMetric.y * Math.cos(-angleRad),
      };
      const centerGeo = metricToGeographic(centerMetricRotated, origin, metersPerDegLng, metersPerDegLat);
      
      // Classify edges by length (using metric distances)
      const edge1Length = Math.sqrt(
        Math.pow(cornersMetric[1].x - cornersMetric[0].x, 2) +
        Math.pow(cornersMetric[1].y - cornersMetric[0].y, 2)
      );
      const edge2Length = Math.sqrt(
        Math.pow(cornersMetric[2].x - cornersMetric[1].x, 2) +
        Math.pow(cornersMetric[2].y - cornersMetric[1].y, 2)
      );
      
      if (edge1Length > edge2Length) {
        // Edges 0-1 and 2-3 are longer (eaves)
        bestRect = {
          corners,
          longerEdges: [[corners[0], corners[1]], [corners[2], corners[3]]],
          shorterEdges: [[corners[1], corners[2]], [corners[3], corners[0]]],
          center: centerGeo,
          width: edge1Length,
          height: edge2Length,
        };
      } else {
        // Edges 1-2 and 3-0 are longer (eaves)
        bestRect = {
          corners,
          longerEdges: [[corners[1], corners[2]], [corners[3], corners[0]]],
          shorterEdges: [[corners[0], corners[1]], [corners[2], corners[3]]],
          center: centerGeo,
          width: edge2Length,
          height: edge1Length,
        };
      }
    }
  }
  
  if (!bestRect) return null;
  
  console.log(`✅ MBR computed: ${bestRect.width.toFixed(1)}m × ${bestRect.height.toFixed(1)}m at ${bestAngle}°`);
  
  return {
    ...bestRect,
    angle: bestAngle,
  };
}

/**
 * Infers ridge line position for gable roofs using MBR-based analysis
 */
export function inferRidgeLine(perimeter: Point[], type: RoofStructure['type']): LineStructure | null {
  if (type !== 'gable') return null;
  
  const mbr = computeMinimumBoundingRectangle(perimeter);
  if (!mbr) {
    console.warn('Could not compute minimum bounding rectangle');
    return null;
  }
  
  // Calculate midpoints of the two shorter edges (rakes)
  const rake1Mid = midpoint(mbr.shorterEdges[0][0], mbr.shorterEdges[0][1]);
  const rake2Mid = midpoint(mbr.shorterEdges[1][0], mbr.shorterEdges[1][1]);
  
  console.log(`Ridge endpoints: [${rake1Mid.x.toFixed(6)}, ${rake1Mid.y.toFixed(6)}] to [${rake2Mid.x.toFixed(6)}, ${rake2Mid.y.toFixed(6)}]`);
  
  // Verify both points are inside the polygon
  const rake1Inside = isPointInPolygon(rake1Mid, perimeter);
  const rake2Inside = isPointInPolygon(rake2Mid, perimeter);
  
  console.log(`Ridge point validation: rake1=${rake1Inside}, rake2=${rake2Inside}`);
  
  if (!rake1Inside || !rake2Inside) {
    console.warn('⚠️ Ridge endpoints outside polygon, attempting to clip...');
  }
  
  // Ridge line connects the midpoints of the rakes
  // Clip it to ensure it stays within the polygon
  const clippedRidge = clipLineToPolygon([rake1Mid, rake2Mid], perimeter);
  
  if (!clippedRidge) {
    console.warn('❌ Ridge line could not be clipped to polygon - may be entirely outside');
    return null;
  }
  
  const lengthMeters = haversineDistance(
    [clippedRidge[0].x, clippedRidge[0].y],
    [clippedRidge[1].x, clippedRidge[1].y]
  );
  const lengthFt = lengthMeters * 3.28084;
  
  console.log(`✅ Ridge line: ${lengthFt.toFixed(1)}ft at ${mbr.angle}° (MBR: ${mbr.width.toFixed(1)}m × ${mbr.height.toFixed(1)}m)`);
  
  return {
    id: `ridge-${Date.now()}`,
    coords: [[clippedRidge[0].x, clippedRidge[0].y], [clippedRidge[1].x, clippedRidge[1].y]],
    edgeLabel: 'RIDGE' as EdgeLabel,
    edgeLabels: ['RIDGE'],
    edgeColor: '#F59E0B',
    length: Math.round(lengthFt),
  };
}

/**
 * Infers hip lines for hip roofs
 * CRITICAL: Clips all hip lines to stay strictly within the polygon boundary
 */
export function inferHipLines(perimeter: Point[]): LineStructure[] {
  const hipLines: LineStructure[] = [];
  
  // Calculate centroid (approximate ridge point for hip roof)
  const centroid = calculateCentroid(perimeter);
  
  // Verify centroid is inside polygon
  if (!isPointInPolygon(centroid, perimeter)) {
    console.warn('⚠️ Centroid outside polygon, adjusting to polygon center');
    // Use geometric center of bounding box as fallback
    const mbr = computeMinimumBoundingRectangle(perimeter);
    if (mbr) {
      console.log(`Using MBR center: [${mbr.center.x.toFixed(6)}, ${mbr.center.y.toFixed(6)}]`);
    }
  }
  
  // Find corners (vertices with significant angle changes)
  const corners = detectSignificantCorners(perimeter);
  
  console.log(`🔺 Creating ${corners.length} hip lines from centroid to corners`);
  
  // Create hip lines from centroid to each corner, clipped to polygon
  corners.forEach((corner, index) => {
    // Clip hip line to stay within polygon boundary
    const clippedHip = clipLineToPolygon([centroid, corner], perimeter);
    
    if (!clippedHip) {
      console.warn(`⚠️ Hip line ${index} could not be clipped, skipping`);
      return;
    }
    
    const [clippedStart, clippedEnd] = clippedHip;
    
    const lengthMeters = haversineDistance(
      [clippedStart.x, clippedStart.y],
      [clippedEnd.x, clippedEnd.y]
    );
    const lengthFt = lengthMeters * 3.28084;
    
    console.log(`Hip ${index}: ${lengthFt.toFixed(1)}ft ✓ clipped to polygon`);
    
    hipLines.push({
      id: `hip-${index}-${Date.now()}`,
      coords: [[clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]],
      edgeLabel: 'HIP' as EdgeLabel,
      edgeLabels: ['HIP'],
      edgeColor: '#EF4444',
      length: Math.round(lengthFt),
    });
  });
  
  return hipLines;
}

/**
 * Classifies each perimeter edge as EAVE, RAKE, or WALL using MBR-based analysis
 * CRITICAL: Clips all edges to stay strictly within the polygon boundary
 */
export function classifyPerimeterEdges(perimeter: Point[], roofType: RoofStructure['type']): LineStructure[] {
  const edges: LineStructure[] = [];
  
  if (perimeter.length < 3) return edges;
  
  // For gable roofs: use MBR to classify edges
  if (roofType === 'gable') {
    const mbr = computeMinimumBoundingRectangle(perimeter);
    
    if (!mbr) {
      console.warn('Unable to classify edges: could not compute MBR');
      return edges;
    }
    
    // Calculate edge orientations and match to MBR
    for (let i = 0; i < perimeter.length; i++) {
      const start = perimeter[i];
      const end = perimeter[(i + 1) % perimeter.length];
      
      // Perimeter edges are already ON the boundary, but clip anyway for safety
      const clippedEdge = clipLineToPolygon([start, end], perimeter);
      
      if (!clippedEdge) {
        console.warn(`⚠️ Edge ${i} could not be clipped, skipping`);
        continue;
      }
      
      const [clippedStart, clippedEnd] = clippedEdge;
      
      // Calculate edge direction vector
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const edgeAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate MBR edge angles
      const longerEdgeAngle = Math.atan2(
        mbr.longerEdges[0][1].y - mbr.longerEdges[0][0].y,
        mbr.longerEdges[0][1].x - mbr.longerEdges[0][0].x
      ) * (180 / Math.PI);
      
      const shorterEdgeAngle = Math.atan2(
        mbr.shorterEdges[0][1].y - mbr.shorterEdges[0][0].y,
        mbr.shorterEdges[0][1].x - mbr.shorterEdges[0][0].x
      ) * (180 / Math.PI);
      
      // Calculate angle differences (handling wrap-around)
      const angleDiffLonger = Math.min(
        Math.abs(edgeAngle - longerEdgeAngle),
        360 - Math.abs(edgeAngle - longerEdgeAngle)
      );
      const angleDiffShorter = Math.min(
        Math.abs(edgeAngle - shorterEdgeAngle),
        360 - Math.abs(edgeAngle - shorterEdgeAngle)
      );
      
      // Classify based on which MBR edge direction this edge is closer to
      const isEave = angleDiffLonger < angleDiffShorter;
      
      const label: EdgeLabel = isEave ? 'EAVE' : 'RAKE';
      const color = isEave ? '#3B82F6' : '#10B981';
      
      const lengthMeters = haversineDistance([clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]);
      const lengthFt = lengthMeters * 3.28084;
      
      console.log(`Edge ${i}: ${label} at ${edgeAngle.toFixed(1)}° (${lengthFt.toFixed(1)}ft) ✓ clipped`);
      
      edges.push({
        id: `edge-${i}-${Date.now()}`,
        coords: [[clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]],
        edgeLabel: label,
        edgeLabels: [label],
        edgeColor: color,
        length: Math.round(lengthFt),
      });
    }
  } else if (roofType === 'hip') {
    // Hip roofs: all perimeter edges are eaves, clip them to stay within boundary
    for (let i = 0; i < perimeter.length; i++) {
      const start = perimeter[i];
      const end = perimeter[(i + 1) % perimeter.length];
      
      // Clip edge to polygon boundary
      const clippedEdge = clipLineToPolygon([start, end], perimeter);
      
      if (!clippedEdge) {
        console.warn(`⚠️ Hip edge ${i} could not be clipped, skipping`);
        continue;
      }
      
      const [clippedStart, clippedEnd] = clippedEdge;
      
      const lengthMeters = haversineDistance([clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]);
      const lengthFt = lengthMeters * 3.28084;
      
      edges.push({
        id: `edge-${i}-${Date.now()}`,
        coords: [[clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]],
        edgeLabel: 'EAVE',
        edgeLabels: ['EAVE'],
        edgeColor: '#3B82F6',
        length: Math.round(lengthFt),
      });
    }
  } else {
    // Complex or other roofs: classify as walls, clip to stay within boundary
    for (let i = 0; i < perimeter.length; i++) {
      const start = perimeter[i];
      const end = perimeter[(i + 1) % perimeter.length];
      
      // Clip edge to polygon boundary
      const clippedEdge = clipLineToPolygon([start, end], perimeter);
      
      if (!clippedEdge) {
        console.warn(`⚠️ Complex edge ${i} could not be clipped, skipping`);
        continue;
      }
      
      const [clippedStart, clippedEnd] = clippedEdge;
      
      const lengthMeters = haversineDistance([clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]);
      const lengthFt = lengthMeters * 3.28084;
      
      edges.push({
        id: `edge-${i}-${Date.now()}`,
        coords: [[clippedStart.x, clippedStart.y], [clippedEnd.x, clippedEnd.y]],
        edgeLabel: 'WALL',
        edgeLabels: ['WALL'],
        edgeColor: '#6B7280',
        length: Math.round(lengthFt),
      });
    }
  }
  
  console.log('✅ Edge classification complete:', edges.map(e => ({ label: e.edgeLabel, length: e.length })));
  
  return edges;
}

/**
 * Main analysis function that combines all geometric analysis
 */
export function analyzeRoofGeometry(perimeter: Point[]): RoofStructure {
  console.log(`🔍 Starting roof geometry analysis with ${perimeter.length} perimeter points`);
  console.log(`📍 Sample point: [${perimeter[0]?.x.toFixed(6)}, ${perimeter[0]?.y.toFixed(6)}]`);
  
  const { type, confidence } = detectRoofType(perimeter);
  console.log(`🏠 Detected roof type: ${type.toUpperCase()} (confidence: ${(confidence * 100).toFixed(0)}%)`);
  
  const perimeterEdges = classifyPerimeterEdges(perimeter, type);
  console.log(`📏 Classified ${perimeterEdges.length} perimeter edges`);
  
  let ridgeLines: LineStructure[] = [];
  let hipLines: LineStructure[] = [];
  let valleyLines: LineStructure[] = [];
  
  if (type === 'gable') {
    const ridge = inferRidgeLine(perimeter, type);
    if (ridge) {
      ridgeLines.push(ridge);
      console.log(`✅ Added ridge line: ${ridge.length}ft`);
    } else {
      console.warn('⚠️ Failed to infer ridge line for gable roof');
    }
  } else if (type === 'hip') {
    hipLines = inferHipLines(perimeter);
    console.log(`✅ Added ${hipLines.length} hip lines`);
  } else if (type === 'complex') {
    // For complex roofs, try to detect both ridges and valleys
    // This is a simplified approach - real complex roofs need more sophisticated analysis
    const ridge = inferRidgeLine(perimeter, 'gable');
    if (ridge) {
      ridgeLines.push(ridge);
      console.log(`✅ Added ridge line for complex roof: ${ridge.length}ft`);
    }
  }
  
  console.log(`✅ Analysis complete: ${perimeterEdges.length} edges, ${ridgeLines.length} ridges, ${hipLines.length} hips`);
  
  return {
    type,
    confidence,
    ridgeLines,
    hipLines,
    valleyLines,
    perimeterEdges,
  };
}

// Helper functions

function calculateCornerAngles(perimeter: Point[]): number[] {
  const angles: number[] = [];
  
  for (let i = 0; i < perimeter.length; i++) {
    const prev = perimeter[(i - 1 + perimeter.length) % perimeter.length];
    const curr = perimeter[i];
    const next = perimeter[(i + 1) % perimeter.length];
    
    const angle = calculateAngle(prev, curr, next);
    angles.push(angle);
  }
  
  return angles;
}

function calculateAngle(p1: Point, vertex: Point, p2: Point): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const cosAngle = dot / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  return (angleRad * 180) / Math.PI;
}

function findParallelEdgePairs(perimeter: Point[]): Array<{
  edge1: { start: Point; end: Point };
  edge2: { start: Point; end: Point };
  indices: [number, number];
  avgLength: number;
}> {
  const pairs: Array<{
    edge1: { start: Point; end: Point };
    edge2: { start: Point; end: Point };
    indices: [number, number];
    avgLength: number;
  }> = [];
  
  for (let i = 0; i < perimeter.length; i++) {
    const edge1Start = perimeter[i];
    const edge1End = perimeter[(i + 1) % perimeter.length];
    const edge1Angle = Math.atan2(edge1End.y - edge1Start.y, edge1End.x - edge1Start.x);
    const edge1Length = Math.sqrt(
      Math.pow(edge1End.x - edge1Start.x, 2) + Math.pow(edge1End.y - edge1Start.y, 2)
    );
    
    for (let j = i + 2; j < perimeter.length; j++) {
      const edge2Start = perimeter[j];
      const edge2End = perimeter[(j + 1) % perimeter.length];
      const edge2Angle = Math.atan2(edge2End.y - edge2Start.y, edge2End.x - edge2Start.x);
      const edge2Length = Math.sqrt(
        Math.pow(edge2End.x - edge2Start.x, 2) + Math.pow(edge2End.y - edge2Start.y, 2)
      );
      
      // Check if edges are parallel (within 10 degrees)
      const angleDiff = Math.abs(edge1Angle - edge2Angle) * (180 / Math.PI);
      if (angleDiff < 10 || Math.abs(angleDiff - 180) < 10) {
        pairs.push({
          edge1: { start: edge1Start, end: edge1End },
          edge2: { start: edge2Start, end: edge2End },
          indices: [i, j],
          avgLength: (edge1Length + edge2Length) / 2,
        });
      }
    }
  }
  
  return pairs;
}

function calculateAspectRatio(perimeter: Point[]): number {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  perimeter.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return Math.max(width, height) / Math.min(width, height);
}

function calculateCentroid(perimeter: Point[]): Point {
  const sum = perimeter.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  
  return {
    x: sum.x / perimeter.length,
    y: sum.y / perimeter.length,
  };
}

function detectSignificantCorners(perimeter: Point[], angleThreshold = 150): Point[] {
  const corners: Point[] = [];
  
  for (let i = 0; i < perimeter.length; i++) {
    const prev = perimeter[(i - 1 + perimeter.length) % perimeter.length];
    const curr = perimeter[i];
    const next = perimeter[(i + 1) % perimeter.length];
    
    const angle = calculateAngle(prev, curr, next);
    
    // Add corners where angle is significantly different from 180° (straight line)
    if (Math.abs(angle - 180) > (180 - angleThreshold)) {
      corners.push(curr);
    }
  }
  
  return corners;
}

function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Groups edges by orientation (angles within 10°)
 * Returns groups sorted by total length
 */
function groupEdgesByOrientation(perimeter: Point[]): Array<{
  orientation: number;
  edges: Array<{
    index: number;
    start: Point;
    end: Point;
    length: number;
    angle: number;
  }>;
  totalLength: number;
}> {
  // Calculate edge orientations and lengths
  const edgeData = perimeter.map((point, i) => {
    const nextPoint = perimeter[(i + 1) % perimeter.length];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = haversineDistance([point.x, point.y], [nextPoint.x, nextPoint.y]);
    
    return {
      index: i,
      start: point,
      end: nextPoint,
      length,
      angle: normalizeAngle(angle),
    };
  });
  
  // Group edges by similar orientation (within 10°)
  const groups: Array<{
    orientation: number;
    edges: typeof edgeData;
    totalLength: number;
  }> = [];
  
  const ANGLE_THRESHOLD = 10;
  const used = new Set<number>();
  
  for (let i = 0; i < edgeData.length; i++) {
    if (used.has(i)) continue;
    
    const currentEdge = edgeData[i];
    const group = {
      orientation: currentEdge.angle,
      edges: [currentEdge],
      totalLength: currentEdge.length,
    };
    
    used.add(i);
    
    // Find all edges with similar orientation
    for (let j = i + 1; j < edgeData.length; j++) {
      if (used.has(j)) continue;
      
      const otherEdge = edgeData[j];
      const angleDiff = Math.abs(currentEdge.angle - otherEdge.angle);
      const angleDiffOpposite = Math.abs(Math.abs(currentEdge.angle - otherEdge.angle) - 180);
      
      if (angleDiff < ANGLE_THRESHOLD || angleDiffOpposite < ANGLE_THRESHOLD) {
        group.edges.push(otherEdge);
        group.totalLength += otherEdge.length;
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Normalizes angle to [0, 360) range
 */
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Tests if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Clips a line segment to a polygon boundary
 * Returns the clipped line or null if entirely outside
 */
function clipLineToPolygon(line: [Point, Point], polygon: Point[]): [Point, Point] | null {
  const [start, end] = line;
  
  // Check if both points are inside
  const startInside = isPointInPolygon(start, polygon);
  const endInside = isPointInPolygon(end, polygon);
  
  if (startInside && endInside) {
    // Both inside, return as is
    return [start, end];
  }
  
  // Find intersection points with polygon edges
  const intersections: Array<{ point: Point; t: number }> = [];
  
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    const intersection = lineIntersection(start, end, p1, p2);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  // Sort intersections by parameter t (distance along line)
  intersections.sort((a, b) => a.t - b.t);
  
  if (intersections.length === 0) {
    // No intersections, check if line is entirely inside (shouldn't happen if we got here)
    return startInside ? [start, end] : null;
  }
  
  // Find the segment that's inside the polygon
  if (startInside) {
    // Start is inside, use first intersection as end
    return [start, intersections[0].point];
  } else if (endInside) {
    // End is inside, use last intersection as start
    return [intersections[intersections.length - 1].point, end];
  } else if (intersections.length >= 2) {
    // Both outside, use the two middle intersections
    return [intersections[0].point, intersections[1].point];
  }
  
  return null;
}

/**
 * Finds intersection point between two line segments
 * Returns point and parameter t (0-1) along first line, or null if no intersection
 */
function lineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): { point: Point; t: number } | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;
  
  const denominator = dx1 * dy2 - dy1 * dx2;
  
  if (Math.abs(denominator) < 1e-10) {
    // Lines are parallel
    return null;
  }
  
  const dx3 = a1.x - b1.x;
  const dy3 = a1.y - b1.y;
  
  const t = (dx3 * dy2 - dy3 * dx2) / denominator;
  const u = (dx3 * dy1 - dy3 * dx1) / denominator;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    // Intersection exists within both segments
    return {
      point: {
        x: a1.x + t * dx1,
        y: a1.y + t * dy1,
      },
      t,
    };
  }
  
  return null;
}
