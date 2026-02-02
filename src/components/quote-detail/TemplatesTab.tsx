import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TemplateConfigDialog } from './TemplateConfigDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ItemImage } from './ItemImage';

// Import material images
import removeShingles from '@/assets/services/remove-shingles.jpg';
import roofDecking from '@/assets/materials/roof-decking.jpg';
import underlayment from '@/assets/materials/underlayment.jpg';
import iceWaterShield from '@/assets/materials/ice-water-shield.jpg';
import valleyFlashing from '@/assets/materials/valley-flashing.jpg';
import fasteners from '@/assets/materials/fasteners.jpg';
import eaveEdge from '@/assets/materials/eave-edge.jpg';
import rakeEdge from '@/assets/materials/rake-edge.jpg';
import starterShingles from '@/assets/materials/starter-shingles.jpg';
import hipRidgeCap from '@/assets/materials/hip-ridge-cap.jpg';
import stepFlashing from '@/assets/materials/step-flashing.jpg';
import miscellaneous from '@/assets/materials/miscellaneous.jpg';
import standingSeam from '@/assets/shingles/standing-seam.jpg';
import timberline from '@/assets/shingles/timberline.jpg';
import oakridge from '@/assets/shingles/oakridge.jpg';
import landmark from '@/assets/shingles/landmark.jpg';

interface TemplatesTabProps {
  quoteId: string;
}

// Helper to get image for materials based on category or name
const getMaterialImage = (item: any): string | undefined => {
  const name = item.name?.toLowerCase() || '';
  const category = item.category?.toLowerCase() || '';
  
  // Pattern matching for names - check if name contains certain keywords
  if (name.includes('standing seam')) return standingSeam;
  if (name.includes('timberline') || name.includes('gaf') && name.includes('shingle')) return timberline;
  if (name.includes('oakridge') || name.includes('owens corning')) return oakridge;
  if (name.includes('landmark') || name.includes('certainteed')) return landmark;
  if (name.includes('presidential')) return landmark;
  if (name.includes('underlayment') || name.includes('tiger paw') || name.includes('feltbuster')) return underlayment;
  if (name.includes('ice') || name.includes('water shield') || name.includes('stormguard') || name.includes('leak barrier')) return iceWaterShield;
  if (name.includes('eave edge') || name.includes('eave drip')) return eaveEdge;
  if (name.includes('rake') && name.includes('edge')) return rakeEdge;
  if (name.includes('starter') && (name.includes('shingle') || name.includes('strip'))) return starterShingles;
  if (name.includes('hip') && name.includes('ridge')) return hipRidgeCap;
  if (name.includes('ridge cap') || name.includes('mountain ridge')) return hipRidgeCap;
  if (name.includes('step flashing')) return stepFlashing;
  if (name.includes('valley')) return valleyFlashing;
  if (name.includes('nail') || name.includes('fastener')) return fasteners;
  if (name.includes('remove') && (name.includes('shingle') || name.includes('dispose'))) return removeShingles;
  if (name.includes('clean up') || name.includes('disposal')) return miscellaneous;
  if (name.includes('decking') || name.includes('deck')) return roofDecking;
  
  // Pattern matching for categories
  if (category.includes('remove') && category.includes('dispose')) return removeShingles;
  if (category.includes('underlayment')) return underlayment;
  if (category.includes('ice') || category.includes('water shield')) return iceWaterShield;
  if (category.includes('eave edge')) return eaveEdge;
  if (category.includes('rake edge')) return rakeEdge;
  if (category.includes('starter')) return starterShingles;
  if (category.includes('hip') && category.includes('ridge')) return hipRidgeCap;
  if (category.includes('step flashing')) return stepFlashing;
  if (category.includes('valley')) return valleyFlashing;
  if (category.includes('fastener') || category.includes('nail')) return fasteners;
  if (category.includes('disposal') || category.includes('clean')) return miscellaneous;
  if (category.includes('standing seam')) return standingSeam;
  if (category.includes('architectural')) return timberline;
  if (category.includes('decking')) return roofDecking;
  
  // If there's a picture or image_url field, use it
  return item.image_url || item.picture;
};

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

