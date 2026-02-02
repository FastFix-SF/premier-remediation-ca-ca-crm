import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DollarSign, Package, Sparkles, Loader2, ChevronDown, ChevronUp, FileText, Image as ImageIcon, Plus, Trash2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIQuoteBuilder } from './AIQuoteBuilder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { TemplateSelectionDialog } from './TemplateSelectionDialog';
import { MaterialSelectionDialog } from './MaterialSelectionDialog';
import { MaterialDetailsDialog } from './MaterialDetailsDialog';

// Import placeholder image
import miscellaneous from '@/assets/materials/miscellaneous.jpg';

interface MaterialItem {
  id: string;
  pin_id?: string; // Track which pin this material corresponds to
  name: string;
  image_url: string;
  unit: 'sq' | 'lf' | 'ea' | 'roll';
  source_type: 'area' | 'perimeter' | 'eave' | 'rake' | 'ridge' | 'valley' | 'manual' | 'pin';
  quantity: number;
  unit_cost: number;
  markup_pct: number;
  total: number;
  category?: string;
  picture?: string;
  standingSeamType?: 'snap-lock' | 'mechanical-seam';
  orderDescription?: string;
  coverage?: number;
  labor?: number;
  material?: number;
  factor?: number;
  show_in_app?: boolean;
  show_on_estimate?: boolean;
  show_on_contract?: boolean;
  show_on_material_order?: boolean;
  show_on_labor_report?: boolean;
}

const getItemImage = (item: MaterialItem): string => {
  // If item has a picture field from Materials tab, use it
  if (item.picture) {
    return item.picture;
  }
  // If item has image_url, use it
  if (item.image_url) {
    return item.image_url;
  }
  // Fallback to miscellaneous image
  return miscellaneous;
};

interface EstimatorTabProps {
  quoteId: string;
  onPinMaterialsCallback?: (callback: (materials: MaterialItem[]) => void) => void;
}

// Empty materials - will be populated based on Plan Viewer + project type
const SAMPLE_MATERIALS: Omit<MaterialItem, 'id' | 'total'>[] = [];

