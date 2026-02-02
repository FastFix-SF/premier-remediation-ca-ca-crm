import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MATERIAL_CATEGORIES = [
  'None',
  'Roof Removal',
  'Roof Deck',
  'Lumber',
  'Underlayment',
  'Asphalt Shingles',
  'Low Slope',
  'Standing Seam',
  'Stone Coated',
  'Waterproofing',
  'Sheet Metal',
  'Gutters and Spouts',
  'Plumbing Roof Vents',
  'Flue & Chimney Caps',
  'Clay Tile',
  'Concrete Tile',
  'Attic Ventilation',
  'Exclusions',
  'Wood Shake / Synthetic',
  'Stucco Flashing',
  'Skylights',
  'Brava Tile',
  'Hip & Ridge',
  'Ice & Water Shield',
  'Eave Edge',
  'Rake Edge',
  'Roof Decking (Actual Square)',
  'Walking Pad',
  'Equipment Curb',
  'Valleys',
  'Flashing',
  'Sealants & Adhesives',
  'Fasteners',
  'Accessories',
];

interface MaterialItemSettings {
  id: string;
  name: string;
  orderDescription?: string;
  category: string;
  unitDescription?: string;
  total: number;
  unit: string;
  showInApp?: boolean;
  showOnEstimate?: boolean;
  showOnMaterialOrder?: boolean;
  showOnContract?: boolean;
  showOnLaborReport?: boolean;
  picture?: string;
}

interface MaterialItemSettingsDialogProps {
  item: MaterialItemSettings | null;
  open: boolean;
  onClose: () => void;
  onSave: (settings: MaterialItemSettings) => void;
}

export function MaterialItemSettingsDialog({
  item,
  open,
  onClose,
  onSave,
}: MaterialItemSettingsDialogProps) {
  const [orderDescription, setOrderDescription] = useState('');
  const [category, setCategory] = useState('None');
  const [unitDescription, setUnitDescription] = useState('');
  const [showInApp, setShowInApp] = useState(true);
  const [showOnEstimate, setShowOnEstimate] = useState(true);
  const [showOnMaterialOrder, setShowOnMaterialOrder] = useState(true);
  const [showOnContract, setShowOnContract] = useState(true);
  const [showOnLaborReport, setShowOnLaborReport] = useState(true);

  useEffect(() => {
    if (item) {
      setOrderDescription(item.orderDescription || '');
      setCategory(item.category || 'None');
      setUnitDescription(item.unitDescription || '');
      setShowInApp(item.showInApp ?? true);
      setShowOnEstimate(item.showOnEstimate ?? true);
      setShowOnMaterialOrder(item.showOnMaterialOrder ?? true);
      setShowOnContract(item.showOnContract ?? true);
      setShowOnLaborReport(item.showOnLaborReport ?? true);
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    
    const updatedItem: MaterialItemSettings = {
      ...item,
      orderDescription,
      category,
      unitDescription,
      showInApp,
      showOnEstimate,
      showOnMaterialOrder,
      showOnContract,
      showOnLaborReport,
    };

    console.log('Saving material item settings:', updatedItem);
    onSave(updatedItem);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            MATERIAL ITEM SETTINGS: {item.id}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Add Order Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
              Add Order Description
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Description for material orders</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              value={orderDescription}
              onChange={(e) => setOrderDescription(e.target.value)}
              placeholder="Enter order description"
              className="h-11 border-border"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
              Category (i.e. Trade)
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the material category or trade</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {MATERIAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Unit Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
              Add Unit Description
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Unit of measurement description</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              value={unitDescription}
              onChange={(e) => setUnitDescription(e.target.value)}
              placeholder="Each"
              className="h-11 border-border"
            />
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-semibold text-foreground">
              Visibility Settings
            </h3>

            <div className="space-y-3">
              {/* Show In the App */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-in-app" className="text-base font-normal text-foreground cursor-pointer">
                  Show In the App
                </Label>
                <Switch
                  id="show-in-app"
                  checked={showInApp}
                  onCheckedChange={setShowInApp}
                />
              </div>

              {/* Show On Estimate */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-on-estimate" className="text-base font-normal text-foreground cursor-pointer">
                  Show On Estimate
                </Label>
                <Switch
                  id="show-on-estimate"
                  checked={showOnEstimate}
                  onCheckedChange={setShowOnEstimate}
                />
              </div>

              {/* Show On Material Order */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-on-material-order" className="text-base font-normal text-foreground cursor-pointer">
                  Show On Material Order
                </Label>
                <Switch
                  id="show-on-material-order"
                  checked={showOnMaterialOrder}
                  onCheckedChange={setShowOnMaterialOrder}
                />
              </div>

              {/* Show On Contract */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-on-contract" className="text-base font-normal text-foreground cursor-pointer">
                  Show On Contract
                </Label>
                <Switch
                  id="show-on-contract"
                  checked={showOnContract}
                  onCheckedChange={setShowOnContract}
                />
              </div>

              {/* Show On Labor Report */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-on-labor-report" className="text-base font-normal text-foreground cursor-pointer">
                  Show On Labor Report
                </Label>
                <Switch
                  id="show-on-labor-report"
                  checked={showOnLaborReport}
                  onCheckedChange={setShowOnLaborReport}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={onClose} className="min-w-24">
            Cancel
          </Button>
          <Button onClick={handleSave} className="min-w-24">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
