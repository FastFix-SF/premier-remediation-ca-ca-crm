import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MultiStructureRoiSelector from '@/components/admin/MultiStructureRoiSelector';

export default function MultiStructureDemo() {
  // Demo quote request ID - in a real app this would come from routing
  const demoQuoteRequestId = "00000000-0000-0000-0000-000000000001";
  
  // Demo coordinates for San Francisco
  const demoLatitude = 37.7749;
  const demoLongitude = -122.4194;
  const demoAddress = "1234 Demo Street, San Francisco, CA";
  
  // Demo selected imagery data
  const demoImagery = {
    bbox: {
      minLng: -122.4204,
      minLat: 37.7739,
      maxLng: -122.4184,
      maxLat: 37.7759
    }
  };

  const handleMeasurementsSaved = (measurements: any) => {
    console.log('Multi-structure measurements saved:', measurements);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Multi-Structure Roof Analysis</h1>
          <p className="text-muted-foreground">
            Demo of geodesic measurements, pitch-adjusted squares, and multi-structure support
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">Geodesic Measurements</Badge>
            <Badge variant="secondary">Pitch-Adjusted Squares</Badge>
            <Badge variant="secondary">Multi-Structure ROI</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Quote Request ID:</strong> {demoQuoteRequestId}</p>
            <p><strong>Address:</strong> {demoAddress}</p>
            <p><strong>Coordinates:</strong> {demoLatitude}, {demoLongitude}</p>
            <p><strong>Features:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Draw multiple structures (A, B, C, etc.) on the same property</li>
              <li>• Auto-outline detection with multi-structure support</li>
              <li>• Geodesic area and perimeter calculations for accuracy</li>
              <li>• Pitch-adjusted surface area calculations</li>
              <li>• Plan squares vs Surface squares comparison</li>
              <li>• Eave/rake linear feet classification</li>
              <li>• Ridge line measurements (manual entry)</li>
              <li>• Structure inclusion/exclusion toggles</li>
              <li>• Real-time totals calculation</li>
            </ul>
          </CardContent>
        </Card>

        <MultiStructureRoiSelector
          quoteRequestId={demoQuoteRequestId}
          latitude={demoLatitude}
          longitude={demoLongitude}
          propertyAddress={demoAddress}
          selectedImagery={demoImagery}
          onSaved={handleMeasurementsSaved}
        />

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold">1. Draw Your First Structure (A)</h4>
              <p className="text-muted-foreground">
                Use the polygon drawing tool on the map to outline the main roof structure. 
                Click "Save ROI" or let the auto-outline detect it for you.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">2. Add Additional Structures</h4>
              <p className="text-muted-foreground">
                Click "+ Add Structure" to switch to structure B, C, etc. 
                Draw additional buildings, garages, or detached structures.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">3. Review Measurements</h4>
              <p className="text-muted-foreground">
                Check the structure table for area, perimeter, and confidence scores. 
                Toggle structures on/off to see how totals change.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">4. Adjust Pitch</h4>
              <p className="text-muted-foreground">
                Change the roof pitch to see how it affects surface area and squares calculations.
                Compare plan squares (2D) vs surface squares (3D with pitch factor).
              </p>
            </div>
            <div>
              <h4 className="font-semibold">5. Auto-Outline Detection</h4>
              <p className="text-muted-foreground">
                The "Auto-Outline Roof" button can detect multiple structures automatically 
                and save them as separate polygons (A, B, C, etc.).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}