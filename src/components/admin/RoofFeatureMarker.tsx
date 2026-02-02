import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Settings, 
  Target,
  Home,
  Wind,
  Sun,
  Wrench
} from 'lucide-react';

interface RoofFeature {
  id: string;
  feature_type: string;
  feature_coordinates: number[][];
  dimensions?: {
    width?: number;
    height?: number;
    area?: number;
    length?: number;
  };
  feature_count: number;
  confidence_score: number;
  measurements?: any;
}

interface RoofFeatureMarkerProps {
  imageUrl: string;
  roofFeatures: RoofFeature[];
  imageWidth?: number;
  imageHeight?: number;
  onFeatureAdd?: (feature: Partial<RoofFeature>) => void;
  onFeatureDelete?: (featureId: string) => void;
  onFeatureUpdate?: (featureId: string, updates: Partial<RoofFeature>) => void;
  editable?: boolean;
}

const FEATURE_TYPES = [
  { value: 'chimney', label: 'Chimney', icon: Home, color: 'bg-red-500' },
  { value: 'vent', label: 'Vent', icon: Wind, color: 'bg-blue-500' },
  { value: 'skylight', label: 'Skylight', icon: Sun, color: 'bg-yellow-500' },
  { value: 'gutter', label: 'Gutter', icon: Wrench, color: 'bg-gray-500' },
  { value: 'downspout', label: 'Downspout', icon: Wrench, color: 'bg-gray-700' },
  { value: 'dormer', label: 'Dormer', icon: Home, color: 'bg-purple-500' },
  { value: 'valley', label: 'Valley', icon: Target, color: 'bg-green-500' },
  { value: 'ridge', label: 'Ridge', icon: Target, color: 'bg-orange-500' },
];

const getFeatureTypeInfo = (type: string) => {
  return FEATURE_TYPES.find(ft => ft.value === type) || FEATURE_TYPES[0];
};

