import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Ruler, X } from 'lucide-react';

interface RoofMeasurementPanelProps {
  measurements: {
    area: number;
    perimeter: number;
    squares: number;
    eaves: number;
    rakes: number;
  } | null;
  onClose: () => void;
}

export const RoofMeasurementPanel: React.FC<RoofMeasurementPanelProps> = ({ measurements, onClose }) => {
  if (!measurements) return null;

  const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="absolute top-4 left-4 z-[800]">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-primary/20 p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Roof Measurements</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Plan Area</div>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(measurements.area)}
                <span className="text-sm ml-1">sq ft</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Squares</div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {(measurements.squares).toFixed(1)}
                <span className="text-sm ml-1">sq</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Perimeter</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(measurements.perimeter)}
              <span className="text-sm ml-1">ft</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Eaves</div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {formatNumber(measurements.eaves)}
                <span className="text-sm ml-1">ft</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 p-3 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">Rakes</div>
              <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                {formatNumber(measurements.rakes)}
                <span className="text-sm ml-1">ft</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Measurements from SAM 2 roof segmentation
          </div>
        </div>
      </Card>
    </div>
  );
};
