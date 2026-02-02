import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrainingSessionOptions {
  quoteId: string;
  enabled?: boolean;
}

export const useTrainingSession = ({ quoteId, enabled = true }: TrainingSessionOptions) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState({
    totalActions: 0,
    totalLines: 0,
    totalFacets: 0,
    sessionDuration: 0
  });
  
  const startTimeRef = useRef<number>(Date.now());
  const lastActionTimeRef = useRef<number>(Date.now());
  const actionsBufferRef = useRef<any[]>([]);

  // Manual start session function
  const startSession = useCallback(async () => {
    if (!quoteId || isTracking) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quote_training_sessions')
        .insert({
          quote_id: quoteId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          actions_sequence: []
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      setSessionId(data.id);
      setIsTracking(true);
      startTimeRef.current = Date.now();
      
      toast.success('AI learning session started');
      console.log('📚 Training session started:', data.id);
    } catch (error) {
      console.error('Error starting training session:', error);
      toast.error('Failed to start learning session');
    }
  }, [quoteId, isTracking]);

  // Manual stop session function
  const stopSession = useCallback(async () => {
    if (!sessionId) return;
    await endSession();
    toast.success('AI learning session stopped');
  }, [sessionId]);

  // Track action
  const trackAction = useCallback(async (
    actionType: string,
    actionData: any,
    additionalContext?: {
      stateBefore?: any;
      stateAfter?: any;
      toolActive?: string;
      viewState?: any;
    }
  ) => {
    if (!isTracking || !sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = Date.now();
      const timeSinceLastAction = now - lastActionTimeRef.current;
      lastActionTimeRef.current = now;

      const action = {
        quote_id: quoteId,
        session_id: sessionId,
        user_id: user.id,
        action_type: actionType,
        action_data: actionData,
        state_before: additionalContext?.stateBefore,
        state_after: additionalContext?.stateAfter,
        time_since_last_action_ms: timeSinceLastAction,
        tool_active: additionalContext?.toolActive,
        view_state: additionalContext?.viewState,
        timestamp: new Date().toISOString()
      };

      // Buffer actions to avoid too many DB writes
      actionsBufferRef.current.push(action);

      // Flush buffer every 5 actions
      if (actionsBufferRef.current.length >= 5) {
        await flushActionsBuffer();
      }

      setStats(prev => ({ ...prev, totalActions: prev.totalActions + 1 }));
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  }, [isTracking, sessionId, quoteId]);

  // Flush actions buffer
  const flushActionsBuffer = useCallback(async () => {
    if (actionsBufferRef.current.length === 0) return;

    try {
      const { error } = await supabase
        .from('user_actions_log')
        .insert(actionsBufferRef.current);

      if (error) throw error;
      
      actionsBufferRef.current = [];
    } catch (error) {
      console.error('Failed to flush actions buffer:', error);
    }
  }, []);

  // Save edge training data with enhanced context for autonomous learning
  const saveEdgeTraining = useCallback(async (edgeData: {
    lineGeometry: any;
    edgeType: string;
    lengthFt?: number;
    angleDegrees?: number;
    neighboringLines?: any[];
    imageryMetadata?: any;
    roofContext?: any;
    wasAiSuggestion?: boolean;
    userAccepted?: boolean;
    correctionApplied?: boolean;
    visualFeatures?: {
      colorPattern?: string[];
      textureDescriptor?: any;
      edgeSharpness?: number;
      shadowPresence?: boolean;
    };
    spatialContext?: {
      distanceToRoofCenter?: number;
      orientationToNorth?: number;
      elevationEstimate?: number;
      adjacentStructures?: string[];
    };
    drawingSequence?: {
      orderInSession?: number;
      timeSinceSessionStart?: number;
      previousEdgeType?: string;
      nextExpectedType?: string;
    };
    correctionMetadata?: {
      originalPrediction?: string;
      confidenceScore?: number;
      reasonForCorrection?: string;
      userHesitationTime?: number;
    };
  }) => {
    if (!isTracking || !sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Enrich training data with additional autonomous learning features
      const enrichedData = {
        quote_id: quoteId,
        user_id: user.id,
        session_id: sessionId,
        line_geometry: edgeData.lineGeometry,
        edge_type: edgeData.edgeType,
        length_ft: edgeData.lengthFt,
        angle_degrees: edgeData.angleDegrees,
        neighboring_lines: edgeData.neighboringLines,
        imagery_metadata: {
          ...edgeData.imageryMetadata,
          // Add visual context for computer vision training
          visualFeatures: edgeData.visualFeatures,
          spatialContext: edgeData.spatialContext,
        },
        roof_context: {
          ...edgeData.roofContext,
          // Enhanced roof structure understanding
          totalEdgesInRoof: edgeData.roofContext?.totalEdges,
          roofComplexity: edgeData.roofContext?.complexity,
          typicalEdgePatterns: edgeData.roofContext?.patterns,
        },
        was_ai_suggestion: edgeData.wasAiSuggestion || false,
        user_accepted: edgeData.userAccepted,
        correction_applied: edgeData.correctionApplied || false,
        // Critical: Store correction patterns for learning from mistakes
        correction_metadata: edgeData.correctionApplied ? edgeData.correctionMetadata : null,
        // Drawing workflow context
        drawing_sequence: edgeData.drawingSequence,
        // Training quality score (higher = better training example)
        training_quality_score: calculateTrainingQuality(edgeData),
      };

      const { error } = await supabase
        .from('edge_training_data')
        .insert(enrichedData);

      if (error) throw error;
      
      setStats(prev => ({ ...prev, totalLines: prev.totalLines + 1 }));

      // Log high-value corrections for reinforcement learning
      if (edgeData.correctionApplied && edgeData.correctionMetadata) {
        await logCorrection(edgeData);
      }
    } catch (error) {
      console.error('Failed to save edge training:', error);
    }
  }, [isTracking, sessionId, quoteId]);

  // Calculate training quality score for prioritizing training examples
  const calculateTrainingQuality = (edgeData: any): number => {
    let score = 1.0;
    
    // Higher value for corrections (AI learns most from mistakes)
    if (edgeData.correctionApplied) score += 2.0;
    
    // Higher value for edges with complete context
    if (edgeData.neighboringLines?.length > 0) score += 0.5;
    if (edgeData.visualFeatures) score += 0.5;
    if (edgeData.spatialContext) score += 0.5;
    
    // Higher value for complex edge types (harder to learn)
    const complexTypes = ['valley', 'hip', 'step'];
    if (complexTypes.includes(edgeData.edgeType?.toLowerCase())) score += 1.0;
    
    return Math.min(score, 5.0);
  };

  // Log corrections for reinforcement learning
  const logCorrection = async (edgeData: any) => {
    try {
      await supabase.from('ai_suggestions').insert({
        quote_id: quoteId,
        session_id: sessionId,
        suggestion_type: 'edge_classification',
        suggested_data: {
          predictedType: edgeData.correctionMetadata?.originalPrediction,
          geometry: edgeData.lineGeometry,
        },
        confidence_score: edgeData.correctionMetadata?.confidenceScore || 0,
        user_action: 'rejected', // Correction means AI was wrong
        modified_data: {
          actualType: edgeData.edgeType,
          correctedBy: 'user',
        },
        feedback_notes: edgeData.correctionMetadata?.reasonForCorrection,
        context_data: {
          geometry: edgeData.lineGeometry,
          visualFeatures: edgeData.visualFeatures,
          spatialContext: edgeData.spatialContext,
          neighboringLines: edgeData.neighboringLines,
        },
        responded_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log correction:', error);
    }
  };

  // Save facet training data for autonomous facet detection
  const saveFacetTraining = useCallback(async (facetData: {
    facetGeometry: any;
    facetLabels: string[];
    pitch?: number;
    area?: number;
    boundingEdges?: any[];
    roofMaterial?: string;
    visualAppearance?: any;
    detectionMethod?: 'manual' | 'polygon_detection' | 'ai_suggested';
  }) => {
    if (!isTracking || !sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await trackAction('facet_created', {
        facetData,
        trainingPurpose: 'autonomous_facet_detection',
      });

      setStats(prev => ({ ...prev, totalFacets: prev.totalFacets + 1 }));
    } catch (error) {
      console.error('Failed to save facet training:', error);
    }
  }, [isTracking, sessionId, trackAction]);

  // Save pin training data for autonomous feature detection
  const savePinTraining = useCallback(async (pinData: {
    pinLocation: [number, number];
    pinType: string;
    imageUrl?: string;
    surroundingContext?: any;
    purposeDescription?: string;
  }) => {
    if (!isTracking || !sessionId) return;

    try {
      await trackAction('pin_placed', {
        pinData,
        trainingPurpose: 'autonomous_feature_detection',
      });
    } catch (error) {
      console.error('Failed to save pin training:', error);
    }
  }, [isTracking, sessionId, trackAction]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Flush any remaining actions
      await flushActionsBuffer();

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const { error } = await supabase
        .from('quote_training_sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          total_actions: stats.totalActions,
          total_lines_drawn: stats.totalLines,
          total_facets_created: stats.totalFacets
        })
        .eq('id', sessionId);

      if (error) throw error;

      console.log('📚 Training session ended. Stats:', {
        duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
        actions: stats.totalActions,
        lines: stats.totalLines
      });

      setIsTracking(false);
      setSessionId(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [sessionId, stats, flushActionsBuffer]);

  // End session on unmount if still tracking
  useEffect(() => {
    return () => {
      if (sessionId && isTracking) {
        endSession();
      }
    };
  }, [sessionId, isTracking]);

  return {
    sessionId,
    isTracking,
    stats,
    trackAction,
    saveEdgeTraining,
    saveFacetTraining,
    savePinTraining,
    startSession,
    stopSession,
    endSession
  };
};