export const RoofFeatureMarker: React.FC<RoofFeatureMarkerProps> = ({
  imageUrl,
  roofFeatures,
  imageWidth = 800,
  imageHeight = 600,
  onFeatureAdd,
  onFeatureDelete,
  onFeatureUpdate,
  editable = false
}) => {
  const [visibleFeatures, setVisibleFeatures] = useState<Set<string>>(
    new Set(FEATURE_TYPES.map(ft => ft.value))
  );
  const [selectedFeature, setSelectedFeature] = useState<RoofFeature | null>(null);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [newFeatureType, setNewFeatureType] = useState<string>('chimney');
  const [clickCoordinates, setClickCoordinates] = useState<number[][]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const toggleFeatureVisibility = (featureType: string) => {
    const newVisible = new Set(visibleFeatures);
    if (newVisible.has(featureType)) {
      newVisible.delete(featureType);
    } else {
      newVisible.add(featureType);
    }
    setVisibleFeatures(newVisible);
  };

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!isAddingFeature || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * imageWidth;
    const y = ((event.clientY - rect.top) / rect.height) * imageHeight;

    const newCoordinates = [...clickCoordinates, [Math.round(x), Math.round(y)]];
    setClickCoordinates(newCoordinates);

    // For point features (chimney, vent, skylight), one click is enough
    if (['chimney', 'vent', 'skylight', 'downspout'].includes(newFeatureType)) {
      const newFeature: Partial<RoofFeature> = {
        feature_type: newFeatureType,
        feature_coordinates: [[Math.round(x), Math.round(y)]],
        feature_count: 1,
        confidence_score: 1.0,
        dimensions: { width: 24, height: 24, area: 576 }
      };
      
      onFeatureAdd?.(newFeature);
      setIsAddingFeature(false);
      setClickCoordinates([]);
    }
  }, [isAddingFeature, newFeatureType, clickCoordinates, imageWidth, imageHeight, onFeatureAdd]);

  const finishAddingFeature = () => {
    if (clickCoordinates.length < 2) return;

    const newFeature: Partial<RoofFeature> = {
      feature_type: newFeatureType,
      feature_coordinates: clickCoordinates,
      feature_count: 1,
      confidence_score: 1.0,
      dimensions: calculateDimensions(clickCoordinates)
    };
    
    onFeatureAdd?.(newFeature);
    setIsAddingFeature(false);
    setClickCoordinates([]);
  };

  const calculateDimensions = (coordinates: number[][]) => {
    if (coordinates.length < 2) return { width: 0, height: 0, area: 0 };
    
    const minX = Math.min(...coordinates.map(c => c[0]));
    const maxX = Math.max(...coordinates.map(c => c[0]));
    const minY = Math.min(...coordinates.map(c => c[1]));
    const maxY = Math.max(...coordinates.map(c => c[1]));
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    return {
      width: Math.round(width * 0.1), // Convert pixels to approximate feet
      height: Math.round(height * 0.1),
      area: Math.round(width * height * 0.01)
    };
  };

  const renderFeatureMarker = (feature: RoofFeature, index: number) => {
    if (!visibleFeatures.has(feature.feature_type)) return null;

    const typeInfo = getFeatureTypeInfo(feature.feature_type);
    const IconComponent = typeInfo.icon;
    
    // Calculate center point for display
    const centerX = feature.feature_coordinates.reduce((sum, coord) => sum + coord[0], 0) / feature.feature_coordinates.length;
    const centerY = feature.feature_coordinates.reduce((sum, coord) => sum + coord[1], 0) / feature.feature_coordinates.length;
    
    // Convert to percentage for positioning
    const leftPercent = (centerX / imageWidth) * 100;
    const topPercent = (centerY / imageHeight) * 100;

    return (
      <div
        key={feature.id || index}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
        style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
        onClick={() => setSelectedFeature(feature)}
      >
        <div className={`w-6 h-6 rounded-full ${typeInfo.color} flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform`}>
          <IconComponent className="w-3 h-3 text-white" />
        </div>
        {feature.feature_count > 1 && (
          <Badge className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center">
            {feature.feature_count}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Roof Features</CardTitle>
            {editable && (
              <Button
                onClick={() => setIsAddingFeature(!isAddingFeature)}
                variant={isAddingFeature ? "secondary" : "outline"}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingFeature ? 'Cancel' : 'Add Feature'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Feature Type Toggles */}
          <div className="grid grid-cols-4 gap-2">
            {FEATURE_TYPES.map((featureType) => {
              const count = roofFeatures.filter(f => f.feature_type === featureType.value).length;
              const IconComponent = featureType.icon;
              const isVisible = visibleFeatures.has(featureType.value);
              
              return (
                <Button
                  key={featureType.value}
                  variant={isVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFeatureVisibility(featureType.value)}
                  className="h-auto p-2 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1">
                    <IconComponent className="w-3 h-3" />
                    {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </div>
                  <div className="text-xs">{featureType.label}</div>
                  {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
                </Button>
              );
            })}
          </div>

          {/* Add Feature Controls */}
          {isAddingFeature && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Label htmlFor="feature-type">Feature Type:</Label>
                <Select value={newFeatureType} onValueChange={setNewFeatureType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {['chimney', 'vent', 'skylight', 'downspout'].includes(newFeatureType) 
                  ? 'Click on the image to mark this feature location.'
                  : `Click multiple points to outline the ${newFeatureType}. Click "Finish" when done.`
                }
              </div>
              
              {clickCoordinates.length > 0 && !['chimney', 'vent', 'skylight', 'downspout'].includes(newFeatureType) && (
                <div className="flex gap-2">
                  <Button onClick={finishAddingFeature} size="sm">
                    Finish {FEATURE_TYPES.find(t => t.value === newFeatureType)?.label}
                  </Button>
                  <Button 
                    onClick={() => setClickCoordinates([])} 
                    variant="outline" 
                    size="sm"
                  >
                    Clear Points
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image with Feature Markers */}
      <Card>
        <CardContent className="p-0">
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Aerial roof image with features"
              className="max-w-full h-auto cursor-crosshair"
              onClick={handleImageClick}
            />
            
            {/* Render feature markers */}
            {roofFeatures.map((feature, index) => renderFeatureMarker(feature, index))}
            
            {/* Render temporary markers for features being added */}
            {clickCoordinates.map((coord, index) => (
              <div
                key={`temp-${index}`}
                className="absolute w-3 h-3 bg-yellow-400 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ 
                  left: `${(coord[0] / imageWidth) * 100}%`, 
                  top: `${(coord[1] / imageHeight) * 100}%` 
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Details Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFeature && (
                <>
                  {React.createElement(getFeatureTypeInfo(selectedFeature.feature_type).icon, { className: "w-5 h-5" })}
                  {getFeatureTypeInfo(selectedFeature.feature_type).label} Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFeature && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground">{getFeatureTypeInfo(selectedFeature.feature_type).label}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Count</Label>
                  <p className="text-sm text-muted-foreground">{selectedFeature.feature_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confidence</Label>
                  <p className="text-sm text-muted-foreground">{Math.round(selectedFeature.confidence_score * 100)}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Coordinates</Label>
                  <p className="text-sm text-muted-foreground">{selectedFeature.feature_coordinates.length} points</p>
                </div>
              </div>
              
              {selectedFeature.dimensions && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Dimensions</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedFeature.dimensions.width && (
                        <div>Width: {selectedFeature.dimensions.width}ft</div>
                      )}
                      {selectedFeature.dimensions.height && (
                        <div>Height: {selectedFeature.dimensions.height}ft</div>
                      )}
                      {selectedFeature.dimensions.area && (
                        <div>Area: {selectedFeature.dimensions.area}sq ft</div>
                      )}
                      {selectedFeature.dimensions.length && (
                        <div>Length: {selectedFeature.dimensions.length}ft</div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {editable && (
                <>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (selectedFeature.id) {
                          onFeatureDelete?.(selectedFeature.id);
                          setSelectedFeature(null);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};