import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { McElroyColors } from '../utils/mcElroyColors';
import { Check } from 'lucide-react';

interface ColorPaletteProps {
  selectedColor?: string;
  onColorSelect: (colorKey: string, hex: string) => void;
  className?: string;
}

export const ColorPalette = ({ selectedColor, onColorSelect, className }: ColorPaletteProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Keyboard shortcuts for colors 1-9
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= 9) {
        const colorEntries = Object.entries(McElroyColors);
        const colorIndex = key - 1;
        if (colorIndex < colorEntries.length) {
          const [colorKey, hex] = colorEntries[colorIndex];
          onColorSelect(colorKey, hex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onColorSelect]);

  const colorGroups = {
    'Whites & Lights': [
      'Regal White', 'Bone White', 'Surrey Beige', 'Sandstone', 'Almond'
    ],
    'Grays & Darks': [
      'Ash Gray', 'Slate Gray', 'Charcoal', 'Dark Charcoal', 'Matte Black'
    ],
    'Browns & Earth': [
      'Buckskin', 'Medium Bronze', 'Dark Bronze', 'Mansard Brown', 'Patrician Bronze'
    ],
    'Colors': [
      'Patina Green', 'Evergreen', 'Colonial Red', 'Roman Blue', 'Terra Cotta',
      'Regal Blue', 'Brite Red', 'Hartford Green', 'Brandywine'
    ],
    'Metallics': [
      'Galvalume Plus', 'Silver Metallic', 'Champagne Metallic', 
      'Copper Penny Metallic', 'Texas Silver Metallic', 'Leadcoat', 
      'Preweathered Galvalume'
    ]
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">McElroy Metal Colors</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click a color or use keys 1-9 for quick selection
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(colorGroups).map(([groupName, colors]) => (
          <div key={groupName} className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {groupName}
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {colors.map((colorKey) => {
                const hex = McElroyColors[colorKey];
                const isSelected = selectedColor === hex;
                const colorIndex = Object.keys(McElroyColors).indexOf(colorKey);
                const keyboardNumber = colorIndex < 9 ? colorIndex + 1 : null;

                return (
                  <div key={colorKey} className="relative">
                    <Button
                      variant="outline"
                      className={`
                        w-full h-16 p-1 relative overflow-hidden
                        transition-all duration-200
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                        ${hoveredColor === colorKey ? 'scale-105 shadow-lg' : ''}
                      `}
                      style={{ 
                        backgroundColor: hex,
                        borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'
                      }}
                      onClick={() => onColorSelect(colorKey, hex)}
                      onMouseEnter={() => setHoveredColor(colorKey)}
                      onMouseLeave={() => setHoveredColor(null)}
                      title={`${colorKey} (${hex})`}
                    >
                      {/* Keyboard shortcut badge */}
                      {keyboardNumber && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 h-5 w-5 p-0 text-xs"
                        >
                          {keyboardNumber}
                        </Badge>
                      )}

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-background rounded-full p-1">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}

                      {/* Color preview overlay for better contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    </Button>

                    {/* Color name tooltip on hover */}
                    {hoveredColor === colorKey && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10">
                        <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-md border">
                          {colorKey}
                          <div className="text-xs opacity-70">{hex}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};