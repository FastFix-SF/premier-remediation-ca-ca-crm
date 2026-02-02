import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FacetsTabProps {
  projectId: string;
}

export function FacetsTab({ projectId }: FacetsTabProps) {
  const [selectedPitch, setSelectedPitch] = useState([4]);
  const [selectedStory, setSelectedStory] = useState(1);
  const [flags, setFlags] = useState({
    twoStory: false,
    lowSlope: false,
    tearOff: false
  });

  const { data: facets } = useQuery({
    queryKey: ['facets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    }
  });

  const pitchPresets = [
    { value: 0, label: 'Flat' },
    { value: 1, label: '1/12' },
    { value: 2, label: '2/12' },
    { value: 3, label: '3/12' },
    { value: 4, label: '4/12' },
    { value: 5, label: '5/12' },
    { value: 6, label: '6/12' },
    { value: 8, label: '8/12' },
    { value: 10, label: '10/12' },
    { value: 12, label: '12/12' }
  ];

  const getSlopeFactor = (pitch: number) => {
    if (pitch === 0) return 1.0;
    return Math.sqrt(1 + Math.pow(pitch / 12, 2));
  };

  return (
    <div className="space-y-6">
      {/* Pitch Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Facet Properties</CardTitle>
          <CardDescription>
            Select a facet and set its pitch and properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pitch Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium">Roof Pitch</label>
              <Badge variant="outline">
                {selectedPitch[0]}/12 (Factor: {getSlopeFactor(selectedPitch[0]).toFixed(3)})
              </Badge>
            </div>
            
            <div className="space-y-4">
              <Slider
                value={selectedPitch}
                onValueChange={setSelectedPitch}
                max={12}
                min={0}
                step={0.5}
                className="w-full"
              />
              
              <div className="grid grid-cols-5 gap-2">
                {pitchPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedPitch[0] === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPitch([preset.value])}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Story Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Building Stories</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((story) => (
                <Button
                  key={story}
                  variant={selectedStory === story ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStory(story)}
                >
                  {story} Story
                </Button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div>
            <label className="text-sm font-medium mb-3 block">Additional Properties</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="two-story"
                  checked={flags.twoStory}
                  onCheckedChange={(checked) => 
                    setFlags(prev => ({ ...prev, twoStory: !!checked }))
                  }
                />
                <label htmlFor="two-story" className="text-sm">
                  Two-story building
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="low-slope"
                  checked={flags.lowSlope}
                  onCheckedChange={(checked) => 
                    setFlags(prev => ({ ...prev, lowSlope: !!checked }))
                  }
                />
                <label htmlFor="low-slope" className="text-sm">
                  Low-slope roof (special membrane required)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tear-off"
                  checked={flags.tearOff}
                  onCheckedChange={(checked) => 
                    setFlags(prev => ({ ...prev, tearOff: !!checked }))
                  }
                />
                <label htmlFor="tear-off" className="text-sm">
                  Existing roof tear-off required
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facets List */}
      {facets && facets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Roof Facets</CardTitle>
            <CardDescription>
              Click on a facet to select and modify its properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facets.map((facet, index) => (
                <div
                  key={facet.id}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Facet {index + 1}</div>
                      <div className="text-sm text-muted-foreground">
                        Pitch: {facet.pitch}/12 • Story: {facet.story}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Factor: {getSlopeFactor(Number(facet.pitch)).toFixed(3)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  {facet.flags && Object.keys(facet.flags).length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {Object.entries(facet.flags).map(([key, value]) => 
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Badge>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}