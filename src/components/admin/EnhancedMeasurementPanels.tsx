import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { 
  Download, 
  RefreshCw, 
  Calculator, 
  Ruler, 
  Home, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

interface EnhancedMeasurementPanelsProps {
  data: any | null;
  roiImageUrl?: string | null;
  status?: string;
  updatedAt?: string | null;
  onDownloadJson?: () => void;
  onRerun?: () => void;
  running?: boolean;
  confidence?: number;
}

const EnhancedMeasurementPanels: React.FC<EnhancedMeasurementPanelsProps> = ({
  data,
  roiImageUrl,
  status,
  updatedAt,
  onDownloadJson,
  onRerun,
  running = false,
  confidence
}) => {
  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground space-y-4">
              <Calculator className="h-12 w-12 mx-auto opacity-50" />
              <div>
                <h3 className="text-lg font-medium mb-2">No Measurements Available</h3>
                <p className="text-sm">Run the measurement analysis to see detailed roof calculations.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const area = data?.area || {};
  const linear = data?.linear || {};
  const features = data?.features || {};
  const pitch = data?.pitch || {};
  const derived = data?.derived || {};
  const materials = data?.materials || {};

  const getStatusIcon = () => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const formatNumber = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num.toLocaleString();
  };

  const confidenceScore = confidence || derived.confidence || 0;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Measurement Results</h2>
            {getStatusIcon()}
          </div>
          {updatedAt && (
            <p className="text-sm text-muted-foreground">
              Updated: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDownloadJson} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
          <Button size="sm" onClick={onRerun} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? "Analyzing..." : "Re-run Analysis"}
          </Button>
        </div>
      </div>

      {/* Confidence Score */}
      {confidenceScore > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analysis Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accuracy Score</span>
                <span className="text-sm font-bold">{Math.round(confidenceScore * 100)}%</span>
              </div>
              <Progress value={confidenceScore * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {confidenceScore >= 0.8 ? 'High confidence - measurements are very reliable' :
                 confidenceScore >= 0.6 ? 'Good confidence - measurements are reliable' :
                 'Lower confidence - consider manual verification'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Area</p>
                <p className="text-lg font-bold">{formatNumber(area.total_sq_ft)} sq ft</p>
                <p className="text-xs text-muted-foreground">{formatNumber(area.total_squares)} squares</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Ruler className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Perimeter</p>
                <p className="text-lg font-bold">{formatNumber(derived.total_perimeter_lf)} ft</p>
                <p className="text-xs text-muted-foreground">linear feet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Roof Planes</p>
                <p className="text-lg font-bold">{formatNumber(derived.total_planes)}</p>
                <p className="text-xs text-muted-foreground">sections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Primary Pitch</p>
                <p className="text-lg font-bold">{pitch.primary || "—"}</p>
                <p className="text-xs text-muted-foreground">slope ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Measurements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Area Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Area Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Square Feet</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(area.total_sq_ft)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Squares</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(area.total_squares)}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium mb-2">Waste Factor</p>
              <div className="flex items-center gap-2">
                <Progress value={area.waste_factor_percent || 0} className="flex-1" />
                <span className="text-sm font-medium">{area.waste_factor_percent || 0}%</span>
              </div>
            </div>

            {Array.isArray(area.area_by_plane) && area.area_by_plane.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Area by Plane</p>
                <div className="space-y-2">
                  {area.area_by_plane.map((plane: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-sm">Plane {plane.plane_id || `${i + 1}`}</span>
                      <Badge variant="outline">{formatNumber(plane.sq_ft)} sq ft</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linear Measurements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Linear Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="flex justify-between">
                <span>Eave Edge:</span>
                <span className="font-medium">{formatNumber(linear.eave_edge_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Rake Edge:</span>
                <span className="font-medium">{formatNumber(linear.rake_edge_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Ridges:</span>
                <span className="font-medium">{formatNumber(linear.ridges_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Hips:</span>
                <span className="font-medium">{formatNumber(linear.hips_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Valleys:</span>
                <span className="font-medium">{formatNumber(linear.valleys_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Step Flashing:</span>
                <span className="font-medium">{formatNumber(linear.step_flashing_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Wall Flashing:</span>
                <span className="font-medium">{formatNumber(linear.wall_flashing_lf)} ft</span>
              </div>
              <div className="flex justify-between">
                <span>Drip Edge:</span>
                <span className="font-medium">{formatNumber((linear.drip_edge_eave_lf || 0) + (linear.drip_edge_rake_lf || 0))} ft</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roof Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Roof Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vents */}
            <div>
              <p className="font-medium text-sm mb-2">Ventilation</p>
              {Array.isArray(features.vents) && features.vents.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {features.vents.map((v: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="capitalize">{v.type}:</span>
                      <Badge variant="secondary">{v.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None detected</p>
              )}
            </div>

            <Separator />

            {/* Chimneys */}
            <div>
              <p className="font-medium text-sm mb-2">Chimneys</p>
              {Array.isArray(features.chimneys) && features.chimneys.length > 0 ? (
                <div className="space-y-1">
                  {features.chimneys.map((c: any, i: number) => (
                    <div key={i} className="text-sm flex justify-between">
                      <span>Count {c.count}</span>
                      <span>{c.width_ft}×{c.length_ft} ft</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None detected</p>
              )}
            </div>

            <Separator />

            {/* Other Features */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Skylights:</span>
                <Badge variant="outline">
                  {Array.isArray(features.skylights) ? 
                    features.skylights.reduce((sum: number, s: any) => sum + (s.count || 0), 0) : 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Dormers:</span>
                <Badge variant="outline">
                  {Array.isArray(features.dormers) ? features.dormers?.[0]?.count || 0 : 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>HVAC Units:</span>
                <Badge variant="outline">
                  {Array.isArray(features.hvac_units) ? features.hvac_units?.[0]?.count || 0 : 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Satellites:</span>
                <Badge variant="outline">
                  {Array.isArray(features.satellite_dishes) ? features.satellite_dishes?.[0]?.count || 0 : 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pitch Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pitch Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Primary Pitch</p>
                <p className="text-xl font-bold text-orange-600">{pitch.primary || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Average Pitch</p>
                <p className="text-xl font-bold text-orange-600">{pitch.average || "—"}</p>
              </div>
            </div>

            {Array.isArray(pitch.by_plane) && pitch.by_plane.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Pitch by Plane</p>
                <div className="space-y-2">
                  {pitch.by_plane.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-sm">Plane {p.plane_id || `${i + 1}`}</span>
                      <Badge variant="outline">{p.pitch}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Complexity:</span>
                <Badge variant={
                  derived.complexity === 'high' ? 'destructive' :
                  derived.complexity === 'medium' ? 'default' : 'secondary'
                }>
                  {derived.complexity || 'Unknown'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Waste:</span>
                <span className="font-medium">{derived.estimated_waste_percent || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Materials Estimate (if available) */}
      {materials && Object.keys(materials).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {materials.shingles_squares > 0 && (
                <div className="flex justify-between">
                  <span>Shingles:</span>
                  <span className="font-medium">{formatNumber(materials.shingles_squares)} squares</span>
                </div>
              )}
              {materials.panels_sheets > 0 && (
                <div className="flex justify-between">
                  <span>Metal Panels:</span>
                  <span className="font-medium">{formatNumber(materials.panels_sheets)} sheets</span>
                </div>
              )}
              {materials.underlayment_sq_ft > 0 && (
                <div className="flex justify-between">
                  <span>Underlayment:</span>
                  <span className="font-medium">{formatNumber(materials.underlayment_sq_ft)} sq ft</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Method */}
      {data?.method && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Analysis Method: <strong>{data.method}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedMeasurementPanels;
