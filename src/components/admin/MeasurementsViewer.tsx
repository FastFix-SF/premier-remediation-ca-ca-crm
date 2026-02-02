import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { RoofMeasurementData } from '@/hooks/useRoofMeasurements';

interface MeasurementsViewerProps {
  data: RoofMeasurementData;
  confidence: number;
  notes?: string;
}

const MeasurementsViewer: React.FC<MeasurementsViewerProps> = ({
  data,
  confidence,
  notes
}) => {
  const formatNumber = (num: number) => {
    return num ? num.toLocaleString() : '0';
  };

  const formatSquares = (sqFt: number) => {
    const squares = sqFt / 100;
    return `${formatNumber(sqFt)} sq ft (${squares.toFixed(1)} squares)`;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Confidence and Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Analysis Confidence:</span>
              <Badge variant={confidence > 0.8 ? 'default' : confidence > 0.6 ? 'secondary' : 'destructive'}>
                {Math.round(confidence * 100)}%
              </Badge>
            </div>
            <Badge className={getComplexityColor(data.derived.complexity)}>
              {data.derived.complexity} complexity
            </Badge>
          </div>
          {notes && (
            <div>
              <p className="text-sm font-medium mb-2">Analysis Notes:</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Measurements Accordion */}
      <Accordion type="multiple" defaultValue={['area', 'linear']} className="space-y-2">
        {/* Area Measurements */}
        <AccordionItem value="area">
          <AccordionTrigger className="text-lg font-semibold">
            Area Measurements
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Area</p>
                  <p className="text-xl font-bold text-primary">
                    {formatSquares(data.area.total_sq_ft)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Squares</p>
                  <p className="text-xl font-bold">
                    {data.area.total_squares.toFixed(1)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium mb-2">Roof Planes</p>
                <div className="space-y-2">
                  {data.area.planes.map((plane, index) => (
                    <div key={plane.id} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-medium">Plane {plane.id}</span>
                      <span>{formatNumber(plane.sq_ft)} sq ft</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm font-medium">Waste Factor</span>
                <span className="font-semibold">{data.area.waste_factor_percent}%</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Linear Measurements */}
        <AccordionItem value="linear">
          <AccordionTrigger className="text-lg font-semibold">
            Linear Measurements
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Perimeter Edges</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Eave Edge:</span>
                    <span>{formatNumber(data.linear.eave_edge_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rake Edge:</span>
                    <span>{formatNumber(data.linear.rake_edge_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drip Edge (Eave):</span>
                    <span>{formatNumber(data.linear.drip_edge_eave_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drip Edge (Rake):</span>
                    <span>{formatNumber(data.linear.drip_edge_rake_lf)} LF</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Roof Lines</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ridges:</span>
                    <span>{formatNumber(data.linear.ridges_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hips:</span>
                    <span>{formatNumber(data.linear.hips_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valleys:</span>
                    <span>{formatNumber(data.linear.valleys_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pitch Breaks:</span>
                    <span>{formatNumber(data.linear.pitch_break_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Step Flashing:</span>
                    <span>{formatNumber(data.linear.step_flashing_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wall Flashing:</span>
                    <span>{formatNumber(data.linear.wall_flashing_apron_lf)} LF</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Feature Counts */}
        <AccordionItem value="features">
          <AccordionTrigger className="text-lg font-semibold">
            Feature Counts
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Chimneys</p>
                  {data.features.chimneys.map((chimney, index) => (
                    <div key={index} className="text-sm">
                      <span>{chimney.count} chimney(s)</span>
                      {chimney.sizes.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({chimney.sizes.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="font-medium mb-2">Skylights</p>
                  {data.features.skylights.map((skylight, index) => (
                    <div key={index} className="text-sm">
                      <span>{skylight.count} skylight(s)</span>
                      {skylight.sizes.length > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({skylight.sizes.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Vents</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pipe Boots:</span>
                    <span>{data.features.vents.pipe_boots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Box Vents:</span>
                    <span>{data.features.vents.box_vents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turbine Vents:</span>
                    <span>{data.features.vents.turbine_vents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ridge Vents:</span>
                    <span>{formatNumber(data.features.vents.ridge_vents_lf)} LF</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Dormers:</span>
                  <span>{data.features.dormers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Satellites:</span>
                  <span>{data.features.satellite_dishes}</span>
                </div>
                <div className="flex justify-between">
                  <span>HVAC Units:</span>
                  <span>{data.features.hvac_units}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pitch Information */}
        <AccordionItem value="pitch">
          <AccordionTrigger className="text-lg font-semibold">
            Pitch Information
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Primary</p>
                  <p className="font-semibold">{data.pitch.primary}</p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="font-semibold">{data.pitch.average}</p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Range</p>
                  <p className="font-semibold">{data.pitch.range}</p>
                </div>
              </div>

              {data.pitch.by_plane.length > 0 && (
                <div>
                  <p className="font-medium mb-2">By Plane</p>
                  <div className="space-y-1">
                    {data.pitch.by_plane.map((plane) => (
                      <div key={plane.id} className="flex justify-between p-2 border rounded text-sm">
                        <span>Plane {plane.id}</span>
                        <span className="font-medium">{plane.pitch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Material Calculations */}
        <AccordionItem value="materials">
          <AccordionTrigger className="text-lg font-semibold">
            Material Calculations
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Roofing Materials</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Shingles:</span>
                      <span>{data.materials.shingles_squares} squares</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Panels/Sheets:</span>
                      <span>{data.materials.panels_sheets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Underlayment:</span>
                      <span>{formatNumber(data.materials.underlayment_sq_ft)} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ice & Water:</span>
                      <span>{formatNumber(data.materials.ice_water_lf)} LF</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Accessories</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ridge Caps:</span>
                      <span>{formatNumber(data.materials.ridge_caps_lf)} LF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hip Ridge:</span>
                      <span>{formatNumber(data.materials.hip_ridge_shingles_lf)} LF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Starter Strip:</span>
                      <span>{formatNumber(data.materials.starter_strip_lf)} LF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valley Liner:</span>
                      <span>{formatNumber(data.materials.valley_liner_lf)} LF</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Gutters & Drainage</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Gutters:</span>
                    <span>{formatNumber(data.materials.gutters_lf)} LF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downspouts:</span>
                    <span>{data.materials.downspouts_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gutter Guards:</span>
                    <span>{formatNumber(data.materials.gutter_guards_lf)} LF</span>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Derived Project Info */}
        <AccordionItem value="derived">
          <AccordionTrigger className="text-lg font-semibold">
            Derived Project Info
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total Planes:</span>
                  <span>{data.derived.total_planes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Perimeter:</span>
                  <span>{formatNumber(data.derived.total_perimeter_lf)} LF</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Complexity:</span>
                  <Badge className={getComplexityColor(data.derived.complexity)}>
                    {data.derived.complexity}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Est. Waste:</span>
                  <span>{data.derived.estimated_waste_percent}%</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MeasurementsViewer;