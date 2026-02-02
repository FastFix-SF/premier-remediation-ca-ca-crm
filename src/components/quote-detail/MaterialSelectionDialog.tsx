import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ItemImage } from './ItemImage';

// Import all shingles images
import cedarShingles from '@/assets/shingles/cedar-shingles.jpg';
import cedarShake from '@/assets/shingles/cedar-shake.jpg';
import syntheticShake from '@/assets/shingles/synthetic-shake.jpg';
import slate from '@/assets/shingles/slate.jpg';
import davinciSlate from '@/assets/shingles/davinci-slate.jpg';
import concreteTile from '@/assets/shingles/concrete-tile.jpg';
import compositeTile from '@/assets/shingles/composite-tile.jpg';
import standingSeam from '@/assets/shingles/standing-seam.jpg';
import corrugatedSteel from '@/assets/shingles/corrugated-steel.jpg';
import pbrPanel from '@/assets/shingles/pbr-panel.jpg';
import stoneCoated from '@/assets/shingles/stone-coated.jpg';
import presidentialShake from '@/assets/shingles/presidential-shake.jpg';
import landmark from '@/assets/shingles/landmark.jpg';
import timberline from '@/assets/shingles/timberline.jpg';
import oakridge from '@/assets/shingles/oakridge.jpg';
import bravaTile from '@/assets/shingles/brava-tile.jpg';

// Import all materials images
import roofDecking from '@/assets/materials/roof-decking.jpg';
import underlayment from '@/assets/materials/underlayment.jpg';
import iceWaterShield from '@/assets/materials/ice-water-shield.jpg';
import valleyFlashing from '@/assets/materials/valley-flashing.jpg';
import fasteners from '@/assets/materials/fasteners.jpg';
import gutterToppers from '@/assets/materials/gutter-toppers.jpg';
import gutters from '@/assets/materials/gutters.jpg';
import eaveEdge from '@/assets/materials/eave-edge.jpg';
import rakeEdge from '@/assets/materials/rake-edge.jpg';
import starterShingles from '@/assets/materials/starter-shingles.jpg';
import lowSlopeRoof from '@/assets/materials/low-slope-roof.jpg';
import clayTile from '@/assets/materials/clay-tile.jpg';
import concreteTiles from '@/assets/materials/concrete-tiles.jpg';
import hipRidgeCap from '@/assets/materials/hip-ridge-cap.jpg';
import stepFlashing from '@/assets/materials/step-flashing.jpg';
import roofCoping from '@/assets/materials/roof-coping.jpg';
import gutterPins from '@/assets/materials/gutter-pins.jpg';
import walkingPad from '@/assets/materials/walking-pad.jpg';
import stuccoFlashing from '@/assets/materials/stucco-flashing.jpg';
import hipStarters from '@/assets/materials/hip-starters.jpg';
import chimneyCaps from '@/assets/materials/chimney-caps.jpg';
import downspouts from '@/assets/materials/downspouts.jpg';
import inspectionPins from '@/assets/materials/inspection-pins.jpg';
import insulation from '@/assets/materials/insulation.jpg';
import miscellaneous from '@/assets/materials/miscellaneous.jpg';

// Import all services images
import roofCleaning from '@/assets/services/roof-cleaning.jpg';
import equipmentCurb from '@/assets/services/equipment-curb.jpg';
import removeShingles from '@/assets/services/remove-shingles.jpg';
import cedarShakeRemoval from '@/assets/services/cedar-shake-removal.jpg';
import heavyShinglesRemoval from '@/assets/services/heavy-shingles-removal.jpg';
import metalRoofRemoval from '@/assets/services/metal-roof-removal.jpg';
import tileRoofRemoval from '@/assets/services/tile-roof-removal.jpg';
import roofVentilation from '@/assets/services/roof-ventilation.jpg';
import skylightCurb from '@/assets/services/skylight-curb.jpg';

interface MaterialSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onMaterialSelected: (material: any) => void;
}