export const EstimatorTab: React.FC<EstimatorTabProps> = ({ quoteId, onPinMaterialsCallback }) => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isAIBuilderOpen, setIsAIBuilderOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, [quoteId]);

  // Register callback for DrawTab to add PIN materials
  useEffect(() => {
    if (onPinMaterialsCallback) {
      onPinMaterialsCallback((newMaterials: MaterialItem[]) => {
        setMaterials(prev => [...prev, ...newMaterials]);
        toast.success(`Added ${newMaterials.length} materials from PIN to Estimator`);
      });
    }
  }, [onPinMaterialsCallback]);

  // Auto-save materials when they change
  useEffect(() => {
    if (materials.length === 0) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('quote_requests')
          .update({ material_items: materials as any })
          .eq('id', quoteId);
      } catch (error) {
        console.error('Error auto-saving materials:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [materials, quoteId]);

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('material_items, edges')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;

      if (data?.material_items && Array.isArray(data.material_items) && data.material_items.length > 0) {
        setMaterials(data.material_items as unknown as MaterialItem[]);
      } else {
        // Initialize with sample materials
        const initialMaterials = SAMPLE_MATERIALS.map((m, i) => ({
          ...m,
          id: `mat-${i}`,
          total: 0
        }));
        setMaterials(initialMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...updates };
      // Recalculate total
      const cost = updated.unit_cost * updated.quantity;
      updated.total = cost + (cost * updated.markup_pct / 100);
      return updated;
    }));
  };

  const handleStartFromTemplate = () => {
    setTemplateDialogOpen(true);
  };

  const handleAddMaterial = () => {
    setMaterialDialogOpen(true);
  };

  const handleMaterialSelected = (selectedMaterial: any) => {
    console.log('Selected material from Materials tab:', selectedMaterial);
    
    // Show debug info in a toast
    const debugInfo = `Labor: $${selectedMaterial.labor || 0}, Material: $${selectedMaterial.material || 0}, Coverage: ${selectedMaterial.coverage || 1}`;
    toast.info(debugInfo, { duration: 5000 });
    
    const newMaterial: MaterialItem = {
      id: `material-${Date.now()}`,
      name: selectedMaterial.name,
      image_url: selectedMaterial.image_url || '',
      picture: selectedMaterial.picture || selectedMaterial.image_url || miscellaneous,
      category: selectedMaterial.category,
      unit: selectedMaterial.unit || 'ea',
      source_type: 'manual',
      quantity: selectedMaterial.total || selectedMaterial.quantity || 0,
      unit_cost: (selectedMaterial.labor || 0) + (selectedMaterial.material || 0), // Sum of labor + material
      markup_pct: 15,
      total: 0,
      orderDescription: selectedMaterial.orderDescription || selectedMaterial.order_description || selectedMaterial.name,
      coverage: selectedMaterial.coverage || 1,
      labor: selectedMaterial.labor || 0,
      material: selectedMaterial.material || 0,
      factor: selectedMaterial.factor || 1,
      show_in_app: selectedMaterial.show_in_app ?? true,
      show_on_estimate: selectedMaterial.show_on_estimate ?? false,
      show_on_contract: selectedMaterial.show_on_contract ?? false,
      show_on_material_order: selectedMaterial.show_on_material_order ?? false,
      show_on_labor_report: selectedMaterial.show_on_labor_report ?? false,
    };

    console.log('Mapped material for estimator:', newMaterial);

    // Calculate total
    const cost = newMaterial.unit_cost * newMaterial.quantity;
    newMaterial.total = cost + (cost * newMaterial.markup_pct / 100);

    setMaterials(prev => [...prev, newMaterial]);
    setMaterialDialogOpen(false);
    toast.success(`Added "${selectedMaterial.name}" to estimator`);
  };

  const handleMaterialClick = (material: MaterialItem & { ids?: string[] }) => {
    // Pass the grouped material with all its IDs so the dialog knows to update all of them
    setSelectedMaterial(material);
    setDetailsDialogOpen(true);
  };

  const handleMaterialUpdate = (updatedMaterial: MaterialItem & { ids?: string[] }) => {
    // If this is a grouped material (has multiple IDs), we need to handle it specially
    if (updatedMaterial.ids && updatedMaterial.ids.length > 1) {
      // User edited the grouped total - consolidate all materials with this name into one
      const consolidatedMaterial: MaterialItem = {
        ...updatedMaterial,
        id: updatedMaterial.ids[0], // Use the first ID
      };
      
      // Remove all materials with the same name, then add the consolidated one
      setMaterials(prev => {
        const filtered = prev.filter(m => !updatedMaterial.ids?.includes(m.id));
        return [...filtered, consolidatedMaterial];
      });
    } else {
      // Single material - just update it
      const cost = updatedMaterial.unit_cost * updatedMaterial.quantity;
      const total = cost + (cost * updatedMaterial.markup_pct / 100);
      
      const finalUpdatedMaterial = {
        ...updatedMaterial,
        total
      };
      
      setMaterials(prev => prev.map(m => m.id === finalUpdatedMaterial.id ? finalUpdatedMaterial : m));
    }
    
    toast.success('Material updated');
  };

  const handleRemoveMaterial = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
    toast.success('Material removed');
  };

  const handleTemplateSelected = (templateName: string, templateMaterials: any[]) => {
    // Store the selected template name
    setSelectedTemplate(templateName);
    
    // Convert template materials to MaterialItem format
    const newMaterials: MaterialItem[] = templateMaterials.map((item, index) => ({
      id: `template-${Date.now()}-${index}`,
      name: item.name,
      image_url: item.image_url || '',
      picture: item.picture || item.image_url || '', // Preserve picture field from Materials tab
      category: item.category,
      unit: item.unit || 'ea',
      source_type: 'manual',
      quantity: item.total || item.quantity || 0,
      unit_cost: item.unit_cost || item.material || 0,
      markup_pct: item.markup_pct || 15,
      total: 0,
      orderDescription: item.orderDescription || item.order_description,
      coverage: item.coverage || 1,
      labor: item.labor || 0,
      material: item.material || 0,
      factor: item.factor || 1,
      show_in_app: item.show_in_app ?? true,
      show_on_estimate: item.show_on_estimate ?? false,
      show_on_contract: item.show_on_contract ?? false,
      show_on_material_order: item.show_on_material_order ?? false,
      show_on_labor_report: item.show_on_labor_report ?? false,
    }));

    // Calculate totals for each material
    const materialsWithTotals = newMaterials.map(m => {
      const cost = m.unit_cost * m.quantity;
      return {
        ...m,
        total: cost + (cost * m.markup_pct / 100)
      };
    });

    setMaterials(materialsWithTotals);
    toast.success(`Loaded ${templateMaterials.length} materials from "${templateName}"`);
  };

  const getMaterialRecommendations = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    try {
      setLoadingRecommendations(true);
      
      const { data, error } = await supabase.functions.invoke('ai-materials-expert', {
        body: { 
          quoteId,
          templateName: selectedTemplate,
          useTemplateMatching: true
        }
      });

      if (error) throw error;

      if (data.success) {
        // Add recommended materials directly to the list
        const recommendedMaterials: MaterialItem[] = data.recommendations.map((rec: any, index: number) => ({
          id: `ai-rec-${Date.now()}-${index}`,
          name: rec.name,
          image_url: rec.image_url || '',
          picture: rec.picture || rec.image_url || miscellaneous,
          category: rec.category,
          unit: rec.unit || 'ea',
          source_type: 'manual',
          quantity: rec.quantity || rec.total || 0,
          unit_cost: rec.unit_cost || rec.material || 0,
          markup_pct: rec.markup_pct || 15,
          total: 0,
          orderDescription: rec.orderDescription || rec.order_description,
          coverage: rec.coverage || 1,
          labor: rec.labor || 0,
          material: rec.material || 0,
          factor: rec.factor || 1,
          show_in_app: rec.show_in_app ?? true,
          show_on_estimate: rec.show_on_estimate ?? false,
          show_on_contract: rec.show_on_contract ?? false,
          show_on_material_order: rec.show_on_material_order ?? false,
          show_on_labor_report: rec.show_on_labor_report ?? false,
        }));

        // Calculate totals
        const materialsWithTotals = recommendedMaterials.map(m => {
          const cost = m.unit_cost * m.quantity;
          return {
            ...m,
            total: cost + (cost * m.markup_pct / 100)
          };
        });

        setMaterials(materialsWithTotals);
        toast.success(`AI matched ${materialsWithTotals.length} materials from your materials tab`);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Failed to get AI recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Group materials by name and sum quantities
  const groupedMaterials = materials.reduce((acc, material) => {
    const key = material.name;
    if (!acc[key]) {
      acc[key] = {
        ...material,
        quantity: 0,
        total: 0,
        ids: [] as string[]
      };
    }
    acc[key].quantity += material.quantity;
    acc[key].ids.push(material.id);
    // Recalculate total based on combined quantity
    const cost = acc[key].unit_cost * acc[key].quantity;
    acc[key].total = cost + (cost * acc[key].markup_pct / 100);
    return acc;
  }, {} as Record<string, MaterialItem & { ids: string[] }>);

  const groupedMaterialsList = Object.values(groupedMaterials);
  const materialsCost = groupedMaterialsList.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="space-y-6">
      <TemplateSelectionDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        quoteId={quoteId}
        onTemplateSelected={handleTemplateSelected}
      />

      <MaterialSelectionDialog
        open={materialDialogOpen}
        onClose={() => setMaterialDialogOpen(false)}
        quoteId={quoteId}
        onMaterialSelected={handleMaterialSelected}
      />

      <MaterialDetailsDialog
        material={selectedMaterial}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        onSave={handleMaterialUpdate}
      />

      {/* AI Quote Builder */}
      <Collapsible open={isAIBuilderOpen} onOpenChange={setIsAIBuilderOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Quote Builder
                </CardTitle>
                {isAIBuilderOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <AIQuoteBuilder quoteId={quoteId} onQuoteGenerated={loadMaterials} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Grand Total */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Grand Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${materialsCost.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Materials
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={getMaterialRecommendations} 
                size="sm" 
                variant="outline"
                disabled={loadingRecommendations}
              >
                {loadingRecommendations ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Materials Expert
                  </>
                )}
              </Button>
              <Button onClick={handleStartFromTemplate} size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Start from Template
              </Button>
              <Button onClick={handleAddMaterial} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groupedMaterialsList.map((material) => (
              <div 
                key={material.id} 
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleMaterialClick(material)}
              >
                {getItemImage(material) ? (
                  <img
                    src={getItemImage(material)}
                    alt={material.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div className="flex-shrink-0">
                    <div className="font-medium flex items-center gap-2">
                      {material.source_type === 'pin' && (
                        <MapPin className="w-4 h-4 text-primary" />
                      )}
                      {(material as any).orderDescription || (material as any).order_description || material.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {material.quantity} {material.unit} @ ${material.unit_cost.toFixed(2)}/{material.unit}
                      {material.source_type === 'pin' && ' • From Pin on Plan'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                      <div className="font-semibold">${material.total.toFixed(2)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove all materials with matching IDs
                        const idsToRemove = (material as any).ids || [material.id];
                        setMaterials(prev => prev.filter(m => !idsToRemove.includes(m.id)));
                        toast.success('Material removed');
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Materials Total:</span>
              <span className="text-green-600">${materialsCost.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
