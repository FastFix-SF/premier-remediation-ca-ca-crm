import * as turf from '@turf/turf';

/**
 * Calculate geodesic area of a polygon in square feet
 */
export function geodesicArea(polygon: number[][]): number {
  if (!polygon || polygon.length < 4) return 0;
  
  try {
    // Create a proper GeoJSON polygon
    const geoJsonPolygon = turf.polygon([polygon]);
    
    // Calculate area in square meters using Turf
    const areaSquareMeters = turf.area(geoJsonPolygon);
    
    // Convert to square feet (1 m² = 10.7639 ft²)
    return areaSquareMeters * 10.7639;
  } catch (error) {
    console.error('Error calculating geodesic area:', error);
    return 0;
  }
}

/**
 * Calculate geodesic perimeter of a polygon in feet
 */
export function geodesicPerimeter(polygon: number[][]): number {
  if (!polygon || polygon.length < 3) return 0;
  
  try {
    // Create a proper GeoJSON polygon
    const geoJsonPolygon = turf.polygon([polygon]);
    
    // Calculate perimeter in meters using Turf
    const perimeterMeters = turf.length(turf.polygonToLine(geoJsonPolygon), { units: 'meters' });
    
    // Convert to feet (1 m = 3.28084 ft)
    return perimeterMeters * 3.28084;
  } catch (error) {
    console.error('Error calculating geodesic perimeter:', error);
    return 0;
  }
}

/**
 * Calculate geodesic distance between two points in feet
 */
export function geodesicDistance(point1: [number, number], point2: [number, number]): number {
  try {
    const from = turf.point(point1);
    const to = turf.point(point2);
    
    // Calculate distance in meters
    const distanceMeters = turf.distance(from, to, { units: 'meters' });
    
    // Convert to feet
    return distanceMeters * 3.28084;
  } catch (error) {
    console.error('Error calculating geodesic distance:', error);
    return 0;
  }
}

/**
 * Calculate the bearing (angle) between two points in degrees
 */
export function calculateBearing(point1: [number, number], point2: [number, number]): number {
  try {
    const from = turf.point(point1);
    const to = turf.point(point2);
    
    return turf.bearing(from, to);
  } catch (error) {
    console.error('Error calculating bearing:', error);
    return 0;
  }
}

/**
 * Classify edges of a polygon as eaves or rakes based on orientation
 */
export function classifyEdges(polygon: number[][], angleThreshold: number = 15): {
  eaves: Array<{ start: [number, number], end: [number, number], length: number }>;
  rakes: Array<{ start: [number, number], end: [number, number], length: number }>;
} {
  if (!polygon || polygon.length < 4) return { eaves: [], rakes: [] };
  
  const eaves = [];
  const rakes = [];
  
  for (let i = 0; i < polygon.length - 1; i++) {
    const start: [number, number] = [polygon[i][0], polygon[i][1]];
    const end: [number, number] = [polygon[i + 1][0], polygon[i + 1][1]];
    
    const bearing = Math.abs(calculateBearing(start, end));
    const length = geodesicDistance(start, end);
    
    // Normalize bearing to 0-90 range
    const normalizedBearing = Math.min(bearing, 180 - bearing);
    
    if (normalizedBearing <= angleThreshold || normalizedBearing >= (90 - angleThreshold)) {
      // Horizontal or vertical edge
      if (normalizedBearing <= angleThreshold) {
        eaves.push({ start, end, length });
      } else {
        rakes.push({ start, end, length });
      }
    } else {
      // Default to rake for diagonal edges
      rakes.push({ start, end, length });
    }
  }
  
  return { eaves, rakes };
}

/**
 * Calculate total linear feet for eaves and rakes
 */
export function calculateLinearFeet(polygon: number[][], angleThreshold: number = 15): {
  eaves: number;
  rakes: number;
} {
  const { eaves, rakes } = classifyEdges(polygon, angleThreshold);
  
  return {
    eaves: eaves.reduce((sum, edge) => sum + edge.length, 0),
    rakes: rakes.reduce((sum, edge) => sum + edge.length, 0)
  };
}