export function TemplatesTab({ quoteId }: TemplatesTabProps) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [expandedTemplate, setExpandedTemplate] = useState<string>('');
  const [templateConfigs, setTemplateConfigs] = useState<Record<string, any[]>>({});
  const [aiConfigLoading, setAiConfigLoading] = useState<string>('');
  const [allMaterials, setAllMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadTemplateConfigs();
    loadAllMaterials();
  }, [quoteId]);

  const loadTemplateConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('template_configurations')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      if (data?.template_configurations) {
        console.log('✅ Loaded template configurations:', data.template_configurations);
        setTemplateConfigs(data.template_configurations as Record<string, any[]>);
        toast.success(`Loaded ${Object.keys(data.template_configurations).length} configured templates`);
      } else {
        console.log('ℹ️ No template configurations found in database');
      }
    } catch (error) {
      console.error('❌ Error loading template configs:', error);
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

  const handleConfigureTemplate = (templateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTemplate(templateName);
    setConfigDialogOpen(true);
  };

  const toggleTemplateView = (templateName: string) => {
    setExpandedTemplate(expandedTemplate === templateName ? '' : templateName);
  };

  const handleSaveConfig = (templateName: string, materials: any[]) => {
    setTemplateConfigs(prev => ({
      ...prev,
      [templateName]: materials
    }));
  };

  const handleAIConfiguration = async (templateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setAiConfigLoading(templateName);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-materials-expert', {
        body: {
          quoteId,
          templateName,
          useTemplateMatching: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success && data?.materials) {
        // Save the AI-configured materials to the template
        const updatedConfigs = {
          ...templateConfigs,
          [templateName]: data.materials
        };
        
        setTemplateConfigs(updatedConfigs);

        // Save to database
        const { error: updateError } = await supabase
          .from('quote_requests')
          .update({ template_configurations: updatedConfigs })
          .eq('id', quoteId);

        if (updateError) throw updateError;

        toast.success(`AI configured ${data.materials.length} materials for ${templateName}`);
        
        // Expand the template to show the configured materials
        setExpandedTemplate(templateName);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to get AI recommendations');
      }
    } catch (error: any) {
      console.error('Error getting AI configuration:', error);
      
      // Show user-friendly error messages
      const errorMessage = error?.message || error?.error || 'Failed to configure template with AI';
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (errorMessage.includes('credits exhausted')) {
        toast.error('AI credits exhausted. Please add credits to your workspace.');
      } else if (errorMessage.includes('temporarily unavailable')) {
        toast.error('AI service is temporarily busy. Please try again in a few seconds.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAiConfigLoading('');
    }
  };

  const getTemplateItems = (templateName: string) => {
    const configuredItems = templateConfigs[templateName] || [];
    
    // Add variable materials for standing seam templates
    if (templateName.toLowerCase().includes('standing seam')) {
      const roofType = templateName.split(' ')[0]; // Extract "Comp", "Tile", "Cedar", etc.
      const variableItems = [
        { id: 'var-remove', name: `Remove & Dispose ${roofType} Roof`, category: 'Variables', unit: 'SQ', total: 0 },
        { id: 'var-deck', name: 'Roof Deck Type', category: 'Variables', unit: 'SQ', total: 0 },
        { id: 'var-insulation', name: 'Insulation Thickness', category: 'Variables', unit: 'SQ', total: 0 },
        { id: 'var-underlayment', name: 'Underlayment Type', category: 'Variables', unit: 'SQ', total: 0 },
        { id: 'var-seam', name: 'Standing Seam Type', category: 'Variables', unit: 'SQ', total: 0 }
      ];
      
      return [...variableItems, ...configuredItems];
    }
    
    return configuredItems;
  };

  return (
    <div className="space-y-6">
      <TemplateConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        templateName={selectedTemplate}
        quoteId={quoteId}
        onSave={handleSaveConfig}
        existingMaterials={templateConfigs[selectedTemplate]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Roofing Templates</CardTitle>
          <CardDescription>
            Select template categories to view available roof replacement options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {templateCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-lg font-semibold">
                  {category.title}
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full pl-4">
                    {category.subcategories.map((subcategory, subIdx) => (
                      <AccordionItem key={subIdx} value={`${category.id}-${subIdx}`}>
                        <AccordionTrigger className="text-base font-medium">
                          {subcategory.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-4">
                            {subcategory.templates.map((template, templateIdx) => (
                              <Card 
                                key={templateIdx}
                                className="border hover:border-primary transition-colors cursor-pointer"
                                onClick={() => toggleTemplateView(template)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{template}</span>
                                      {templateConfigs[template] && templateConfigs[template].length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                          <Check className="w-3 h-3 mr-1" />
                                          {templateConfigs[template].length} items
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={(e) => handleConfigureTemplate(template, e)}
                                      >
                                        Configure
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        onClick={(e) => handleAIConfiguration(template, e)}
                                        disabled={aiConfigLoading === template}
                                      >
                                        {aiConfigLoading === template ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Configuring...
                                          </>
                                        ) : (
                                          'Configure with AI'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {expandedTemplate === template && (
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                                        Template Items:
                                      </p>
                                        {getTemplateItems(template).length > 0 ? (
                                        getTemplateItems(template).map((item, idx) => {
                                          // Find matching material from Materials tab
                                          const matchedMaterial = allMaterials.find(m => 
                                            m.id === item.id || m.name === item.name
                                          );
                                          
                                          // Use matched material if found, otherwise use item
                                          const materialToDisplay = matchedMaterial || item;
                                          const imageUrl = getMaterialImage(materialToDisplay);
                                          
                                          return (
                                            <div key={idx} className="flex items-center gap-3 text-xs py-1">
                                              <div className="w-12 h-12 flex-shrink-0 rounded border overflow-hidden bg-muted">
                                                <ItemImage 
                                                  src={imageUrl}
                                                  alt={item.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                              <div className="flex-1 flex justify-between items-center min-w-0">
                                                <span className="font-medium truncate">{item.name}</span>
                                                <span className="text-muted-foreground ml-2 flex-shrink-0">
                                                  {item.total} {item.unit}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })
                                       ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                          No materials configured yet. Click Configure to add materials.
                                        </p>
                                       )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