export function MaterialSelectionDialog({ 
  open, 
  onClose, 
  quoteId, 
  onMaterialSelected 
}: MaterialSelectionDialogProps) {
  const [shingles, setShingles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [rfItems, setRfItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open, quoteId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_requests')
        .select('shingles_items, services_items, rf_items')
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;
      
      let shinglesData = (data?.shingles_items as any[]) || [];
      let servicesData = (data?.services_items as any[]) || [];
      let rfData = (data?.rf_items as any[]) || [];
      
      // If materials are empty, load from template quote
      const hasShingles = shinglesData.length > 0;
      const hasServices = servicesData.length > 0;
      const hasRfItems = rfData.length > 0;
      
      if (!hasShingles || !hasServices || !hasRfItems) {
        const { data: templateData } = await supabase
          .from('quote_requests')
          .select('shingles_items, services_items, rf_items')
          .eq('id', '3fe15ff7-af91-4adc-9523-a06e44bee6f3')
          .maybeSingle();
        
        if (templateData) {
          if (!hasShingles) shinglesData = (templateData.shingles_items as any[]) || [];
          if (!hasServices) servicesData = (templateData.services_items as any[]) || [];
          if (!hasRfItems) rfData = (templateData.rf_items as any[]) || [];
        }
      }
      
      console.log('Materials loaded:', {
        shingles: shinglesData.length,
        services: servicesData.length,
        rf: rfData.length
      });
      
      setShingles(shinglesData);
      setServices(servicesData);
      setRfItems(rfData);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaterial = (material: any) => {
    onMaterialSelected(material);
  };

  // Helper to get image for shingles items
  const getShinglesImage = (itemName: string): string | undefined => {
    const nameToImage: Record<string, string> = {
      'Install Cedar Shingles as per specifications': cedarShingles,
      'Install Cedar Shake Medium premium grade class B': cedarShake,
      'Install Cedur Synthetic shake': syntheticShake,
      'Tru Slate Labor Only': slate,
      'Install DaVinci Slate': davinciSlate,
      'Eagle Capistrano - Re-Roof Select/ Remove And Reinstall Same tile *': concreteTile,
      'Install Eagle Capistrano Tiles, Field only ^ Standard*': concreteTile,
      'Eagle Malibu - ReRoof Select-': concreteTile,
      'Eagle Capistrano - light weigh tile-': concreteTile,
      'Eagle Bel Air - Reroof Select Series Light Weith': concreteTile,
      'Boral Saxony 900 Shake - Standard Color Tile': concreteTile,
      'Quarrix Double Roman Composite Tile 16.5"x13"': compositeTile,
      'Install Steel Sheffield 24 Gage 15" Standing seam S50 Snap lock Kynar coated.': standingSeam,
      'Install ALUMINUM Sheffield 0.040 18" Standing seam S50 Snap lock Kynar coated.': standingSeam,
      'Install Steel Sheffield 24 Gage 14" Mechanical seam SS200 Panels': standingSeam,
      'Install Steel Sheffield 24 gage 18" Standing seam S50 Snap lock Kynar coated.': standingSeam,
      '8\' x 1.5\' Corrugated galvanized Steel 31 gauge roof panel': corrugatedSteel,
      'Install PBR panel profile': pbrPanel,
      'Install Steel McElroy 24 Gage 15" Standing seam S50 Snap lock Kynar coated.': standingSeam,
      'Install Boral Barrel Vault Stone Coated Metal Tiles*': stoneCoated,
      'Install Boral Pine Crest Shake Stone Coated Metal Tiles*': stoneCoated,
      'Install Boral Cottage Shingle Stone Coated Metal Tiles*': stoneCoated,
      'Install Boral Pacific Tile Stone Stone Coated Metal Tiles*': stoneCoated,
      'Install CertainTeed Presidential Shake composition shingles*': presidentialShake,
      'Install CertainTeed Landmark TL composition shingles*': landmark,
      'Install CertainTeed Presidential TL composition shingles*': presidentialShake,
      'Install CertainTeed Presidential TL Solaris composition shingles*': presidentialShake,
      'Install CertainTeed Landmark Premium composition shingles*': landmark,
      'Install CertainTeed Presidential Solaris composition shingles*': presidentialShake,
      'Install GAF Grand Sequoia composition shingles"': timberline,
      'Install GAF Grand Canyon-': timberline,
      'Install GAF Timberline HDZ composition shingles +': timberline,
      'Install CertainTeed Landmark composition shingles -': landmark,
      'Install Owens Corning Oakridge composition shingles "': oakridge,
      'Install Owens Corning TruDefinition Duration composition shingles-': oakridge,
      'Install CertainTeed Landmark PRO composition shingles +': landmark,
      'Install GAF Timberline Ultra HD composition shingles-': timberline,
      'Install Malarkey Ecoasis 282 composition shingles-': timberline,
      'Install Malarkey Highlander 241 composition shingles-': timberline,
      'Install CertainTeed Landmark PRO Solaris composition shingles*': landmark,
      'Install CertainTeed Landmark Solaris composition shingles*': landmark,
      'Install Owens Corning TruDefinition Duration Premium Shingles"': oakridge,
      'brava Barrel tile': bravaTile,
    };
    return nameToImage[itemName];
  };

  // Helper to get image for RF materials based on category
  const getMaterialsImage = (category: string): string | undefined => {
    const categoryToImage: Record<string, string> = {
      'Roof Decking (Actual Square)': roofDecking,
      'Underlayment': underlayment,
      'Ice & Water Shield': iceWaterShield,
      'Valleys': valleyFlashing,
      'Underlayment Fasteners': fasteners,
      'Shingle Fasteners': fasteners,
      'Gutter Toppers': gutterToppers,
      'Gutters': gutters,
      'Eave Edge': eaveEdge,
      'Rake Edge': rakeEdge,
      'Starter Shingles Whole Perimeter': starterShingles,
      'Starter Presi/Grnd Seq/Slate/shake': starterShingles,
      'Low Slope Roof': lowSlopeRoof,
      'Clay Tile': clayTile,
      'Concrete Tiles': concreteTiles,
      'Hip & Ridge Cap': hipRidgeCap,
      'Step Flashing': stepFlashing,
      'Flat roof Edge /Copping': roofCoping,
      'Wall': roofCoping,
      'Gutter Report Pins': gutterPins,
      'Walking pad': walkingPad,
      'Stucco Flashing': stuccoFlashing,
      'Gutter between two roofs': gutters,
      'Hip Starters': hipStarters,
      'Flue & Chimney Caps': chimneyCaps,
      'Miscellaneous': miscellaneous,
      'Downspouts': downspouts,
      'Inspection Pins': inspectionPins,
      'Insulation': insulation,
      'Exclusions': miscellaneous,
    };
    return categoryToImage[category];
  };

  // Helper to get image for services based on category
  const getServicesImage = (category: string): string | undefined => {
    const categoryToImage: Record<string, string> = {
      'Roof Cleaning': roofCleaning,
      'Equipment Curb': equipmentCurb,
      'Remove & Dispose Shingles': removeShingles,
      'Remove & Dispose 2nd Layer': heavyShinglesRemoval,
      'Remove and Replace Wood': roofDecking,
      'Disposal Fee': miscellaneous,
      'Steep Roof Charges': miscellaneous,
      '2-Story Roof Charges': miscellaneous,
    };
    return categoryToImage[category];
  };

  const getItemImage = (item: any, tabType: 'shingles' | 'services' | 'rf'): string => {
    // First check if item has a picture field
    if (item.picture) return item.picture;
    if (item.image_url) return item.image_url;
    
    // Use intelligent mapping based on type
    if (tabType === 'shingles') {
      const image = getShinglesImage(item.name);
      if (image) return image;
    } else if (tabType === 'services') {
      const image = getServicesImage(item.category);
      if (image) return image;
    } else if (tabType === 'rf') {
      const image = getMaterialsImage(item.category);
      if (image) return image;
    }
    
    // Fallback to miscellaneous
    return miscellaneous;
  };

  const filterMaterials = (materials: any[]) => {
    if (!searchQuery.trim()) return materials;
    return materials.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderMaterialsList = (materials: any[], tabType: 'shingles' | 'services' | 'rf') => {
    const filtered = filterMaterials(materials);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No materials found matching your search' : 'No materials configured yet'}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filtered.map((material, idx) => (
          <Card 
            key={idx}
            className="border hover:border-primary transition-colors cursor-pointer"
            onClick={() => handleSelectMaterial(material)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                  <ItemImage 
                    src={getItemImage(material, tabType)} 
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{material.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(material.orderDescription || material.order_description) && (
                      <div className="mb-1">Order: {material.orderDescription || material.order_description}</div>
                    )}
                    {material.category && <span className="mr-2">Category: {material.category}</span>}
                    {material.unit && <span>Unit: {material.unit}</span>}
                  </div>
                </div>
                <Button
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMaterial(material);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Material from Materials Tab</DialogTitle>
          <DialogDescription>
            Select a material to add to the estimator
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="px-1 pb-4">
              <Input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Tabs defaultValue="shingles" className="flex-1 overflow-hidden flex flex-col">
              <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
                <TabsList variant="segmented">
                  <TabsTrigger variant="segmented" value="shingles">Shingles ({shingles.length})</TabsTrigger>
                  <TabsTrigger variant="segmented" value="services">Services ({services.length})</TabsTrigger>
                  <TabsTrigger variant="segmented" value="rf">Other Materials ({rfItems.length})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="shingles" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderMaterialsList(shingles, 'shingles')}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="services" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderMaterialsList(services, 'services')}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="rf" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderMaterialsList(rfItems, 'rf')}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
