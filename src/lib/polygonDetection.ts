/**
 * Advanced polygon detection that finds closed regions formed by line segments
 */

import * as turf from '@turf/turf';

type LngLat = [number, number];

export interface DetectedPolygon {
  id: string;
  coords: LngLat[];
  area: number;
  centroid: LngLat;
}

// Helper to create point key for comparison
const pointKey = (coord: LngLat): string => `${coord[0].toFixed(8)},${coord[1].toFixed(8)}`;

// Helper to check if two points are the same
const pointsEqual = (p1: LngLat, p2: LngLat): boolean => pointKey(p1) === pointKey(p2);

interface DirectedEdge {
  from: LngLat;
  to: LngLat;
  fromKey: string;
  toKey: string;
}

// Calculate angle from point p1 to point p2
const calculateAngle = (p1: LngLat, p2: LngLat): number => {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
};

/**
 * Detect polygons from line segments using planar face extraction
 */
export function detectPolygons(lines: Array<{ id: string; coords: LngLat[] }>): DetectedPolygon[] {
  if (lines.length < 3) return [];
  
  try {
    // Build directed edge graph
    const directedEdges: DirectedEdge[] = [];
    const edgesFromVertex = new Map<string, DirectedEdge[]>();
    const vertexDegree = new Map<string, number>(); // Track how many edges connect to each vertex
    
    lines.forEach(line => {
      if (line.coords.length < 2) return;
      
      const start = line.coords[0];
      const end = line.coords[line.coords.length - 1];
      
      // Create two directed edges (bidirectional)
      const forward: DirectedEdge = {
        from: start,
        to: end,
        fromKey: pointKey(start),
        toKey: pointKey(end)
      };
      
      const backward: DirectedEdge = {
        from: end,
        to: start,
        fromKey: pointKey(end),
        toKey: pointKey(start)
      };
      
      directedEdges.push(forward, backward);
      
      // Add to adjacency map
      if (!edgesFromVertex.has(forward.fromKey)) {
        edgesFromVertex.set(forward.fromKey, []);
      }
      if (!edgesFromVertex.has(backward.fromKey)) {
        edgesFromVertex.set(backward.fromKey, []);
      }
      
      edgesFromVertex.get(forward.fromKey)!.push(forward);
      edgesFromVertex.get(backward.fromKey)!.push(backward);
      
      // Track vertex degrees (each line contributes 1 to both endpoints)
      vertexDegree.set(forward.fromKey, (vertexDegree.get(forward.fromKey) || 0) + 1);
      vertexDegree.set(backward.fromKey, (vertexDegree.get(backward.fromKey) || 0) + 1);
    });
    
    // Sort outgoing edges by angle at each vertex
    edgesFromVertex.forEach((edges, vertexKey) => {
      edges.sort((a, b) => {
        const angleA = calculateAngle(a.from, a.to);
        const angleB = calculateAngle(b.from, b.to);
        return angleA - angleB;
      });
    });
    
    // Extract faces by traversing edges
    const visitedEdges = new Set<string>();
    const faces: LngLat[][] = [];
    
    directedEdges.forEach(startEdge => {
      const edgeKey = `${startEdge.fromKey}->${startEdge.toKey}`;
      
      if (visitedEdges.has(edgeKey)) return;
      
      // Trace the face boundary
      const faceBoundary: LngLat[] = [];
      let currentEdge = startEdge;
      let iterations = 0;
      const maxIterations = 100;
      
      while (iterations < maxIterations) {
        const currentEdgeKey = `${currentEdge.fromKey}->${currentEdge.toKey}`;
        
        if (iterations > 0 && currentEdge.from === startEdge.from && pointsEqual(currentEdge.from, startEdge.from)) {
          // Completed the loop
          break;
        }
        
        visitedEdges.add(currentEdgeKey);
        faceBoundary.push(currentEdge.from);
        
        // Find the next edge: most clockwise from the reverse direction
        const outgoingEdges = edgesFromVertex.get(currentEdge.toKey) || [];
        if (outgoingEdges.length === 0) break;
        
        // Find the edge that turns most to the right (clockwise)
        const incomingAngle = calculateAngle(currentEdge.to, currentEdge.from);
        
        let nextEdge: DirectedEdge | null = null;
        let maxAngleDiff = -Infinity;
        
        outgoingEdges.forEach(edge => {
          // Skip the edge we came from
          if (pointsEqual(edge.to, currentEdge.from)) return;
          
          const outgoingAngle = calculateAngle(edge.from, edge.to);
          let angleDiff = outgoingAngle - incomingAngle;
          
          // Normalize to [0, 2π]
          while (angleDiff < 0) angleDiff += 2 * Math.PI;
          while (angleDiff > 2 * Math.PI) angleDiff -= 2 * Math.PI;
          
          if (angleDiff > maxAngleDiff) {
            maxAngleDiff = angleDiff;
            nextEdge = edge;
          }
        });
        
        if (!nextEdge) break;
        currentEdge = nextEdge;
        iterations++;
      }
      
      // Validate and add face - only if all vertices have degree >= 2 (fully closed section)
      if (faceBoundary.length >= 3) {
        // Check if all vertices in this face have at least 2 connections
        const isFullyClosed = faceBoundary.every(vertex => {
          const key = pointKey(vertex);
          const degree = vertexDegree.get(key) || 0;
          return degree >= 2;
        });
        
        if (isFullyClosed) {
          faces.push(faceBoundary);
        }
      }
    });
    
    // Convert faces to DetectedPolygon objects, filter duplicates and invalid ones
    const candidatePolygons: Array<{
      coords: LngLat[];
      area: number;
      centroid: LngLat;
      polygon: any;
    }> = [];
    const seenSignatures = new Set<string>();
    
    faces.forEach(face => {
      // Create canonical signature
      const signature = face.map(pointKey).sort().join('|');
      if (seenSignatures.has(signature)) return;
      
      try {
        const polygon = turf.polygon([[...face, face[0]]]);
        const area = turf.area(polygon);
        
        // Filter out very small faces (noise)
        if (area < 1) return;
        
        const centroid = turf.centroid(polygon);
        
        seenSignatures.add(signature);
        candidatePolygons.push({
          coords: face,
          area: area,
          centroid: centroid.geometry.coordinates as LngLat,
          polygon: polygon
        });
      } catch (e) {
        // Skip invalid polygons
      }
    });
    
    // Keep ALL polygons (both outer facets and inner dormers)
    // Area adjustments for dormers will be handled during rendering/calculation
    const foundPolygons: DetectedPolygon[] = candidatePolygons.map((candidate, index) => ({
      id: `polygon-${index}`,
      coords: candidate.coords,
      area: candidate.area,
      centroid: candidate.centroid
    }));
    
    // Sort by area
    return foundPolygons.sort((a, b) => b.area - a.area);
    
  } catch (error) {
    console.error('Error detecting polygons:', error);
    return [];
  }
}

