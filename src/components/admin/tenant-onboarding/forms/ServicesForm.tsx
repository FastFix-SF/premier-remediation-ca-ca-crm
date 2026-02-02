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
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Wrench } from 'lucide-react';

// Single service schema
export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Service name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image_url: z.string().optional(),
  price_range: z.string().optional(),
  display_order: z.number().default(0),
  is_featured: z.boolean().default(false),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// Form for managing multiple services
export const servicesListSchema = z.object({
  services: z.array(serviceSchema).min(1, 'At least one service is required'),
});

export type ServicesListFormData = z.infer<typeof servicesListSchema>;

interface ServicesFormProps {
  defaultValues?: Partial<ServicesListFormData>;
  onSubmit: (data: ServicesListFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
}

// Pre-defined roofing services for quick add
const PRESET_SERVICES: Partial<ServiceFormData>[] = [
  { name: 'Residential Roofing', description: 'Complete roofing solutions for homes', icon: 'home' },
  { name: 'Commercial Roofing', description: 'Professional roofing for businesses', icon: 'building' },
  { name: 'Roof Repair', description: 'Expert repair services for all roof types', icon: 'wrench' },
  { name: 'Metal Roofing', description: 'Durable metal roof installation', icon: 'shield' },
  { name: 'Roof Inspection', description: 'Comprehensive roof assessments', icon: 'search' },
  { name: 'Emergency Services', description: '24/7 emergency roof repairs', icon: 'alert-triangle' },
  { name: 'Gutter Installation', description: 'Professional gutter systems', icon: 'droplet' },
  { name: 'Skylights', description: 'Skylight installation and repair', icon: 'sun' },
];

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

interface ServiceItemProps {
  service: ServiceFormData;
  index: number;
  onUpdate: (index: number, service: ServiceFormData) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

        <div className="flex-1">
          <Input
            value={service.name}
            onChange={(e) => {
              const newName = e.target.value;
              onUpdate(index, {
                ...service,
                name: newName,
                slug: service.slug || generateSlug(newName),
              });
            }}
            placeholder="Service name"
            className="font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={service.is_featured}
              onCheckedChange={(checked) => onUpdate(index, { ...service, is_featured: checked })}
            />
            Featured
          </label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={service.slug || ''}
                onChange={(e) => onUpdate(index, { ...service, slug: e.target.value })}
                placeholder="service-slug"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price Range</label>
              <Input
                value={service.price_range || ''}
                onChange={(e) => onUpdate(index, { ...service, price_range: e.target.value })}
                placeholder="$500 - $5,000"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={service.description || ''}
              onChange={(e) => onUpdate(index, { ...service, description: e.target.value })}
              placeholder="Describe this service..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Icon</label>
              <Input
                value={service.icon || ''}
                onChange={(e) => onUpdate(index, { ...service, icon: e.target.value })}
                placeholder="home, building, wrench..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={service.image_url || ''}
                onChange={(e) => onUpdate(index, { ...service, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ServicesForm: React.FC<ServicesFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
}) => {
  const [services, setServices] = useState<ServiceFormData[]>(
    defaultValues?.services || [{ name: '', display_order: 0, is_featured: false }]
  );
  const [showPresets, setShowPresets] = useState(false);

  const form = useForm<ServicesListFormData>({
    resolver: zodResolver(servicesListSchema),
    defaultValues: { services },
  });

  const addService = (preset?: Partial<ServiceFormData>) => {
    const newService: ServiceFormData = {
      name: preset?.name || '',
      slug: preset?.name ? generateSlug(preset.name) : '',
      description: preset?.description || '',
      icon: preset?.icon || '',
      image_url: '',
      price_range: '',
      display_order: services.length,
      is_featured: false,
    };
    const updatedServices = [...services, newService];
    setServices(updatedServices);
    form.setValue('services', updatedServices);
  };

  const updateService = (index: number, service: ServiceFormData) => {
    const updatedServices = [...services];
    updatedServices[index] = service;
    setServices(updatedServices);
    form.setValue('services', updatedServices);
  };

  const removeService = (index: number) => {
    if (services.length <= 1) return;
    const updatedServices = services.filter((_, i) => i !== index);
    // Update display_order
    updatedServices.forEach((s, i) => {
      s.display_order = i;
    });
    setServices(updatedServices);
    form.setValue('services', updatedServices);
  };

  const moveService = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= services.length) return;

    const updatedServices = [...services];
    [updatedServices[index], updatedServices[newIndex]] = [updatedServices[newIndex], updatedServices[index]];
    // Update display_order
    updatedServices.forEach((s, i) => {
      s.display_order = i;
    });
    setServices(updatedServices);
    form.setValue('services', updatedServices);
  };

  const handleSubmit = () => {
    onSubmit({ services });
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Wrench className="h-5 w-5" />
              <span>Services ({services.length})</span>
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
                onClick={() => addService()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>
          </div>

          {showPresets && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Click to add preset services:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SERVICES.map((preset, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addService(preset);
                      setShowPresets(false);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {services.map((service, index) => (
              <ServiceItem
                key={index}
                service={service}
                index={index}
                onUpdate={updateService}
                onRemove={removeService}
                onMoveUp={() => moveService(index, 'up')}
                onMoveDown={() => moveService(index, 'down')}
                isFirst={index === 0}
                isLast={index === services.length - 1}
              />
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No services added yet. Click "Add Service" or use "Quick Add" to get started.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading || services.length === 0}>
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
        <CardTitle>Services</CardTitle>
        <CardDescription>
          Add the services your business offers. At least one service is required.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
