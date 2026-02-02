import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TemplateSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onTemplateSelected: (templateName: string, materials: any[]) => void;
}

const templateCategories = [
  {
    id: 'steep-slope',
    title: 'Steep Slope Roofing (3:12 pitch and above)',
    subcategories: [
      {
        name: 'Asphalt/Composition Shingle Replacements',
        templates: [
          'Comp to Comp (3-Tab to 3-Tab)',
          'Comp to Comp HDZ',
          'Comp to Comp Premium',
          'Comp to Standing Seam Metal',
          'Comp to R-Panel Metal',
          'Comp to Stone-Coated Steel',
          'Comp to Synthetic Slate/Shake'
        ]
      },
      {
        name: 'Tile Replacements',
        templates: [
          'Tile to Tile (Re-deck)',
          'Tile w/Deck to Comp HDZ',
          'Tile to Standing Seam Metal',
          'Tile to Synthetic Tile'
        ]
      },
      {
        name: 'Wood/Cedar Replacements',
        templates: [
          'Cedar Shake to Cedar Shake',
          'Cedar to Comp HDZ',
          'Cedar to Standing Seam Metal',
          'Cedar to Synthetic Shake'
        ]
      },
      {
        name: 'Metal Replacements',
        templates: [
          'Metal to Metal (Re-sheet)',
          'Corrugated to Standing Seam'
        ]
      },
      {
        name: 'Premium Material Replacements',
        templates: [
          'Slate to Slate',
          'Slate to Synthetic Slate'
        ]
      }
    ]
  },
  {
    id: 'low-slope',
    title: 'Low Slope Roofing (under 3:12 pitch)',
    subcategories: [
      {
        name: 'Flat/Low Slope Replacements',
        templates: [
          'Torch Down to Torch Down',
          'Torch Down to TPO',
          'Torch Down to EPDM',
          'Torch Down to PVC',
          'Built-Up (Tar & Gravel) to TPO',
          'Built-Up to Modified Bitumen',
          'TPO to TPO (Re-membrane)',
          'EPDM to TPO'
        ]
      }
    ]
  },
  {
    id: 'specialty',
    title: 'Specialty Scenarios',
    subcategories: [
      {
        name: 'Special Cases',
        templates: [
          'Mixed Material Replacement',
          'Overlay/Re-roof',
          'Tear-off + Re-deck + New Material'
        ]
      }
    ]
  }
];

export function TemplateSelectionDialog({ 
  open, 
  onClose, 
  quoteId, 
  onTemplateSelected 
}: TemplateSelectionDialogProps) {
  const [templateConfigs, setTemplateConfigs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [allMaterials, setAllMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadTemplateConfigs();
      loadAllMaterials();
    }
  }, [open, quoteId]);

  const loadTemplateConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_requests')
        .select('template_configurations')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      if (data?.template_configurations) {
        setTemplateConfigs(data.template_configurations as Record<string, any[]>);
      }
    } catch (error) {
      console.error('Error loading template configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('rf_items, shingles_items, services_items')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      
      const materials = [
        ...(Array.isArray(data?.rf_items) ? data.rf_items : []),
        ...(Array.isArray(data?.shingles_items) ? data.shingles_items : []),
        ...(Array.isArray(data?.services_items) ? data.services_items : [])
      ];
      
      setAllMaterials(materials);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const getVariableMaterials = (templateName: string) => {
    if (!templateName.toLowerCase().includes('standing seam')) {
      return [];
    }
    
    const roofType = templateName.split(' ')[0];
    return [
      { 
        id: `var-remove-${Date.now()}-1`, 
        name: `Remove & Dispose ${roofType} Roof`, 
        category: 'Demolition',
        unit: 'SQ', 
        quantity: 1,
        cost: 0,
        markup: 0,
        total: 0
      },
      { 
        id: `var-deck-${Date.now()}-2`, 
        name: 'Roof Deck Type', 
        category: 'Structure',
        unit: 'SQ', 
        quantity: 1,
        cost: 0,
        markup: 0,
        total: 0
      },
      { 
        id: `var-insulation-${Date.now()}-3`, 
        name: 'Insulation Thickness', 
        category: 'Insulation',
        unit: 'SQ', 
        quantity: 1,
        cost: 0,
        markup: 0,
        total: 0
      },
      { 
        id: `var-underlayment-${Date.now()}-4`, 
        name: 'Underlayment Type', 
        category: 'Underlayment',
        unit: 'SQ', 
        quantity: 1,
        cost: 0,
        markup: 0,
        total: 0
      },
      { 
        id: `var-seam-${Date.now()}-5`, 
        name: 'Standing Seam Type', 
        category: 'Metal Roofing',
        unit: 'SQ', 
        quantity: 1,
        cost: 0,
        markup: 0,
        total: 0
      }
    ];
  };

  const handleSelectTemplate = (templateName: string) => {
    const configuredMaterials = templateConfigs[templateName] || [];
    const variableMaterials = getVariableMaterials(templateName);
    
    // Enrich materials with images from Materials tab
    const enrichedConfigured = configuredMaterials.map((material: any) => {
      const matchedMaterial = allMaterials.find((m: any) => 
        m.id === material.id || m.name === material.name
      );
      
      if (matchedMaterial) {
        return {
          ...material,
          picture: matchedMaterial.picture || material.picture,
          image_url: matchedMaterial.image_url || material.image_url
        };
      }
      return material;
    });
    
    const allTemplateMaterials = [...variableMaterials, ...enrichedConfigured];
    
    if (allTemplateMaterials.length === 0) {
      // Template not configured yet, show message
      return;
    }
    onTemplateSelected(templateName, allTemplateMaterials);
    onClose();
  };

  const getTemplateItemCount = (templateName: string) => {
    const configuredItems = templateConfigs[templateName] || [];
    const variableItems = getVariableMaterials(templateName);
    return configuredItems.length + variableItems.length;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a template to load its materials into the estimator
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {templateCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-base font-semibold">
                  {category.title}
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full pl-4">
                    {category.subcategories.map((subcategory, subIdx) => (
                      <AccordionItem key={subIdx} value={`${category.id}-${subIdx}`}>
                        <AccordionTrigger className="text-sm font-medium">
                          {subcategory.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-4">
                            {subcategory.templates.map((template, templateIdx) => {
                              const itemCount = getTemplateItemCount(template);
                              const hasItems = itemCount > 0;
                              
                              return (
                                <Card 
                                  key={templateIdx}
                                  className={`border transition-colors ${
                                    hasItems 
                                      ? 'hover:border-primary cursor-pointer' 
                                      : 'opacity-60 cursor-not-allowed'
                                  }`}
                                  onClick={() => hasItems && handleSelectTemplate(template)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm font-medium">{template}</span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {hasItems 
                                            ? `${itemCount} material${itemCount !== 1 ? 's' : ''} configured`
                                            : 'Not configured yet'
                                          }
                                        </p>
                                      </div>
                                      {hasItems && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectTemplate(template);
                                          }}
                                        >
                                          Use Template
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}
