import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EDGE_COLORS, type EdgeLabel } from '@/types/roof-quoter';

interface EdgesTabProps {
  projectId: string;
}

export function EdgesTab({ projectId }: EdgesTabProps) {
  const edgeTypes: { label: EdgeLabel; description: string }[] = [
    { label: 'EAVE', description: 'Bottom edge where roof meets wall' },
    { label: 'RAKE', description: 'Sloped edge at gable end' },
    { label: 'RIDGE', description: 'Peak where two roof planes meet' },
    { label: 'HIP', description: 'Exterior angle where two slopes meet' },
    { label: 'VALLEY', description: 'Interior angle where two slopes meet' },
    { label: 'STEP', description: 'Vertical edge between roof levels' },
    { label: 'WALL', description: 'Edge against a wall or parapet' },
    { label: 'PITCH_CHANGE', description: 'Edge where roof pitch changes' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edge Classification</CardTitle>
          <CardDescription>
            Click on roof edges to classify them by type. Each type has different material and pricing requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {edgeTypes.map((edge) => (
              <div
                key={edge.label}
                className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderColor: EDGE_COLORS[edge.label] }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: EDGE_COLORS[edge.label] }}
                  />
                  <Badge variant="outline" className="text-xs">
                    {edge.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {edge.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canvas Placeholder</CardTitle>
          <CardDescription>
            Interactive canvas for edge labeling will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Edge labeling canvas coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}