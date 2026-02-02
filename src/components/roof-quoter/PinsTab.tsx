import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PIN_CATEGORIES } from '@/types/roof-quoter';
import { Plus, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PinsTabProps {
  projectId: string;
}

export function PinsTab({ projectId }: PinsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pins } = useQuery({
    queryKey: ['pins', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const addPinMutation = useMutation({
    mutationFn: async (pinData: any) => {
      const { error } = await supabase
        .from('pins')
        .insert({
          project_id: projectId,
          type: pinData.type,
          subtype: pinData.subtype,
          size: pinData.size,
          qty: pinData.qty,
          position_point_geojson: {
            type: 'Point',
            coordinates: [400, 300] // Mock position
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pins', projectId] });
      queryClient.invalidateQueries({ queryKey: ['quantities', projectId] });
      toast({
        title: "Pin Added",
        description: "Item has been added to the roof plan.",
      });
      // Reset form
      setSelectedType('');
      setSize('');
      setQty(1);
    }
  });

  const handleAddPin = () => {
    if (!selectedType) {
      toast({
        title: "Missing Information",
        description: "Please select a pin type.",
        variant: "destructive"
      });
      return;
    }

    addPinMutation.mutate({
      type: selectedType,
      subtype: selectedType,
      size: size || undefined,
      qty: qty
    });
  };

  const getAvailableTypes = () => {
    if (!selectedCategory) return [];
    const category = PIN_CATEGORIES.find(cat => cat.name === selectedCategory);
    return category?.types || [];
  };

  return (
    <div className="space-y-6">
      {/* Pin Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Roof Items</CardTitle>
          <CardDescription>
            Drop pins for skylights, vents, equipment, and other roof penetrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PIN_CATEGORIES.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={selectedType} 
                onValueChange={setSelectedType}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size (optional)</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder='e.g., 14", 3040, etc.'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddPin}
            disabled={!selectedType || addPinMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Roof Plan
          </Button>
        </CardContent>
      </Card>

      {/* Pin Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIN_CATEGORIES.map((category) => (
          <Card 
            key={category.name}
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              selectedCategory === category.name ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedCategory(category.name)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {category.types.slice(0, 3).map((type) => (
                  <div key={type} className="text-xs text-muted-foreground">
                    • {type}
                  </div>
                ))}
                {category.types.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    + {category.types.length - 3} more
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placed Pins */}
      {pins && pins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Placed Items</CardTitle>
            <CardDescription>
              Items that have been added to the roof plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pins.map((pin) => (
                <div key={pin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{pin.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {pin.size && `Size: ${pin.size} • `}
                        Qty: {pin.qty}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {new Date(pin.created_at).toLocaleDateString()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Roof Plan</CardTitle>
          <CardDescription>
            Click on the roof to place selected items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Interactive roof plan coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}