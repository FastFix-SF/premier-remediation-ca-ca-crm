import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Settings, Image as ImageIcon, X, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MaterialItemSettingsDialog } from './MaterialItemSettingsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ItemImage } from './ItemImage';

// Import all shingles images directly
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

// Import all services images directly
import roofCleaning from '@/assets/services/roof-cleaning.jpg';
import equipmentCurb from '@/assets/services/equipment-curb.jpg';
import removeShingles from '@/assets/services/remove-shingles.jpg';
import cedarShakeRemoval from '@/assets/services/cedar-shake-removal.jpg';
import heavyShinglesRemoval from '@/assets/services/heavy-shingles-removal.jpg';
import metalRoofRemoval from '@/assets/services/metal-roof-removal.jpg';
import tileRoofRemoval from '@/assets/services/tile-roof-removal.jpg';
import roofVentilation from '@/assets/services/roof-ventilation.jpg';
import skylightCurb from '@/assets/services/skylight-curb.jpg';

interface RFItem {
  id: string;
  name: string;
  total: number;
  unit: string;
  category: string;
  showInApp?: boolean;
  showOnEstimate?: boolean;
  showOnMaterialOrder?: boolean;
  showOnContract?: boolean;
  showOnLaborReport?: boolean;
  picture?: string;
  coverage?: number;
  labor?: number;
  material?: number;
  factor?: number;
}

interface RFItemsTabProps {
  quoteId: string;
  itemType?: 'rf' | 'shingles' | 'services';
}

const RF_CATEGORIES = [
  'Gutter Report Pins',
  'Walking pad',
  'Stucco Flashing',
  'Gutter between two roofs',
  'Roof Decking (Actual Square)',
  'Underlayment',
  'Ice & Water Shield',
  'Valleys',
  'Underlayment Fasteners',
  'Gutter Toppers',
  'Gutters',
  'Eave Edge',
  'Rake Edge',
  'Starter Shingles Whole Perimeter',
  'Starter Presi/Grnd Seq/Slate/shake',
  'Shingle Fasteners',
  'Low Slope Roof',
  'Clay Tile',
  'Concrete Tiles',
  'Hip & Ridge Cap',
  'Wall',
  'Flue & Chimney Caps',
  'Step Flashing',
  'Flat roof Edge /Copping',
  'Miscellaneous',
  'Downspouts',
  'Inspection Pins',
  'Insulation',
  'Exclusions'
];

const SHINGLES_CATEGORIES = [
  'Brava tile',
  'Architectural Shingles',
  'Premium Architectural Shingles',
  'Stone-Coated',
  'Standing seam',
  'Concrete Tile',
  'Slate',
  'Wood Shakes & Shingles'
];

const SERVICES_CATEGORIES = [
  'Roof Cleaning',
  'Equipment Curb',
  'Remove & Dispose Shingles',
  'Remove & Dispose 2nd Layer',
  'Remove and Replace Wood',
  'Disposal Fee',
  'Steep Roof Charges',
  '2-Story Roof Charges'
];

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


