import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Settings2, Zap, Crown, CheckCircle2 } from 'lucide-react';
import { multiTenantSupabase } from '@/integrations/supabase/tenant-client';

export interface EdgeFunction {
  function_slug: string;
  name: string;
  description?: string;
  category: string;
  is_core: boolean;
  is_premium: boolean;
  is_enabled: boolean;
}

export interface FeatureFlagsFormData {
  features: Record<string, boolean>;
}

interface FeatureFlagsFormProps {
  tenantId?: string;
  defaultValues?: Record<string, boolean>;
  onSubmit: (data: FeatureFlagsFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
}

// Category display names and icons
const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  core: { label: 'Core Functions', description: 'Essential CRM features (always enabled)' },
  ai: { label: 'AI & Chat', description: 'AI-powered assistants and chat features' },
  roof_analysis: { label: 'Roof Analysis', description: 'AI roof measurement and analysis tools' },
  imagery: { label: 'Aerial Imagery', description: 'Satellite and aerial image integration' },
  crm: { label: 'CRM Extended', description: 'Advanced CRM features' },
  communications: { label: 'Communications', description: 'SMS, push notifications, and messaging' },
  integrations: { label: 'Integrations', description: 'Third-party integrations (Connecteam, CompanyCam)' },
  documents: { label: 'Documents', description: 'PDF generation and document processing' },
  utilities: { label: 'Utilities', description: 'Helper functions and analytics' },
  other: { label: 'Other', description: 'Miscellaneous features' },
};

const CategorySection: React.FC<{
  category: string;
  functions: EdgeFunction[];
  features: Record<string, boolean>;
  onToggle: (slug: string, enabled: boolean) => void;
  onBulkToggle: (category: string, enabled: boolean) => void;
}> = ({ category, functions, features, onToggle, onBulkToggle }) => {
  const info = CATEGORY_INFO[category] || { label: category, description: '' };
  const enabledCount = functions.filter((f) => features[f.function_slug]).length;
  const isCore = category === 'core';

  return (
    <AccordionItem value={category}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <span className="font-medium">{info.label}</span>
            <Badge variant={isCore ? 'default' : 'outline'}>
              {enabledCount}/{functions.length}
            </Badge>
          </div>
          {!isCore && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onBulkToggle(category, true)}
              >
                Enable All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onBulkToggle(category, false)}
              >
                Disable All
              </Button>
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-sm text-muted-foreground mb-4">{info.description}</p>
        <div className="space-y-2">
          {functions.map((func) => (
            <div
              key={func.function_slug}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={features[func.function_slug] ?? false}
                  onCheckedChange={(checked) => onToggle(func.function_slug, checked)}
                  disabled={func.is_core}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{func.name}</span>
                    {func.is_core && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Core
                      </Badge>
                    )}
                    {func.is_premium && (
                      <Badge variant="default" className="text-xs bg-amber-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  {func.description && (
                    <p className="text-sm text-muted-foreground">{func.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export const FeatureFlagsForm: React.FC<FeatureFlagsFormProps> = ({
  tenantId,
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
}) => {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean>>(defaultValues || {});
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Load function catalog
  useEffect(() => {
    const loadCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const { data, error } = await multiTenantSupabase
          .from('edge_function_catalog')
          .select('*')
          .order('category')
          .order('name');

        if (error) throw error;

        const catalogFunctions: EdgeFunction[] = (data || []).map((f: any) => ({
          function_slug: f.function_slug,
          name: f.name,
          description: f.description,
          category: f.category,
          is_core: f.is_core,
          is_premium: f.is_premium,
          is_enabled: f.is_core, // Core functions enabled by default
        }));

        setFunctions(catalogFunctions);

        // Set default features (core enabled, others disabled)
        if (!defaultValues) {
          const defaultFeatures: Record<string, boolean> = {};
          catalogFunctions.forEach((f) => {
            defaultFeatures[f.function_slug] = f.is_core;
          });
          setFeatures(defaultFeatures);
        }
      } catch (error) {
        console.error('Error loading function catalog:', error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, [defaultValues]);

  // Load tenant-specific features if tenantId provided
  useEffect(() => {
    const loadTenantFeatures = async () => {
      if (!tenantId) return;

      try {
        const { data, error } = await multiTenantSupabase
          .from('tenant_edge_functions')
          .select('function_slug, is_enabled')
          .eq('tenant_id', tenantId);

        if (error) throw error;

        const tenantFeatures: Record<string, boolean> = {};
        (data || []).forEach((f: any) => {
          tenantFeatures[f.function_slug] = f.is_enabled;
        });
        setFeatures((prev) => ({ ...prev, ...tenantFeatures }));
      } catch (error) {
        console.error('Error loading tenant features:', error);
      }
    };

    loadTenantFeatures();
  }, [tenantId]);

  const handleToggle = (slug: string, enabled: boolean) => {
    setFeatures((prev) => ({ ...prev, [slug]: enabled }));
  };

  const handleBulkToggle = (category: string, enabled: boolean) => {
    const categoryFunctions = functions.filter((f) => f.category === category && !f.is_core);
    const updates: Record<string, boolean> = {};
    categoryFunctions.forEach((f) => {
      updates[f.function_slug] = enabled;
    });
    setFeatures((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ features });
  };

  // Group functions by category
  const functionsByCategory = functions.reduce<Record<string, EdgeFunction[]>>((acc, func) => {
    if (!acc[func.category]) acc[func.category] = [];
    acc[func.category].push(func);
    return acc;
  }, {});

  // Order categories
  const categoryOrder = ['core', 'ai', 'roof_analysis', 'imagery', 'crm', 'communications', 'integrations', 'documents', 'utilities', 'other'];
  const orderedCategories = categoryOrder.filter((cat) => functionsByCategory[cat]);

  const enabledCount = Object.values(features).filter(Boolean).length;
  const totalCount = functions.length;

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Settings2 className="h-5 w-5" />
          <span>Feature Flags</span>
        </div>
        <Badge variant="outline">
          {enabledCount}/{totalCount} enabled
        </Badge>
      </div>

      {loadingCatalog ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading function catalog...
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={['core']} className="space-y-2">
          {orderedCategories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              functions={functionsByCategory[category]}
              features={features}
              onToggle={handleToggle}
              onBulkToggle={handleBulkToggle}
            />
          ))}
        </Accordion>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading || loadingCatalog}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Enable or disable Edge Functions for this tenant. Core functions are always enabled.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
