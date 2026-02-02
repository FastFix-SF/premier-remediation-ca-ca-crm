import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Single service area schema
export const serviceAreaSchema = z.object({
  id: z.string().optional(),
  city: z.string().min(2, 'City name is required'),
  state: z.string().min(2, 'State is required'),
  neighborhoods: z.array(z.string()).default([]),
  description: z.string().optional(),
  testimonial: z.string().optional(),
  display_order: z.number().default(0),
});

export type ServiceAreaFormData = z.infer<typeof serviceAreaSchema>;

// Form for managing multiple service areas
export const serviceAreasListSchema = z.object({
  areas: z.array(serviceAreaSchema).min(1, 'At least one service area is required'),
});

export type ServiceAreasListFormData = z.infer<typeof serviceAreasListSchema>;

interface ServiceAreasFormProps {
  defaultValues?: Partial<ServiceAreasListFormData>;
  onSubmit: (data: ServiceAreasListFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
  onGenerateContent?: (area: ServiceAreaFormData) => Promise<{ description?: string; testimonial?: string }>;
}

// Common California cities for quick add
const CALIFORNIA_CITIES = [
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'San Diego', state: 'CA' },
  { city: 'San Jose', state: 'CA' },
  { city: 'Oakland', state: 'CA' },
  { city: 'Sacramento', state: 'CA' },
  { city: 'Fresno', state: 'CA' },
  { city: 'Long Beach', state: 'CA' },
];

interface ServiceAreaItemProps {
  area: ServiceAreaFormData;
  index: number;
  onUpdate: (index: number, area: ServiceAreaFormData) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  onGenerateContent?: (area: ServiceAreaFormData) => Promise<{ description?: string; testimonial?: string }>;
}

const ServiceAreaItem: React.FC<ServiceAreaItemProps> = ({
  area,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onGenerateContent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const { toast } = useToast();

  const handleAddNeighborhood = () => {
    if (!newNeighborhood.trim()) return;
    const updatedNeighborhoods = [...(area.neighborhoods || []), newNeighborhood.trim()];
    onUpdate(index, { ...area, neighborhoods: updatedNeighborhoods });
    setNewNeighborhood('');
  };

  const handleRemoveNeighborhood = (neighborhoodIndex: number) => {
    const updatedNeighborhoods = area.neighborhoods?.filter((_, i) => i !== neighborhoodIndex) || [];
    onUpdate(index, { ...area, neighborhoods: updatedNeighborhoods });
  };

  const handleGenerateContent = async () => {
    if (!onGenerateContent) return;
    if (!area.city || !area.state) {
      toast({
        title: 'Missing information',
        description: 'Please enter city and state first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await onGenerateContent(area);
      onUpdate(index, {
        ...area,
        description: generated.description || area.description,
        testimonial: generated.testimonial || area.testimonial,
      });
      toast({
        title: 'Content generated',
        description: 'AI-generated content has been added.',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1 hover:bg-muted rounded disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1 hover:bg-muted rounded disabled:opacity-30"
          >
            ▼
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <Input
            value={area.city}
            onChange={(e) => onUpdate(index, { ...area, city: e.target.value })}
            placeholder="City"
          />
          <Input
            value={area.state}
            onChange={(e) => onUpdate(index, { ...area, state: e.target.value })}
            placeholder="State"
            className="w-24"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Less' : 'More'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {isExpanded && (
        <div className="pl-10 space-y-4">
          {/* Neighborhoods */}
          <div>
            <label className="text-sm font-medium">Neighborhoods</label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {(area.neighborhoods || []).map((neighborhood, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {neighborhood}
                  <button
                    type="button"
                    onClick={() => handleRemoveNeighborhood(i)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newNeighborhood}
                onChange={(e) => setNewNeighborhood(e.target.value)}
                placeholder="Add neighborhood"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNeighborhood();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddNeighborhood}>
                Add
              </Button>
            </div>
          </div>

          {/* AI Generate Button */}
          {onGenerateContent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateContent}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Content with AI'}
            </Button>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Local Description</label>
            <Textarea
              value={area.description || ''}
              onChange={(e) => onUpdate(index, { ...area, description: e.target.value })}
              placeholder="Describe your services in this area..."
              className="min-h-[80px]"
            />
          </div>

          {/* Testimonial */}
          <div>
            <label className="text-sm font-medium">Local Testimonial</label>
            <Textarea
              value={area.testimonial || ''}
              onChange={(e) => onUpdate(index, { ...area, testimonial: e.target.value })}
              placeholder="Add a testimonial from a customer in this area..."
              className="min-h-[60px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const ServiceAreasForm: React.FC<ServiceAreasFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
  onGenerateContent,
}) => {
  const [areas, setAreas] = useState<ServiceAreaFormData[]>(
    defaultValues?.areas || [{ city: '', state: '', neighborhoods: [], display_order: 0 }]
  );
  const [showPresets, setShowPresets] = useState(false);

  const form = useForm<ServiceAreasListFormData>({
    resolver: zodResolver(serviceAreasListSchema),
    defaultValues: { areas },
  });

  const addArea = (preset?: { city: string; state: string }) => {
    const newArea: ServiceAreaFormData = {
      city: preset?.city || '',
      state: preset?.state || '',
      neighborhoods: [],
      description: '',
      testimonial: '',
      display_order: areas.length,
    };
    const updatedAreas = [...areas, newArea];
    setAreas(updatedAreas);
    form.setValue('areas', updatedAreas);
  };

  const updateArea = (index: number, area: ServiceAreaFormData) => {
    const updatedAreas = [...areas];
    updatedAreas[index] = area;
    setAreas(updatedAreas);
    form.setValue('areas', updatedAreas);
  };

  const removeArea = (index: number) => {
    if (areas.length <= 1) return;
    const updatedAreas = areas.filter((_, i) => i !== index);
    updatedAreas.forEach((a, i) => {
      a.display_order = i;
    });
    setAreas(updatedAreas);
    form.setValue('areas', updatedAreas);
  };

  const moveArea = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= areas.length) return;

    const updatedAreas = [...areas];
    [updatedAreas[index], updatedAreas[newIndex]] = [updatedAreas[newIndex], updatedAreas[index]];
    updatedAreas.forEach((a, i) => {
      a.display_order = i;
    });
    setAreas(updatedAreas);
    form.setValue('areas', updatedAreas);
  };

  const handleSubmit = () => {
    onSubmit({ areas });
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5" />
              <span>Service Areas ({areas.length})</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
              >
                Quick Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArea()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Area
              </Button>
            </div>
          </div>

          {showPresets && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Click to add California cities:</p>
              <div className="flex flex-wrap gap-2">
                {CALIFORNIA_CITIES.map((preset, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addArea(preset);
                      setShowPresets(false);
                    }}
                  >
                    {preset.city}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {areas.map((area, index) => (
              <ServiceAreaItem
                key={index}
                area={area}
                index={index}
                onUpdate={updateArea}
                onRemove={removeArea}
                onMoveUp={() => moveArea(index, 'up')}
                onMoveDown={() => moveArea(index, 'down')}
                isFirst={index === 0}
                isLast={index === areas.length - 1}
                onGenerateContent={onGenerateContent}
              />
            ))}
          </div>

          {areas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No service areas added yet. Click "Add Area" or use "Quick Add" to get started.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading || areas.length === 0}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Areas</CardTitle>
        <CardDescription>
          Add the cities and neighborhoods where you provide services. At least one area is required.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
