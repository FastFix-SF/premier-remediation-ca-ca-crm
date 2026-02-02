import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Plus, Move } from "lucide-react";

interface QuickEditToolsProps {
  detectedRoofType: 'gable' | 'hip' | 'complex' | 'flat';
  onConvertToHip: () => void;
  onConvertToGable: () => void;
  onAddValley: () => void;
  onAdjustRidge: () => void;
}

export function QuickEditTools({
  detectedRoofType,
  onConvertToHip,
  onConvertToGable,
  onAddValley,
  onAdjustRidge
}: QuickEditToolsProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quick Edits</span>
          <span className="text-xs text-muted-foreground">
            Detected: {detectedRoofType.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {detectedRoofType !== 'hip' && (
            <Button
              onClick={onConvertToHip}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Convert to Hip
            </Button>
          )}
          
          {detectedRoofType !== 'gable' && (
            <Button
              onClick={onConvertToGable}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Convert to Gable
            </Button>
          )}
          
          <Button
            onClick={onAddValley}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Valley
          </Button>
          
          <Button
            onClick={onAdjustRidge}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Move className="w-4 h-4" />
            Adjust Ridge
          </Button>
        </div>
      </div>
    </Card>
  );
}
