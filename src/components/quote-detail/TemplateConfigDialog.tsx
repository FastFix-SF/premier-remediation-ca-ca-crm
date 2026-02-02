import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  total: number;
}

interface TemplateConfigDialogProps {
  open: boolean;
  onClose: () => void;
  templateName: string;
  quoteId: string;
  onSave: (templateName: string, materials: Material[]) => void;
  existingMaterials?: Material[];
}

export function TemplateConfigDialog({ open, onClose, templateName, quoteId, onSave, existingMaterials }: TemplateConfigDialogProps) {
  const [shingles, setShingles] = useState<Material[]>([]);
  const [services, setServices] = useState<Material[]>([]);
  const [otherMaterials, setOtherMaterials] = useState<Material[]>([]);
  const [variableMaterials, setVariableMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isStandingSeamTemplate = templateName.toLowerCase().includes('standing seam');

  useEffect(() => {
    if (open) {
      loadMaterials();
      // Load existing selected materials
      if (existingMaterials) {
        setSelectedMaterials(new Set(existingMaterials.map(m => m.id)));
      } else {
        setSelectedMaterials(new Set());
      }
    }
  }, [open, quoteId, existingMaterials]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_requests')
        .select('shingles_items, services_items, rf_items')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setShingles((data.shingles_items as any[]) || []);
        setServices((data.services_items as any[]) || []);
        setOtherMaterials((data.rf_items as any[]) || []);
        
        // Add variable materials for standing seam templates
        if (isStandingSeamTemplate) {
          const roofType = templateName.split(' ')[0]; // Extract "Comp", "Tile", "Cedar", etc.
          const variables: Material[] = [
            {
              id: 'var-remove-dispose',
              name: `Remove & Dispose ${roofType} Roof`,
              category: 'Demolition',
              unit: 'SQ',
              total: 0
            },
            {
              id: 'var-roof-deck',
              name: 'Roof Deck Type',
              category: 'Structure',
              unit: 'SQ',
              total: 0
            },
            {
              id: 'var-insulation',
              name: 'Insulation Thickness',
              category: 'Insulation',
              unit: 'SQ',
              total: 0
            },
            {
              id: 'var-underlayment',
              name: 'Underlayment Type',
              category: 'Underlayment',
              unit: 'SQ',
              total: 0
            },
            {
              id: 'var-standing-seam',
              name: 'Standing Seam Type',
              category: 'Metal Roofing',
              unit: 'SQ',
              total: 0
            }
          ];
          setVariableMaterials(variables);
        }
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterial = (materialId: string) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const handleSave = async () => {
    try {
      // Gather all selected materials
      const allMaterials = [...shingles, ...services, ...otherMaterials, ...variableMaterials];
      const selectedMaterialsList = allMaterials.filter(m => selectedMaterials.has(m.id));
      
      // Call the parent onSave callback
      onSave(templateName, selectedMaterialsList);
      
      // Save to database
      const { data: currentData, error: fetchError } = await supabase
        .from('quote_requests')
        .select('template_configurations')
        .eq('id', quoteId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentConfigs = (currentData?.template_configurations as Record<string, any[]>) || {};
      currentConfigs[templateName] = selectedMaterialsList;

      const { error: updateError } = await supabase
        .from('quote_requests')
        .update({ template_configurations: currentConfigs })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      toast.success(`Template "${templateName}" configured with ${selectedMaterials.size} materials`);
      onClose();
    } catch (error) {
      console.error('Error saving template configuration:', error);
      toast.error('Failed to save template configuration');
    }
  };

  const filterMaterials = (materials: Material[]) => {
    if (!searchQuery.trim()) return materials;
    const query = searchQuery.toLowerCase();
    return materials.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.category.toLowerCase().includes(query)
    );
  };

  const renderMaterialsList = (materials: Material[], title: string) => {
    const filteredMaterials = filterMaterials(materials);
    const categories = [...new Set(filteredMaterials.map(m => m.category))];
    
    if (filteredMaterials.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No materials found matching your search' : 'No materials available'}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {categories.map(category => {
          const categoryMaterials = filteredMaterials.filter(m => m.category === category);
          return (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm">{category}</h4>
              <div className="space-y-2 pl-4">
                {categoryMaterials.map(material => (
                  <div key={material.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={material.id}
                      checked={selectedMaterials.has(material.id)}
                      onCheckedChange={() => toggleMaterial(material.id)}
                    />
                    <label
                      htmlFor={material.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {material.name}
                      <span className="text-muted-foreground ml-2">
                        ({material.total} {material.unit})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configure Template: {templateName}</DialogTitle>
        </DialogHeader>

        <div className="px-1 pb-4">
          <Input
            type="text"
            placeholder="Search materials by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Tabs defaultValue={isStandingSeamTemplate ? "variables" : "shingles"} className="flex-1">
          <div className="bg-muted/50 rounded-xl p-1.5 inline-flex mb-4">
            <TabsList variant="segmented">
              {isStandingSeamTemplate && (
                <TabsTrigger variant="segmented" value="variables">Variables ({variableMaterials.length})</TabsTrigger>
              )}
              <TabsTrigger variant="segmented" value="shingles">Shingles ({shingles.length})</TabsTrigger>
              <TabsTrigger variant="segmented" value="services">Services ({services.length})</TabsTrigger>
              <TabsTrigger variant="segmented" value="materials">Other Materials ({otherMaterials.length})</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px] mt-4">
            {isStandingSeamTemplate && (
              <TabsContent value="variables" className="space-y-4 px-2">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    These variable materials are required for standing seam installations. Select them to include in your template.
                  </p>
                </div>
                {renderMaterialsList(variableMaterials, 'Variable Materials')}
              </TabsContent>
            )}
            
            <TabsContent value="shingles" className="space-y-4 px-2">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading materials...</p>
              ) : shingles.length > 0 ? (
                renderMaterialsList(shingles, 'Shingles')
              ) : (
                <p className="text-muted-foreground text-center py-8">No shingles available</p>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-4 px-2">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading services...</p>
              ) : services.length > 0 ? (
                renderMaterialsList(services, 'Services')
              ) : (
                <p className="text-muted-foreground text-center py-8">No services available</p>
              )}
            </TabsContent>

            <TabsContent value="materials" className="space-y-4 px-2">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Loading materials...</p>
              ) : otherMaterials.length > 0 ? (
                renderMaterialsList(otherMaterials, 'Other Materials')
              ) : (
                <p className="text-muted-foreground text-center py-8">No other materials available</p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            Save Configuration ({selectedMaterials.size} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
