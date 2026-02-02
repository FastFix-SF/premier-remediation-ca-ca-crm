import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Brain, Target, Trash2, RefreshCw, Calculator } from 'lucide-react';
import { useRoofAnalysis, RoofAnalysis } from '@/hooks/useRoofAnalysis';
import { useRoofMeasurements } from '@/hooks/useRoofMeasurements';
import MeasurementsViewer from './MeasurementsViewer';
import { toast } from 'sonner';

interface RoofAnalysisViewerProps {
  aerialImageId: string;
  imageUrl: string;
  propertyAddress: string;
  projectId?: string;
  onAnalysisUpdate?: () => void;
}

const RoofAnalysisViewer: React.FC<RoofAnalysisViewerProps> = ({
  aerialImageId,
  imageUrl,
  propertyAddress,
  projectId,
  onAnalysisUpdate
}) => {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const {
    roofAnalysis,
    roofPlanes,
    roofFeatures,
    isLoading,
    analyzeRoof,
    deleteAnalysis,
    refetch
  } = useRoofAnalysis(aerialImageId);

  const {
    roofMeasurement,
    measureRoof
  } = useRoofMeasurements(projectId);

  const handleAnalyzeRoof = async () => {
    try {
      await analyzeRoof.mutateAsync({
        aerialImageId,
        imageUrl,
        propertyAddress
      });
      onAnalysisUpdate?.();
    } catch (error) {
      console.error('Failed to analyze roof:', error);
    }
  };

  const handleDeleteAnalysis = async () => {
    if (!roofAnalysis) return;
    
    try {
      await deleteAnalysis.mutateAsync(roofAnalysis.id);
      onAnalysisUpdate?.();
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const handleMeasureRoof = async () => {
    if (!projectId) {
      toast.error('Project ID is required for measurements');
      return;
    }
    
    try {
      await measureRoof.mutateAsync({
        projectId,
        imageUrl,
        address: propertyAddress
      });
      onAnalysisUpdate?.();
    } catch (error) {
      console.error('Failed to measure roof:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getComplexityLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score <= 3) return 'Simple';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Complex';
    return 'Very Complex';
  };

  const formatConfidence = (score?: number) => {
    if (!score) return 'N/A';
    return `${Math.round(score * 100)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading roof analysis...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              AI Roof Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              {projectId && roofMeasurement && (
                <Badge variant="outline" className="text-xs">
                  Last measured: {new Date(roofMeasurement.created_at).toLocaleDateString()}
                </Badge>
              )}
              {roofAnalysis && (
                <Badge variant={getStatusBadgeVariant(roofAnalysis.analysis_status)}>
                  {roofAnalysis.analysis_status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!roofAnalysis ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No roof analysis available for this image.
              </p>
              <Button 
                onClick={handleAnalyzeRoof}
                disabled={analyzeRoof.isPending}
                className="w-full"
              >
                {analyzeRoof.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing Roof...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Roof with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Analysis Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Roof Area</p>
                  <p className="text-2xl font-bold text-primary">
                    {roofAnalysis.total_roof_area?.toLocaleString() || 'N/A'} sq ft
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Complexity</p>
                  <p className="text-lg font-semibold">
                    {getComplexityLabel(roofAnalysis.roof_complexity_score)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">AI Confidence</p>
                  <p className="text-lg font-semibold">
                    {formatConfidence(roofAnalysis.ai_confidence_score)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Roof Planes</p>
                  <p className="text-lg font-semibold">
                    {roofPlanes.length} detected
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalysisModal(true)}
                  className="flex-1"
                >
                  <Target className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                {projectId && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMeasureRoof}
                    disabled={measureRoof.isPending}
                  >
                    {measureRoof.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeRoof}
                  disabled={analyzeRoof.isPending}
                >
                  <Brain className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAnalysis}
                  disabled={deleteAnalysis.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detailed Roof Analysis</DialogTitle>
              {projectId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMeasureRoof}
                  disabled={measureRoof.isPending}
                >
                  {measureRoof.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing (10-30s)...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      {roofMeasurement ? 'Re-measure with AI' : 'Measure with AI'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {roofAnalysis && (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="text-xl font-bold text-primary">
                    {roofAnalysis.total_roof_area?.toLocaleString()} sq ft
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Complexity</p>
                  <p className="text-lg font-semibold">
                    {roofAnalysis.roof_complexity_score}/10
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-lg font-semibold">
                    {formatConfidence(roofAnalysis.ai_confidence_score)}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Roof Planes</p>
                  <p className="text-lg font-semibold">
                    {roofPlanes.length}
                  </p>
                </div>
              </div>

              {/* Roof Planes Details */}
              {roofPlanes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Roof Planes</h3>
                  <div className="space-y-2">
                    {roofPlanes.map((plane, index) => (
                      <div key={plane.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            Plane {index + 1}
                          </Badge>
                          <span className="capitalize">{plane.plane_type}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {plane.area_sqft?.toLocaleString() || 'N/A'} sq ft
                          </p>
                          {plane.slope_angle && (
                            <p className="text-sm text-muted-foreground">
                              {plane.slope_angle}° slope
                            </p>
                          )}
                        </div>
                  </div>
                ))}
              </div>

              {/* Measurements Section */}
              {roofMeasurement ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">RoofSnap Measurements</h3>
                  <MeasurementsViewer 
                    data={roofMeasurement.data}
                    confidence={roofMeasurement.confidence_score}
                    notes={roofMeasurement.analysis_notes}
                  />
                </div>
              ) : projectId ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Measurements Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the AI assistant to generate comprehensive roof measurements
                  </p>
                  <Button onClick={handleMeasureRoof} disabled={measureRoof.isPending}>
                    {measureRoof.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Measure with AI
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Project ID required for AI measurements
                  </p>
                </div>
              )}
            </div>
              )}

              {/* AI Analysis Notes */}
              {roofAnalysis.ai_response_data?.analysis_notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Analysis Notes</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      {roofAnalysis.ai_response_data.analysis_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Data */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Technical Data</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Analysis ID:</p>
                    <p className="text-muted-foreground font-mono">
                      {roofAnalysis.id}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Created:</p>
                    <p className="text-muted-foreground">
                      {new Date(roofAnalysis.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Roof Outline Points:</p>
                    <p className="text-muted-foreground">
                      {roofAnalysis.roof_outline_coordinates?.length || 0} coordinates
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status:</p>
                    <Badge variant={getStatusBadgeVariant(roofAnalysis.analysis_status)}>
                      {roofAnalysis.analysis_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoofAnalysisViewer;