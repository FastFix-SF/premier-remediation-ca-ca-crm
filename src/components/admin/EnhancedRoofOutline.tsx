import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, Info, Edit3, Eye, Square, Trash2 } from "lucide-react";

interface EnhancedRoofOutlineProps {
  quoteRequestId: string;
  onOutlineComplete?: (result: any) => void;
}

interface RoofStructure {
  id: string;
  structure_id: string;
  geometry: any; // Use any for JSON compatibility with Supabase
  area_sq_ft: number;
  perimeter_ft: number;
  confidence: number;
  is_included: boolean;
}

interface OutlineResult {
  success: boolean;
  method: 'ai_segmentation' | 'opencv_fallback' | 'manual_needed';
  roi_image_url?: string;
  features: Array<{
    id: string;
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
    properties: {
      area_sq_ft: number;
      perimeter_ft: number;
      confidence: number;
    };
  }>;
  bbox_lonlat: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  step?: string;
  message?: string;
  details?: any;
}

const EnhancedRoofOutline: React.FC<EnhancedRoofOutlineProps> = ({
  quoteRequestId,
  onOutlineComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutlineResult | null>(null);
  const [structures, setStructures] = useState<RoofStructure[]>([]);
  const [precision, setPrecision] = useState<'high' | 'standard'>('high');
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [totalSelectedArea, setTotalSelectedArea] = useState(0);

  // Load existing roof structures
  useEffect(() => {
    loadExistingStructures();
  }, [quoteRequestId]);

  // Update total selected area when structures change
  useEffect(() => {
    const total = structures
      .filter(s => s.is_included)
      .reduce((sum, s) => sum + s.area_sq_ft, 0);
    setTotalSelectedArea(total);
  }, [structures]);

  const loadExistingStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('roof_structures')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('structure_id');

      if (error) throw error;
      if (data) {
        setStructures(data);
      }
    } catch (err) {
      console.error('Failed to load existing structures:', err);
    }
  };

  const runEnhancedOutline = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('auto-outline-roof', {
        body: { 
          quote_request_id: quoteRequestId,
          precision 
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!data.success) {
        const step = data.step || 'unknown';
        const message = data.message || 'Auto-outline failed';
        throw new Error(`${step}: ${message}`);
      }

      setResult(data);

      // Handle different response types
      if (data.method === 'manual_needed') {
        setManualMode(true);
        toast.info('Manual editing required - AI could not detect roof automatically');
      } else {
        // Load the new structures from database
        await loadExistingStructures();
        toast.success(`Roof outlined with ${data.method} (${data.features.length} structures detected)`);
      }
      
      if (onOutlineComplete) {
        onOutlineComplete(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Enhanced error toast with step information
      const stepMatch = errorMessage.match(/^(\w+(?:-\w+)*): (.+)$/);
      if (stepMatch) {
        const [, step, message] = stepMatch;
        toast.error(`auto-outline-roof failed — ${step}: ${message}`);
        console.error('Auto-outline detailed error:', { step, message, fullError: errorMessage });
      } else {
        toast.error('Auto-outline failed: ' + errorMessage);
        console.error('Auto-outline error:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStructureToggle = async (structureId: string, included: boolean) => {
    try {
      const { error } = await supabase
        .from('roof_structures')
        .update({ is_included: included })
        .eq('id', structureId);

      if (error) throw error;

      // Update local state
      setStructures(prev => prev.map(s => 
        s.id === structureId ? { ...s, is_included: included } : s
      ));

      toast.success(`Structure ${included ? 'included' : 'excluded'} from ROI`);
    } catch (err) {
      console.error('Failed to update structure:', err);
      toast.error('Failed to update structure selection');
    }
  };

  const saveSelectedROI = async () => {
    try {
      const selectedStructures = structures.filter(s => s.is_included);
      
      if (selectedStructures.length === 0) {
        toast.error('Please select at least one roof structure');
        return;
      }

      // Update quote request with selected ROI
      const roiFeatureCollection = {
        type: 'FeatureCollection',
        features: selectedStructures.map(s => ({
          type: 'Feature',
          geometry: s.geometry,
          properties: {
            id: s.structure_id,
            area_sq_ft: s.area_sq_ft,
            confidence: s.confidence
          }
        }))
      };

      const roiSummary = {
        total_area_sq_ft: totalSelectedArea,
        polygons: selectedStructures.map(s => ({
          id: s.structure_id,
          area_sq_ft: s.area_sq_ft,
          confidence: s.confidence
        })),
        method: result?.method || 'manual',
        confidence_avg: selectedStructures.reduce((sum, s) => sum + s.confidence, 0) / selectedStructures.length,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('quote_requests')
        .update({
          roof_roi: roiFeatureCollection,
          roi_summary: roiSummary
        })
        .eq('id', quoteRequestId);

      if (error) throw error;

      toast.success(`ROI saved: ${selectedStructures.length} structures, ${totalSelectedArea.toLocaleString()} sq ft total`);

      if (onOutlineComplete) {
        onOutlineComplete({ roi: roiFeatureCollection, summary: roiSummary });
      }
    } catch (err) {
      console.error('Failed to save ROI:', err);
      toast.error('Failed to save ROI selection');
    }
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      'ai_segmentation': { label: 'AI Segmentation', variant: 'default' as const, icon: '🤖' },
      'opencv_fallback': { label: 'OpenCV Fallback', variant: 'secondary' as const, icon: '🔧' },
      'manual_needed': { label: 'Manual Required', variant: 'destructive' as const, icon: '✏️' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || { 
      label: method, 
      variant: 'outline' as const, 
      icon: '❓' 
    };

    return (
      <Badge variant={config.variant} className="gap-1">
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.7) return 'text-warning'; 
    return 'text-destructive';
  };

  const getStructureColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5 text-primary" />
          Auto-Outline Roof: Multi-Structure Detection
        </CardTitle>
        <CardDescription>
          AI-powered roof detection with manual editing capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Precision:</label>
            <Select value={precision} onValueChange={(value: 'high' | 'standard') => setPrecision(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={runEnhancedOutline}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Auto-Outline Roof'}
          </Button>
        </div>

        {/* Progress indicator */}
        {loading && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Processing aerial imagery...</div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-destructive text-sm">{error}</span>
          </div>
        )}

        {/* Manual Mode Notice */}
        {manualMode && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <Info className="w-4 h-4 text-warning" />
            <span className="text-warning text-sm">
              Automatic detection failed. Please use manual editing tools or try a different precision setting.
            </span>
          </div>
        )}

        {/* Results Display */}
        {result && result.method !== 'manual_needed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-success text-sm">
                Detection completed: {result.features.length} roof structure(s) found
              </span>
            </div>

            {/* Method Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Method:</span>
              {getMethodBadge(result.method)}
            </div>
          </div>
        )}

        {/* Structure Selection */}
        {structures.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detected Roof Structures</h3>
              <div className="text-sm text-muted-foreground">
                Total Selected: {totalSelectedArea.toLocaleString()} sq ft
              </div>
            </div>

            <div className="grid gap-3">
              {structures.map((structure, index) => (
                <Card key={structure.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={structure.is_included}
                          onCheckedChange={(checked) => 
                            handleStructureToggle(structure.id, checked as boolean)
                          }
                        />
                        <div 
                          className={`w-4 h-4 rounded-full ${getStructureColor(index)}`}
                          title={`Structure ${structure.structure_id}`}
                        />
                      </div>
                      
                      <div>
                        <div className="font-medium">
                          Structure {structure.structure_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {structure.area_sq_ft.toLocaleString()} sq ft • {structure.perimeter_ft.toFixed(1)} ft perimeter
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getConfidenceColor(structure.confidence)}
                      >
                        {Math.round(structure.confidence * 100)}% confidence
                      </Badge>
                      
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={saveSelectedROI} className="flex-1">
                Save ROI ({structures.filter(s => s.is_included).length} selected)
              </Button>
              
              <Button variant="outline" onClick={() => setManualMode(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Manual Edit
              </Button>
            </div>
          </div>
        )}

        {/* Method Information */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
              <div className="font-medium">Detection Methods:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <span><strong>AI Segmentation:</strong> Advanced neural networks for precise roof detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔧</span>
                  <span><strong>OpenCV Fallback:</strong> Computer vision edge detection for challenging cases</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✏️</span>
                  <span><strong>Manual Mode:</strong> Draw and edit roof outlines when AI detection fails</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                System automatically selects the best method based on image quality and confidence scores (≥70% threshold).
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default EnhancedRoofOutline;