export function RFItemsTab({ quoteId, itemType = 'rf' }: RFItemsTabProps) {
  const dbColumn = itemType === 'shingles' ? 'shingles_items' : itemType === 'services' ? 'services_items' : 'rf_items';
  const categories = itemType === 'shingles' ? SHINGLES_CATEGORIES : itemType === 'services' ? SERVICES_CATEGORIES : RF_CATEGORIES;
  const [items, setItems] = useState<RFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories));
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<RFItem | null>(null);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [showFactorHelp, setShowFactorHelp] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchItems();
  }, [quoteId]);

  // Auto-populate categories with default items when they're empty
  useEffect(() => {
    if (loading) return;
    
    // Check all categories for empty ones
    const emptyCategories = categories.filter(cat => getCategoryItems(cat).length === 0);
    
    if (emptyCategories.length > 0) {
      const allNewItems: RFItem[] = [];
      
      emptyCategories.forEach(category => {
        if (itemType === 'shingles' && SHINGLES_CATEGORIES.includes(category)) {
          allNewItems.push(...getDefaultShinglesItems(category));
        } else if (itemType === 'services' && SERVICES_CATEGORIES.includes(category)) {
          allNewItems.push(...getDefaultServicesItems(category));
        } else if (itemType === 'rf' && RF_CATEGORIES.includes(category)) {
          allNewItems.push(...getDefaultRFItems(category));
        }
      });
      
      if (allNewItems.length > 0) {
        saveItems([...items, ...allNewItems]);
      }
    }
  }, [loading]);

  const getItemDefaults = (itemName: string): { coverage: number; labor: number; material: number; factor: number; total: number } | null => {
    const defaults: Record<string, { coverage: number; labor: number; material: number; factor: number; total: number }> = {
      'brava Barrel tile': { coverage: 1, labor: 252.00, material: 760.00, factor: 1.00, total: 1 },
      'Install GAF Timberline HDZ composition shingles +': { coverage: 3, labor: 105.00, material: 158.00, factor: 1.00, total: 3 },
      'Install CertainTeed Landmark composition shingles -': { coverage: 3, labor: 105.00, material: 170.00, factor: 1.00, total: 3 },
      'Install Owens Corning Oakridge composition shingles "': { coverage: 3, labor: 105.00, material: 153.20, factor: 1.00, total: 3 },
      'Install Owens Corning TruDefinition Duration composition shingles -': { coverage: 3, labor: 105.00, material: 188.00, factor: 1.00, total: 3 },
      'Install CertainTeed Landmark PRO composition shingles +': { coverage: 4, labor: 126.00, material: 186.00, factor: 1.00, total: 4 },
      'Install GAF Timberline Ultra HD composition shingles-': { coverage: 4, labor: 126.00, material: 200.00, factor: 1.00, total: 4 },
      'Install Malarkey Ecoasis 282 composition shingles-': { coverage: 3, labor: 105.00, material: 170.00, factor: 1.00, total: 3 },
      'Install Malarkey Highlander 241 composition shingles-': { coverage: 3, labor: 105.00, material: 150.00, factor: 1.00, total: 3 },
      'Install CertainTeed Landmark PRO Solaris composition shingles -': { coverage: 3, labor: 126.00, material: 216.90, factor: 1.00, total: 3 },
      'Install CertainTeed Landmark Solaris composition shingles*': { coverage: 3, labor: 105.00, material: 186.90, factor: 1.00, total: 3 },
      'Install Owens Corning TruDefinition Duration Premium Shingles -': { coverage: 4, labor: 126.00, material: 218.10, factor: 1.00, total: 4 },
      'Install CertainTeed Presidential Shake composition shingles*': { coverage: 5, labor: 136.50, material: 231.70, factor: 1.00, total: 5 },
      'Install CertainTeed Landmark TL composition shingles*': { coverage: 4, labor: 126.00, material: 229.10, factor: 1.00, total: 4 },
      'Install CertainTeed Presidential TL composition shingles*': { coverage: 6, labor: 147.00, material: 269.50, factor: 1.00, total: 6 },
      'Install CertainTeed Presidential TL Solaris composition shingles': { coverage: 6, labor: 147.00, material: 285.10, factor: 1.00, total: 6 },
      'Install CertainTeed Landmark Premium composition shingles*': { coverage: 4, labor: 105.00, material: 209.50, factor: 1.00, total: 4 },
      'Install CertainTeed Presidential Solaris composition shingles*': { coverage: 5, labor: 136.50, material: 247.40, factor: 1.00, total: 5 },
      'Install GAF Grand Sequoia composition shingles"': { coverage: 5, labor: 136.50, material: 232.00, factor: 1.00, total: 5 },
      'Install GAF Grand Canyon-': { coverage: 6, labor: 147.00, material: 270.60, factor: 1.00, total: 6 },
      'Install Boral Barrel Vault Stone Coated Metal Tiles*': { coverage: 24, labor: 210.00, material: 318.00, factor: 1.00, total: 24 },
      'Install Boral Pine Crest Shake Stone Coated Metal Tiles*': { coverage: 20, labor: 178.50, material: 290.70, factor: 1.00, total: 20 },
      'Install Boral Cottage Shingle Stone Coated Metal Tiles*': { coverage: 22, labor: 178.50, material: 308.10, factor: 1.00, total: 22 },
      'Install Boral Pacific Tile Stone Stone Coated Metal Tiles*': { coverage: 20, labor: 178.50, material: 295.80, factor: 1.00, total: 20 },
      'Install Steel Sheffield 24 Gage 15" Standing seam S50 Snap lock Kynar coated.': { coverage: 1, labor: 300.00, material: 380.00, factor: 1.00, total: 1 },
      'Install ALUMINUM Sheffield 0.040 18" Standing seam S50 Snap lock Kynar coated.': { coverage: 1, labor: 315.00, material: 522.00, factor: 1.00, total: 1 },
      'Install Steel Sheffield 24 Gage 14" Mechanical seam SS200 Panel Kynar coated -': { coverage: 1, labor: 315.00, material: 424.50, factor: 1.00, total: 1 },
      'Install Steel Sheffield 24 gage 18" Standing seam S50 Snap lock Kynar coated-': { coverage: 1, labor: 315.00, material: 400.00, factor: 1.00, total: 1 },
      '8\' x 1.5\' Corrugated galvanized Steel 31 gauge roof panel': { coverage: 7.5, labor: 315.00, material: 173.50, factor: 1.00, total: 7.5 },
      'Install PBR panel profile': { coverage: 1, labor: 300.00, material: 600.00, factor: 1.00, total: 1 },
      'Install Steel McElroy 24 Gage 15" Standing seam S50 Snap lock Kynar coated -': { coverage: 1, labor: 300.00, material: 280.00, factor: 1.00, total: 1 },
      'Eagle Capistrano - Re-Roof Select/ Remove And Reinstall Same tile *': { coverage: 89, labor: 315.00, material: 16.00, factor: 1.00, total: 89 },
      'Install Eagle Capistrano Tiles, Field only ^ Standard*': { coverage: 88.5, labor: 315.00, material: 264.00, factor: 1.00, total: 88.5 },
      'Eagle Malibu - ReRoof Select-': { coverage: 88, labor: 315.00, material: 334.90, factor: 1.00, total: 88 },
      'Eagle Capistrano - light weigh tile-': { coverage: 89, labor: 315.00, material: 336.80, factor: 1.00, total: 89 },
      'Eagle Bel Air - Reroof Select Series Light Weith': { coverage: 89, labor: 315.00, material: 270.00, factor: 1.00, total: 89 },
      'Boral Saxony 900 Shake - Standard Color Tile': { coverage: 89, labor: 315.00, material: 230.00, factor: 1.00, total: 89 },
      'Quarrix Double Roman Composite Tile 16.5"x13"': { coverage: 92, labor: 315.00, material: 67.39, factor: 1.00, total: 92 },
      'Tru Slate Labor Only': { coverage: 1, labor: 241.50, material: 0.00, factor: 1.15, total: 1 },
      'Install DaVinci Slate': { coverage: 1, labor: 160.00, material: 3920.00, factor: 1.00, total: 1 },
    };
    return defaults[itemName] || null;
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_requests')
        .select(dbColumn)
        .eq('id', quoteId)
        .maybeSingle();

      if (error) throw error;

      const itemsData = data?.[dbColumn as keyof typeof data] as any[];
      
      // Check if items are empty or all have zeros
      const hasValidItems = itemsData && 
        Array.isArray(itemsData) && 
        itemsData.length > 0 &&
        itemsData.some((item: any) => 
          (item.labor_cost && item.labor_cost > 0) || 
          (item.material_cost && item.material_cost > 0) ||
          (item.labor && item.labor > 0) || 
          (item.material && item.material > 0)
        );

      if (hasValidItems) {
        // Use existing items, normalizing field names
        const updatedItems = (itemsData as unknown as RFItem[]).map(item => ({
          ...item,
          // Handle both labor/material and labor_cost/material_cost field names
          labor: item.labor ?? (item as any).labor_cost ?? 0,
          material: item.material ?? (item as any).material_cost ?? 0,
          coverage: item.coverage ?? (itemType === 'services' ? 1 : 0),
          factor: item.factor ?? 1.00
        }));
        setItems(updatedItems);
      } else {
        // Load template from the reference quote
        const { data: templateData, error: templateError } = await supabase
          .from('quote_requests')
          .select(dbColumn)
          .eq('id', '3fe15ff7-af91-4adc-9523-a06e44bee6f3')
          .maybeSingle();

        if (templateError) {
          console.error('Error loading template:', templateError);
          setItems([]);
          return;
        }

        const templateItems = templateData?.[dbColumn as keyof typeof templateData];
        if (templateItems && Array.isArray(templateItems)) {
          // Use template items with normalized field names
          const normalizedItems = (templateItems as unknown as RFItem[]).map(item => ({
            ...item,
            id: `${itemType}-${Date.now()}-${Math.random()}`, // Generate new IDs
            labor: item.labor ?? (item as any).labor_cost ?? 0,
            material: item.material ?? (item as any).material_cost ?? 0,
            coverage: item.coverage ?? (itemType === 'services' ? 1 : 0),
            factor: item.factor ?? 1.00
          }));
          
          // Save the template items to current quote
          await supabase
            .from('quote_requests')
            .update({ [dbColumn]: normalizedItems as any })
            .eq('id', quoteId);
          
          setItems(normalizedItems);
          toast.success('Loaded material templates');
        } else {
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Error fetching RF items:', error);
      toast.error('Failed to load RF items');
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (updatedItems: RFItem[]) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ [dbColumn]: updatedItems as any })
        .eq('id', quoteId);

      if (error) throw error;
      setItems(updatedItems);
      toast.success(`${itemType === 'shingles' ? 'Shingles' : itemType === 'services' ? 'Services' : 'RF'} items saved`);
    } catch (error) {
      console.error(`Error saving ${itemType} items:`, error);
      toast.error(`Failed to save ${itemType} items`);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
    setSelectedCategory(category);
  };

  const getCategoryItems = (category: string) => {
    let categoryItems = items.filter(item => item.category === category);
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categoryItems = categoryItems.filter(item => {
        // Search by item name
        if (item.name.toLowerCase().includes(query)) return true;
        
        // Search by category
        if (item.category?.toLowerCase().includes(query)) return true;
        
        // Search by any other text fields that might contain descriptions
        const itemData = item as any;
        if (itemData.description?.toLowerCase().includes(query)) return true;
        if (itemData.orderDescription?.toLowerCase().includes(query)) return true;
        if (itemData.order_description?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }
    
    return categoryItems;
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    saveItems(updatedItems);
  };

  const addNewItem = (category: string) => {
    const newItem: RFItem = {
      id: `${itemType}-${Date.now()}`,
      name: '',
      total: 0,
      unit: '$/Ea.',
      category: category,
      showInApp: true,
      showOnEstimate: true,
      showOnMaterialOrder: true,
      showOnContract: true,
      showOnLaborReport: true,
      coverage: itemType === 'services' ? 1 : 0,
      labor: 0,
      material: 0,
      factor: 1.00,
    };
    saveItems([...items, newItem]);
  };

  const getDefaultShinglesItems = (category: string): RFItem[] => {
    const timestamp = Date.now();
    const defaultItems: Record<string, RFItem[]> = {
      'Brava tile': [
        { id: `${itemType}-${timestamp}-1`, name: 'brava Barrel tile', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: bravaTile, coverage: 1, labor: 252.00, material: 760.00, factor: 1.00 }
      ],
      'Architectural Shingles': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install GAF Timberline HDZ composition shingles +', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: timberline, coverage: 3, labor: 105.00, material: 158.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install CertainTeed Landmark composition shingles -', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 3, labor: 105.00, material: 170.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install Owens Corning Oakridge composition shingles "', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: oakridge, coverage: 3, labor: 105.00, material: 153.20, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Install Owens Corning TruDefinition Duration composition shingles -', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: oakridge, coverage: 3, labor: 105.00, material: 188.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: 'Install CertainTeed Landmark PRO composition shingles +', total: 4, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 4, labor: 126.00, material: 186.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: 'Install GAF Timberline Ultra HD composition shingles-', total: 4, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: timberline, coverage: 4, labor: 126.00, material: 200.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: 'Install Malarkey Ecoasis 282 composition shingles-', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: oakridge, coverage: 3, labor: 105.00, material: 170.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-8`, name: 'Install Malarkey Highlander 241 composition shingles-', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: oakridge, coverage: 3, labor: 105.00, material: 150.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-9`, name: 'Install CertainTeed Landmark PRO Solaris composition shingles -', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 3, labor: 126.00, material: 216.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-10`, name: 'Install CertainTeed Landmark Solaris composition shingles*', total: 3, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 3, labor: 105.00, material: 186.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-11`, name: 'Install Owens Corning TruDefinition Duration Premium Shingles -', total: 4, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: oakridge, coverage: 4, labor: 126.00, material: 218.10, factor: 1.00 }
      ],
      'Premium Architectural Shingles': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install CertainTeed Presidential Shake composition shingles*', total: 5, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: presidentialShake, coverage: 5, labor: 136.50, material: 231.70, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install CertainTeed Landmark TL composition shingles*', total: 4, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 4, labor: 126.00, material: 229.10, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install CertainTeed Presidential TL composition shingles*', total: 6, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: presidentialShake, coverage: 6, labor: 147.00, material: 269.50, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Install CertainTeed Presidential TL Solaris composition shingles', total: 6, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: presidentialShake, coverage: 6, labor: 147.00, material: 285.10, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: 'Install CertainTeed Landmark Premium composition shingles*', total: 4, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: landmark, coverage: 4, labor: 105.00, material: 209.50, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: 'Install CertainTeed Presidential Solaris composition shingles*', total: 5, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: presidentialShake, coverage: 5, labor: 136.50, material: 247.40, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: 'Install GAF Grand Sequoia composition shingles"', total: 5, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: timberline, coverage: 5, labor: 136.50, material: 232.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-8`, name: 'Install GAF Grand Canyon-', total: 6, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: timberline, coverage: 6, labor: 147.00, material: 270.60, factor: 1.00 }
      ],
      'Stone-Coated': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install Boral Barrel Vault Stone Coated Metal Tiles*', total: 24, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stoneCoated, coverage: 24, labor: 210.00, material: 318.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install Boral Pine Crest Shake Stone Coated Metal Tiles*', total: 20, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stoneCoated, coverage: 20, labor: 178.50, material: 290.70, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install Boral Cottage Shingle Stone Coated Metal Tiles*', total: 22, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stoneCoated, coverage: 22, labor: 178.50, material: 308.10, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Install Boral Pacific Tile Stone Stone Coated Metal Tiles*', total: 20, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stoneCoated, coverage: 20, labor: 178.50, material: 295.80, factor: 1.00 }
      ],
      'Standing seam': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install Steel Sheffield 24 Gage 15" Standing seam S50 Snap lock Kynar coated.', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: standingSeam, coverage: 1, labor: 300.00, material: 380.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install ALUMINUM Sheffield 0.040 18" Standing seam S50 Snap lock Kynar coated.', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: standingSeam, coverage: 1, labor: 315.00, material: 522.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install Steel Sheffield 24 Gage 14" Mechanical seam SS200 Panel Kynar coated -', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: standingSeam, coverage: 1, labor: 315.00, material: 424.50, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Install Steel Sheffield 24 gage 18" Standing seam S50 Snap lock Kynar coated-', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: standingSeam, coverage: 1, labor: 315.00, material: 400.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: '8\' x 1.5\' Corrugated galvanized Steel 31 gauge roof panel', total: 7.5, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: corrugatedSteel, coverage: 7.5, labor: 315.00, material: 173.50, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: 'Install PBR panel profile', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: pbrPanel, coverage: 1, labor: 300.00, material: 600.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: 'Install Steel McElroy 24 Gage 15" Standing seam S50 Snap lock Kynar coated -', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: standingSeam, coverage: 1, labor: 300.00, material: 280.00, factor: 1.00 }
      ],
      'Concrete Tile': [
        { id: `${itemType}-${timestamp}-1`, name: 'Eagle Capistrano - Re-Roof Select/ Remove And Reinstall Same tile *', total: 89, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 89, labor: 315.00, material: 16.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install Eagle Capistrano Tiles, Field only ^ Standard*', total: 88.5, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 88.5, labor: 315.00, material: 264.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Eagle Malibu - ReRoof Select-', total: 88, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 88, labor: 315.00, material: 334.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Eagle Capistrano - light weigh tile-', total: 89, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 89, labor: 315.00, material: 336.80, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: 'Eagle Bel Air - Reroof Select Series Light Weith', total: 89, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 89, labor: 315.00, material: 270.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: 'Boral Saxony 900 Shake - Standard Color Tile', total: 89, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTile, coverage: 89, labor: 315.00, material: 230.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: 'Quarrix Double Roman Composite Tile 16.5"x13"', total: 92, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: compositeTile, coverage: 92, labor: 315.00, material: 67.39, factor: 1.00 }
      ],
      'Slate': [
        { id: `${itemType}-${timestamp}-1`, name: 'Tru Slate Labor Only', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: slate, coverage: 1, labor: 241.50, material: 0.00, factor: 1.15 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install DaVinci Slate', total: 1, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: davinciSlate, coverage: 1, labor: 160.00, material: 3920.00, factor: 1.00 }
      ],
      'Wood Shakes & Shingles': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install Cedar Shingles as per specifications', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: cedarShingles, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install Cedar Shake Medium premium grade class B', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: cedarShake, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install Cedur Synthetic shake', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: syntheticShake, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ]
    };

    return defaultItems[category] || [];
  };

  const getDefaultServicesItems = (category: string): RFItem[] => {
    const timestamp = Date.now();
    const defaultItems: Record<string, RFItem[]> = {
      'Roof Cleaning': [
        { id: `${itemType}-${timestamp}-1`, name: 'Roof Cleaning Service', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofCleaning, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Equipment Curb': [
        { id: `${itemType}-${timestamp}-1`, name: 'Equipment Curb Installation', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: equipmentCurb, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Remove & Dispose Shingles': [
        { id: `${itemType}-${timestamp}-1`, name: 'Remove & Dispose Asphalt Shingles', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: removeShingles, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Remove & Dispose 2nd Layer': [
        { id: `${itemType}-${timestamp}-1`, name: 'Remove & Dispose 2nd Layer of Shingles', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: heavyShinglesRemoval, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Remove and Replace Wood': [
        { id: `${itemType}-${timestamp}-1`, name: 'Remove and Replace Damaged Wood Decking', total: 0, unit: '$/Sheet', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofDecking, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Disposal Fee': [
        { id: `${itemType}-${timestamp}-1`, name: 'Disposal Fee', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Steep Roof Charges': [
        { id: `${itemType}-${timestamp}-1`, name: 'Steep Roof Labor Charge', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      '2-Story Roof Charges': [
        { id: `${itemType}-${timestamp}-1`, name: '2-Story Roof Labor Charge', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ]
    };

    return defaultItems[category] || [];
  };

  const getDefaultRFItems = (category: string): RFItem[] => {
    const timestamp = Date.now();
    const defaultItems: Record<string, RFItem[]> = {
      'Roof Decking (Actual Square)': [
        { id: `${itemType}-${timestamp}-1`, name: '7/16" OSB Roof Decking', total: 0, unit: '$/Sheet', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofDecking, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: '1/2" CDX Plywood Decking', total: 0, unit: '$/Sheet', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofDecking, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Underlayment': [
        { id: `${itemType}-${timestamp}-1`, name: 'Synthetic Underlayment', total: 0, unit: '$/Roll', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: underlayment, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: '#30 Felt Underlayment', total: 0, unit: '$/Roll', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: underlayment, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Ice & Water Shield': [
        { id: `${itemType}-${timestamp}-1`, name: 'Ice & Water Shield', total: 0, unit: '$/Roll', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: iceWaterShield, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Valleys': [
        { id: `${itemType}-${timestamp}-1`, name: 'Valley Flashing', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: valleyFlashing, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Underlayment Fasteners': [
        { id: `${itemType}-${timestamp}-1`, name: 'Cap Nails for Underlayment', total: 0, unit: '$/Box', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: fasteners, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Shingle Fasteners': [
        { id: `${itemType}-${timestamp}-1`, name: 'Roofing Nails 1-1/4"', total: 0, unit: '$/Box', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: fasteners, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Gutter Toppers': [
        { id: `${itemType}-${timestamp}-1`, name: 'Gutter Guard/Topper', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: gutterToppers, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Gutters': [
        { id: `${itemType}-${timestamp}-1`, name: '5" K-Style Gutter', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: gutters, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: '6" K-Style Gutter', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: gutters, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Eave Edge': [
        { id: `${itemType}-${timestamp}-1`, name: 'Drip Edge - Eave', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: eaveEdge, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Rake Edge': [
        { id: `${itemType}-${timestamp}-1`, name: 'Drip Edge - Rake', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: rakeEdge, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Starter Shingles Whole Perimeter': [
        { id: `${itemType}-${timestamp}-1`, name: 'Starter Strip Shingles', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: starterShingles, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Hip & Ridge Cap': [
        { id: `${itemType}-${timestamp}-1`, name: 'Hip & Ridge Cap Shingles', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: hipRidgeCap, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Step Flashing': [
        { id: `${itemType}-${timestamp}-1`, name: 'Step Flashing', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stepFlashing, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Walking pad': [
        { id: `${itemType}-${timestamp}-1`, name: 'Roof Walking Pad', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: walkingPad, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Downspouts': [
        { id: `${itemType}-${timestamp}-1`, name: '2x3 Downspout', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: downspouts, coverage: 0, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: '3x4 Downspout', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: downspouts, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Flue & Chimney Caps': [
        { id: `${itemType}-${timestamp}-1`, name: 'Chimney Cap', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: chimneyCaps, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Gutter Report Pins': [
        { id: `${itemType}-${timestamp}-1`, name: 'Gutter Report Pin', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: gutterPins, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Stucco Flashing': [
        { id: `${itemType}-${timestamp}-1`, name: 'Stucco Flashing', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: stuccoFlashing, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Gutter between two roofs': [
        { id: `${itemType}-${timestamp}-1`, name: 'Gutter between two roofs', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: gutters, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Starter Presi/Grnd Seq/Slate/shake': [
        { id: `${itemType}-${timestamp}-1`, name: 'Premium Starter Shingles', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: starterShingles, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Low Slope Roof': [
        { id: `${itemType}-${timestamp}-1`, name: 'Low Slope Roofing Material', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: lowSlopeRoof, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Clay Tile': [
        { id: `${itemType}-${timestamp}-1`, name: 'Clay Roof Tiles', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: clayTile, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Concrete Tiles': [
        { id: `${itemType}-${timestamp}-1`, name: 'Concrete Roof Tiles', total: 0, unit: '$/Sq.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: concreteTiles, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Wall': [
        { id: `${itemType}-${timestamp}-1`, name: 'Wall Flashing', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofCoping, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Flat roof Edge /Copping': [
        { id: `${itemType}-${timestamp}-1`, name: 'Flat Roof Edge/Coping', total: 0, unit: '$/Lf.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: roofCoping, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Miscellaneous': [
        { id: `${itemType}-${timestamp}-1`, name: 'Miscellaneous Item', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Inspection Pins': [
        { id: `${itemType}-${timestamp}-1`, name: 'Inspection Pin', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: inspectionPins, coverage: 0, labor: 0, material: 0, factor: 1.00 }
      ],
      'Insulation': [
        { id: `${itemType}-${timestamp}-1`, name: 'Install Tapered Insulation "X"1/4" slope per foot, mechanically attach', total: 24.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 8.00, material: 16.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Install Tapered Insulation "Y"1/4" slope per foot, mechanically attach', total: 42.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 8.00, material: 34.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Install 2" ISO Insulation 4x8 Panels Mechanically attached to roof deck', total: 250.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 65.00, material: 185.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Install 6" Taper Edge where needed', total: 277.50, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 52.50, material: 225.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: '2" #14 (1000 Count) Screws-', total: 122.60, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 122.60, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: '2.5" #14(1000 Count) Screws-', total: 142.90, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 142.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: '3" #14 (1000 Count) Screws-', total: 170.10, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 170.10, factor: 1.00 },
        { id: `${itemType}-${timestamp}-8`, name: '3.5" #14 (1000 Count) Screws-', total: 219.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 219.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-9`, name: '4" #14 (1000 Count) Screws-', total: 255.20, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 255.20, factor: 1.00 },
        { id: `${itemType}-${timestamp}-10`, name: '5" #14 (1000 Count) Screws-', total: 349.50, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 349.50, factor: 1.00 },
        { id: `${itemType}-${timestamp}-11`, name: '6" #14 (1000 Count) Screws-', total: 432.90, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 18, labor: 0.00, material: 432.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-12`, name: 'Install Tapered Insulation "A"1/8" slope per foot,', total: 22.30, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 17.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-13`, name: 'Install Tapered Insulation "AA"1/8" slope per foot,', total: 18.55, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 13.25, factor: 1.00 },
        { id: `${itemType}-${timestamp}-14`, name: 'Install Tapered Insulation "B"1/6" slope per foot,', total: 28.60, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 23.30, factor: 1.00 },
        { id: `${itemType}-${timestamp}-15`, name: 'Install Tapered Insulation "C"1/8" slope per foot,', total: 35.50, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 30.20, factor: 1.00 },
        { id: `${itemType}-${timestamp}-16`, name: 'Install Tapered Insulation "D"1/8" slope per foot,', total: 41.30, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 36.00, factor: 1.00 },
        { id: `${itemType}-${timestamp}-17`, name: 'Install Tapered Insulation "E"1/8" slope per foot,', total: 48.45, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 43.15, factor: 1.00 },
        { id: `${itemType}-${timestamp}-18`, name: 'Install Tapered Insulation "F"1/8" slope per foot,', total: 54.20, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 48.90, factor: 1.00 },
        { id: `${itemType}-${timestamp}-19`, name: 'Install Tapered Insulation "FF"1/8" slope per foot,', total: 63.95, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 1, labor: 5.30, material: 58.65, factor: 1.00 },
        { id: `${itemType}-${timestamp}-20`, name: 'Install R-SEAL 4" R-30', total: 1140.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: insulation, coverage: 3.3, labor: 40.00, material: 1100.00, factor: 1.00 }
      ],
      'Exclusions': [
        { id: `${itemType}-${timestamp}-1`, name: 'Scaffolding', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-2`, name: 'Permit Fees/ Parking permit fees', total: 200.00, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-3`, name: 'Dry Rotted or Damaged roof deck/ Termite Damage', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-4`, name: 'Light Well re-roof or repairs', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-5`, name: 'Additional Roof layers to be removed if any @ $65.00 per Sqr.', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-6`, name: 'Roof Removal', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-7`, name: 'Dry Rotted or Damaged Rafters', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 },
        { id: `${itemType}-${timestamp}-8`, name: 'Solar panel Removal and re-installation', total: 0, unit: '$/Ea.', category, showInApp: true, showOnEstimate: true, showOnMaterialOrder: true, showOnContract: true, showOnLaborReport: true, picture: miscellaneous, coverage: 1, labor: 0, material: 0, factor: 1.00 }
      ]
    };

    return defaultItems[category] || [];
  };

  const handleItemSettingsSave = (updatedItem: RFItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    saveItems(updatedItems);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const deleteSelectedItems = () => {
    const updatedItems = items.filter(item => !selectedItems.has(item.id));
    saveItems(updatedItems);
    setSelectedItems(new Set());
    toast.success('Selected items deleted');
  };

  const moveSelectedItems = async () => {
    if (!targetCategory) return;
    
    const updatedItems = items.map(item => 
      selectedItems.has(item.id) ? { ...item, category: targetCategory } : item
    );
    
    await saveItems(updatedItems);
    setSelectedItems(new Set());
    setShowMoveDialog(false);
    setTargetCategory('');
    setSelectedCategory(targetCategory);
    toast.success('Items moved successfully');
  };

  const currentItems = selectedCategory ? getCategoryItems(selectedCategory) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 bg-background h-[calc(100vh-300px)]">
      {/* Top Header Bar with Search and View Buttons */}
      <div className="flex items-center justify-between gap-2 px-6 py-3 border-b bg-background">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('simple')}
          >
            Simple View
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('detailed')}
          >
            Detailed View
          </Button>
        </div>
      </div>
      
      {/* Content Area with Sidebar */}
      <div className="flex gap-0 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-muted/30 border-r">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category);
                const isSelected = selectedCategory === category;
                const itemCount = getCategoryItems(category).length;

                return (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors
                        ${isSelected 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground hover:bg-muted/50'
                        }`}
                    >
                      <span>{category}</span>
                      {itemCount > 0 && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {itemCount}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-background overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {selectedCategory && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{selectedCategory}</h2>
                    <div className="flex gap-2">
                      {selectedItems.size > 0 && (
                        <>
                          <Button 
                            onClick={() => setShowMoveDialog(true)}
                            size="sm"
                            variant="outline"
                          >
                            <MoveRight className="w-4 h-4 mr-2" />
                            Move Selected ({selectedItems.size})
                          </Button>
                          <Button 
                            onClick={deleteSelectedItems}
                            size="sm"
                            variant="destructive"
                          >
                            Delete Selected ({selectedItems.size})
                          </Button>
                        </>
                      )}
                      <Button onClick={() => addNewItem(selectedCategory)} size="sm">
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Header Row */}
                  {viewMode === 'simple' ? (
                    <div className="grid grid-cols-[40px,1fr,120px,100px,80px,50px] gap-4 px-4 py-2 bg-muted/50 rounded-t-lg font-medium text-sm border-b">
                      <div></div>
                      <div>Name</div>
                      <div>Total</div>
                      <div>Unit</div>
                      <div>Image</div>
                      <div></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[40px,1fr,80px,90px,90px,90px,90px,80px,80px,50px] gap-4 px-4 py-2 bg-muted/50 rounded-t-lg font-medium text-sm border-b">
                      <div></div>
                      <div>Name</div>
                      <div>Coverage</div>
                      <div>Labor</div>
                      <div>Material</div>
                      <div>Factor</div>
                      <div>Total</div>
                      <div>Unit</div>
                      <div>Image</div>
                      <div></div>
                    </div>
                  )}

                   {/* Items */}
                  <div className="border-x border-b rounded-b-lg">
                    {currentItems.length > 0 && (
                       currentItems.map((item) => (
                        viewMode === 'simple' ? (
                          <div 
                            key={item.id} 
                            className="grid grid-cols-[40px,1fr,120px,100px,80px,50px] gap-4 px-4 py-3 items-center hover:bg-muted/30"
                          >
                            <Checkbox 
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="Item description"
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={item.total}
                              onChange={(e) => updateItem(item.id, 'total', parseFloat(e.target.value) || 0)}
                              className="border-none bg-transparent"
                            />
                            <div className="text-sm text-muted-foreground">{item.unit}</div>
                            <button 
                              onClick={() => {
                                const imageUrl = item.picture || (itemType === 'shingles' ? getShinglesImage(item.name) : itemType === 'services' ? getServicesImage(item.category) : getMaterialsImage(item.category));
                                if (imageUrl) setViewingImage({ url: imageUrl, name: item.name });
                              }}
                              className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
                            >
                              <ItemImage 
                                src={item.picture || (itemType === 'shingles' ? getShinglesImage(item.name) : itemType === 'services' ? getServicesImage(item.category) : getMaterialsImage(item.category))}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="w-8 h-8 rounded hover:bg-muted transition-colors flex items-center justify-center"
                            >
                              <Settings className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            key={item.id} 
                            className="grid grid-cols-[40px,1fr,80px,90px,90px,90px,90px,80px,80px,50px] gap-4 px-4 py-3 items-center hover:bg-muted/30"
                          >
                            <Checkbox 
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="Item description"
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={item.coverage || 0}
                              onChange={(e) => updateItem(item.id, 'coverage', parseFloat(e.target.value) || 0)}
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={(item as any).labor || 0}
                              onChange={(e) => updateItem(item.id, 'labor', parseFloat(e.target.value) || 0)}
                              placeholder="Labor"
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={(item as any).material || 0}
                              onChange={(e) => updateItem(item.id, 'material', parseFloat(e.target.value) || 0)}
                              placeholder="Material"
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={(item as any).factor || 1}
                              onChange={(e) => updateItem(item.id, 'factor', parseFloat(e.target.value) || 1)}
                              placeholder="Factor"
                              className="border-none bg-transparent"
                            />
                            <Input
                              type="number"
                              value={item.total}
                              onChange={(e) => updateItem(item.id, 'total', parseFloat(e.target.value) || 0)}
                              className="border-none bg-transparent"
                            />
                            <div className="text-sm text-muted-foreground">{item.unit}</div>
                            <button 
                              onClick={() => {
                                const imageUrl = item.picture || (itemType === 'shingles' ? getShinglesImage(item.name) : itemType === 'services' ? getServicesImage(item.category) : getMaterialsImage(item.category));
                                if (imageUrl) setViewingImage({ url: imageUrl, name: item.name });
                              }}
                              className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
                            >
                              <ItemImage 
                                src={item.picture || (itemType === 'shingles' ? getShinglesImage(item.name) : itemType === 'services' ? getServicesImage(item.category) : getMaterialsImage(item.category))}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="w-8 h-8 rounded hover:bg-muted transition-colors flex items-center justify-center"
                            >
                              <Settings className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">View Image</DialogTitle>
          {viewingImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{viewingImage.name}</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setViewingImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg overflow-hidden bg-muted">
                <img 
                  src={viewingImage.url} 
                  alt={viewingImage.name} 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Material Item Settings Dialog */}
      <MaterialItemSettingsDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleItemSettingsSave}
      />

      {/* Factor Help Dialog */}
      <Dialog open={showFactorHelp} onOpenChange={setShowFactorHelp}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="text-2xl font-bold">FACTOR HELP</DialogTitle>
          <div className="space-y-6">
            <p className="text-foreground">
              The factor column is the markup of the combined costs (labor + material) of each item. The sum of 
              the item's costs are multiplied by the factor to reach the desired total charge price per unit.
            </p>

            <div>
              <p className="font-bold">EXAMPLE:</p>
              <p>1.00 (Labor Cost) + 1.00 (Material Cost) * 2.00 (Factor/Markup) = 4.00 (Total Price)</p>
            </div>

            <div>
              <p className="font-bold">NOTE:</p>
              <p>You can enter your desired total price per unit and the factor multiplier will adjust 
              automatically to meet the specified total.</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-muted/50 font-semibold">
                <div className="px-6 py-3 border-r">Desired Margin</div>
                <div className="px-6 py-3">Factor</div>
              </div>
              <div className="divide-y">
                {[
                  { margin: '15%', factor: '1.18' },
                  { margin: '20%', factor: '1.25' },
                  { margin: '25%', factor: '1.33' },
                  { margin: '30%', factor: '1.43' },
                  { margin: '35%', factor: '1.54' }
                ].map((row, index) => (
                  <div key={index} className="grid grid-cols-2">
                    <div className="px-6 py-3 border-r">{row.margin}</div>
                    <div className="px-6 py-3">{row.factor}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowFactorHelp(false)}>
                CLOSE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Items Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogTitle>Move Selected Items</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move {selectedItems.size} selected item(s) to a different category.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Category</label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat !== selectedCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={moveSelectedItems} disabled={!targetCategory}>
                Move Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
