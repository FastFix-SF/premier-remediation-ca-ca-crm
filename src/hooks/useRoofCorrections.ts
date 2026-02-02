import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoofCorrection {
  quoteRequestId: string;
  visionAnalysisId?: string;
  originalVertices: [number, number][];
  correctedVertices: [number, number][];
  originalEdges?: any[];
  correctedEdges?: any[];
  roofType?: string;
  imageQuality?: string;
  correctionNotes?: string;
  latitude?: number;
  longitude?: number;
}

export const useRoofCorrections = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveCorrection = async (correction: RoofCorrection) => {
    setIsSaving(true);
    try {
      // Calculate adjustment summary using the database function
      const { data: adjustmentData, error: calcError } = await supabase
        .rpc('calculate_correction_adjustments', {
          original: correction.originalVertices,
          corrected: correction.correctedVertices
        });

      if (calcError) {
        console.warn('Could not calculate adjustment summary:', calcError);
      }

      // Insert the correction record
      const { data, error } = await supabase
        .from('roof_corrections')
        .insert({
          quote_request_id: correction.quoteRequestId,
          vision_analysis_id: correction.visionAnalysisId,
          original_vertices: correction.originalVertices,
          corrected_vertices: correction.correctedVertices,
          original_edges: correction.originalEdges,
          corrected_edges: correction.correctedEdges,
          roof_type: correction.roofType,
          image_quality: correction.imageQuality,
          correction_notes: correction.correctionNotes,
          adjustment_summary: adjustmentData,
          location_lat: correction.latitude,
          location_lng: correction.longitude,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log('✅ Roof correction saved for AI learning:', data.id);
      toast.success('Correction saved for AI learning', {
        description: 'Future predictions will improve based on this adjustment'
      });

      return data;
    } catch (error) {
      console.error('Error saving roof correction:', error);
      toast.error('Failed to save correction');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveCorrection,
    isSaving
  };
};
