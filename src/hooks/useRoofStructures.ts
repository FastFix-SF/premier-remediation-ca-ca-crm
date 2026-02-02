import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { geodesicArea, geodesicPerimeter, calculateLinearFeet } from '@/lib/roof/geodesic';
import { calculateSurfaceArea, calculatePlanSquares, calculateSurfaceSquares } from '@/lib/roof/pitch';

export interface RoofStructure {
  id: string;
  structureId: string; // A, B, C, etc.
  geometry: any; // GeoJSON Polygon
  areaSqFt: number;
  perimeterFt: number;
  surfaceAreaSqFt: number;
  confidence: number;
  isIncluded: boolean;
}

export interface RidgeLine {
  id: string;
  geometry: any; // GeoJSON LineString
  lengthFt: number;
  label?: string;
}

export interface StructureMeasurements {
  planAreaSqFtTotal: number;
  surfaceAreaSqFtTotal: number;
  planSquares: number;
  surfaceSquares: number;
  eaveLfTotal: number;
  rakeLfTotal: number;
  ridgeLfTotal: number;
  structures: RoofStructure[];
  ridgeLines: RidgeLine[];
}

export function useRoofStructures(quoteRequestId?: string) {
  const [structures, setStructures] = useState<RoofStructure[]>([]);
  const [ridgeLines, setRidgeLines] = useState<RidgeLine[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadStructures = useCallback(async () => {
    if (!quoteRequestId) return;

    try {
      setLoading(true);
      
      // Load structures
      const { data: structuresData, error: structuresError } = await supabase
        .from('roof_structures')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('structure_id');

      if (structuresError) throw structuresError;

      // Load ridge lines (skip for now as table may not exist)
      const ridgeLinesData: any[] = [];

      setStructures(structuresData?.map(s => ({
        id: s.id,
        structureId: s.structure_id,
        geometry: s.geometry,
        areaSqFt: s.area_sq_ft || 0,
        perimeterFt: s.perimeter_ft || 0,
        surfaceAreaSqFt: calculateSurfaceArea(s.area_sq_ft || 0, '4/12'),
        confidence: s.confidence || 0,
        isIncluded: s.is_included ?? true
      })) || []);

      setRidgeLines([]);

    } catch (error) {
      console.error('Error loading structures:', error);
      toast({
        title: "Error",
        description: "Failed to load roof structures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [quoteRequestId, toast]);

  const saveStructure = useCallback(async (
    structureId: string, 
    polygon: number[][], 
    pitch: string = '4/12',
    confidence: number = 1.0
  ) => {
    if (!quoteRequestId) return;

    try {
      const geometry = {
        type: 'Polygon',
        coordinates: [polygon]
      };

      const areaSqFt = geodesicArea(polygon);
      const perimeterFt = geodesicPerimeter(polygon);
      const surfaceAreaSqFt = calculateSurfaceArea(areaSqFt, pitch);

      const { error } = await supabase
        .from('roof_structures')
        .upsert({
          quote_request_id: quoteRequestId,
          structure_id: structureId,
          geometry,
          area_sq_ft: areaSqFt,
          perimeter_ft: perimeterFt,
          confidence,
          is_included: true
        });

      if (error) throw error;

      await loadStructures();
      
      toast({
        title: "Success",
        description: `Structure ${structureId} saved successfully`
      });

    } catch (error) {
      console.error('Error saving structure:', error);
      toast({
        title: "Error",
        description: "Failed to save structure",
        variant: "destructive"
      });
    }
  }, [quoteRequestId, loadStructures, toast]);

  const toggleStructureInclusion = useCallback(async (structureId: string, isIncluded: boolean) => {
    if (!quoteRequestId) return;

    try {
      const { error } = await supabase
        .from('roof_structures')
        .update({ is_included: isIncluded })
        .eq('quote_request_id', quoteRequestId)
        .eq('structure_id', structureId);

      if (error) throw error;

      setStructures(prev => 
        prev.map(s => 
          s.structureId === structureId 
            ? { ...s, isIncluded } 
            : s
        )
      );

    } catch (error) {
      console.error('Error toggling structure inclusion:', error);
      toast({
        title: "Error",
        description: "Failed to update structure",
        variant: "destructive"
      });
    }
  }, [quoteRequestId, toast]);

  const saveRidgeLine = useCallback(async (
    coordinates: number[][],
    lengthFt: number,
    label?: string
  ) => {
    // Ridge lines not implemented yet
    toast({
      title: "Info", 
      description: "Ridge line feature coming soon"
    });
  }, [toast]);

  const calculateTotals = useCallback((pitch: string = '4/12'): StructureMeasurements => {
    const includedStructures = structures.filter(s => s.isIncluded);
    
    const planAreaSqFtTotal = includedStructures.reduce((sum, s) => sum + s.areaSqFt, 0);
    const surfaceAreaSqFtTotal = calculateSurfaceArea(planAreaSqFtTotal, pitch);
    
    let eaveLfTotal = 0;
    let rakeLfTotal = 0;
    
    includedStructures.forEach(structure => {
      if (structure.geometry?.coordinates?.[0]) {
        const { eaves, rakes } = calculateLinearFeet(structure.geometry.coordinates[0]);
        eaveLfTotal += eaves;
        rakeLfTotal += rakes;
      }
    });

    const ridgeLfTotal = ridgeLines.reduce((sum, r) => sum + r.lengthFt, 0);

    return {
      planAreaSqFtTotal,
      surfaceAreaSqFtTotal,
      planSquares: calculatePlanSquares(planAreaSqFtTotal),
      surfaceSquares: calculateSurfaceSquares(surfaceAreaSqFtTotal),
      eaveLfTotal,
      rakeLfTotal,
      ridgeLfTotal,
      structures: includedStructures,
      ridgeLines
    };
  }, [structures, ridgeLines]);

  return {
    structures,
    ridgeLines,
    loading,
    loadStructures,
    saveStructure,
    toggleStructureInclusion,
    saveRidgeLine,
    calculateTotals
  };
}