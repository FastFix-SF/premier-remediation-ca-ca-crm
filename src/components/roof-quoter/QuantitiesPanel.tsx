import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Quantities } from '@/types/roof-quoter';

interface QuantitiesPanelProps {
  projectId: string;
  quantities: Quantities | null;
}

export function QuantitiesPanel({ projectId, quantities }: QuantitiesPanelProps) {
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0.0';
    return num.toFixed(1);
  };

  const formatLinearFeet = (num: number | undefined) => {
    if (!num) return '0';
    return Math.round(num).toString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Live Quantities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Area */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Area</span>
              <Badge variant="secondary">
                {formatNumber(quantities?.area_sq)} SQ
              </Badge>
            </div>
          </div>

          {/* Linear Feet */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Linear Feet</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Eave
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.eave_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Rake
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.rake_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Ridge
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.ridge_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Hip
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.hip_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Valley
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.valley_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  Wall
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.wall_lf)} LF</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Step
                </span>
                <span className="font-medium">{formatLinearFeet(quantities?.step_lf)} LF</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Selected Facet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Select a facet to view details</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}