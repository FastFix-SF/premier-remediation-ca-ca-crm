import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Eye, EyeOff, Building2, Calculator } from 'lucide-react';
import { useRoofStructures } from '@/hooks/useRoofStructures';
import { PITCH_PRESETS } from '@/lib/roof/pitch';
import RoiSelector from './RoiSelector';

type RoofPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

interface MultiStructureRoiSelectorProps {
  quoteRequestId: string;
  latitude?: number | null;
  longitude?: number | null;
  existingROI?: RoofPolygon | null;
  onSaved?: (measurements: any) => void;
  propertyAddress?: string | null;
  selectedImagery?: any;
}

export default function MultiStructureRoiSelector({
  quoteRequestId,
  latitude,
  longitude,
  existingROI,
  onSaved,
  propertyAddress,
  selectedImagery
}: MultiStructureRoiSelectorProps) {
  const [currentStructureId, setCurrentStructureId] = useState('A');
  const [pitch, setPitch] = useState('4/12');
  const [showTotals, setShowTotals] = useState(true);
  
  const {
    structures,
    loading,
    loadStructures,
    saveStructure,
    toggleStructureInclusion,
    calculateTotals
  } = useRoofStructures(quoteRequestId);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  const handleRoiSaved = useCallback((roi: RoofPolygon) => {
    if (roi.coordinates?.[0]) {
      saveStructure(currentStructureId, roi.coordinates[0], pitch);
      
      // Auto-increment to next structure letter
      const nextLetter = String.fromCharCode(currentStructureId.charCodeAt(0) + 1);
      if (nextLetter <= 'Z') {
        setCurrentStructureId(nextLetter);
      }
    }
  }, [currentStructureId, pitch, saveStructure]);

  const addNewStructure = () => {
    // Find next available letter
    const usedLetters = structures.map(s => s.structureId);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < letters.length; i++) {
      if (!usedLetters.includes(letters[i])) {
        setCurrentStructureId(letters[i]);
        break;
      }
    }
  };

  const totals = calculateTotals(pitch);

  const getStructureColor = (structureId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500'
    ];
    const index = structureId.charCodeAt(0) - 65; // A=0, B=1, etc.
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Multi-Structure Roof Outline
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Drawing Structure:</Label>
              <Badge variant="outline" className="font-mono">
                {currentStructureId}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label>Pitch:</Label>
              <Select value={pitch} onValueChange={setPitch}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PITCH_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addNewStructure}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <RoiSelector
              quoteRequestId={quoteRequestId}
              latitude={latitude}
              longitude={longitude}
              existingROI={existingROI}
              onSaved={handleRoiSaved}
              propertyAddress={propertyAddress}
              selectedImagery={selectedImagery}
            />
          </div>
        </CardContent>
      </Card>

      {/* Structures Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Roof Structures ({structures.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTotals(!showTotals)}
            >
              {showTotals ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showTotals ? 'Hide' : 'Show'} Totals
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No structures defined yet. Draw a polygon on the map to add structure A.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Structures List */}
              <div className="space-y-2">
                {structures.map((structure) => (
                  <div key={structure.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStructureColor(structure.structureId)}`} />
                      <Badge variant="outline" className="font-mono min-w-8">
                        {structure.structureId}
                      </Badge>
                      <div className="text-sm space-x-4">
                        <span>{structure.areaSqFt.toFixed(0)} sq ft</span>
                        <span>{structure.perimeterFt.toFixed(0)} lf</span>
                        {structure.confidence > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(structure.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={structure.isIncluded}
                        onCheckedChange={(checked) => 
                          toggleStructureInclusion(structure.structureId, checked as boolean)
                        }
                      />
                      <Label className="text-sm">Include</Label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              {showTotals && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {totals.planAreaSqFtTotal.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Plan Area (sq ft)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {totals.surfaceAreaSqFtTotal.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Surface Area (sq ft)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {totals.planSquares.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Plan Squares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {totals.surfaceSquares.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Surface Squares</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary-foreground">
                        {totals.eaveLfTotal.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Eave (lf)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary-foreground">
                        {totals.rakeLfTotal.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Rake (lf)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-secondary-foreground">
                        {totals.ridgeLfTotal.toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Ridge (lf)</div>
                    </div>
                  </div>
                </>
              )}

              {/* Coverage Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Structures included: {totals.structures.length} of {structures.length} nearby
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSaved?.(totals)}
                  disabled={totals.structures.length === 0}
                >
                  Save Measurements
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}