import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface MaterialItem {
  id: string;
  name: string;
  image_url: string;
  unit: string;
  source_type: string;
  quantity: number;
  unit_cost: number;
  markup_pct: number;
  total: number;
  category?: string;
  picture?: string;
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
  ids?: string[]; // For grouped materials
}

interface MaterialDetailsDialogProps {
  material: MaterialItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedMaterial: MaterialItem) => void;
}

export const MaterialDetailsDialog: React.FC<MaterialDetailsDialogProps> = ({
  material,
  open,
  onClose,
  onSave,
}) => {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showOnEstimate, setShowOnEstimate] = useState(true);
  const [showOnContract, setShowOnContract] = useState(true);
  const [showOnMaterialOrder, setShowOnMaterialOrder] = useState(false);
  const [showOnLaborReport, setShowOnLaborReport] = useState(true);
  const [orderDescription, setOrderDescription] = useState('');
  const [coverage, setCoverage] = useState(1);
  const [markupPct, setMarkupPct] = useState(15);
  const [factor, setFactor] = useState(1);
  const [materialTabTotal, setMaterialTabTotal] = useState(0);
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (material) {
      setDescription(material.orderDescription || material.name || '');
      setQuantity(material.quantity || 0);
      
      // Get values from Materials tab
      const laborFromMaterials = material.labor || 0;
      const materialFromMaterials = material.material || 0;
      const coverageFromMaterials = material.coverage || 1;
      const factorFromMaterials = material.factor || 1;
      const totalFromMaterials = (material as any).total || 0; // Total field from Materials tab
      const unitFromMaterials = material.unit || '';
      
      setLaborCost(laborFromMaterials);
      setMaterialCost(materialFromMaterials);
      
      // Total Price Per Unit = Labor + Material
      const calculatedTotalPrice = laborFromMaterials + materialFromMaterials;
      setTotalPrice(calculatedTotalPrice || material.unit_cost || 0);
      
      setCoverage(coverageFromMaterials);
      setFactor(factorFromMaterials);
      setMaterialTabTotal(totalFromMaterials);
      setUnit(unitFromMaterials);
      setShowOnEstimate(material.show_on_estimate ?? true);
      setShowOnContract(material.show_on_contract ?? true);
      setShowOnMaterialOrder(material.show_on_material_order ?? false);
      setShowOnLaborReport(material.show_on_labor_report ?? true);
      setOrderDescription(material.orderDescription || material.name || '');
      setMarkupPct(material.markup_pct || 15);
    }
  }, [material]);

  const handleSave = () => {
    if (!material) return;

    const baseCost = totalPrice * quantity;
    const total = baseCost + (baseCost * markupPct / 100);

    const updatedMaterial: MaterialItem & { ids?: string[] } = {
      ...material,
      orderDescription: description,
      quantity,
      labor: laborCost,
      material: materialCost,
      unit_cost: totalPrice,
      total,
      show_on_estimate: showOnEstimate,
      show_on_contract: showOnContract,
      show_on_material_order: showOnMaterialOrder,
      show_on_labor_report: showOnLaborReport,
      coverage,
      markup_pct: markupPct,
      ids: material.ids, // Preserve the ids array if this is a grouped material
    };

    onSave(updatedMaterial);
    onClose();
  };

  if (!material) return null;

  const baseCost = totalPrice * quantity;
  const total = baseCost + (baseCost * markupPct / 100);
  const grossProfitMargin = baseCost > 0 ? ((total - baseCost) / total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="quantity" className="text-sm">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty input for user to type, otherwise parse as integer
                  if (value === '') {
                    setQuantity(0);
                  } else {
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setQuantity(parsed);
                    }
                  }
                }}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="labor" className="text-sm">Labor Cost Per Unit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="labor"
                  type="number"
                  className="pl-7 h-9"
                  value={laborCost}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="material" className="text-sm">Material Cost Per Unit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="material"
                  type="number"
                  className="pl-7 h-9"
                  value={materialCost}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="totalPrice" className="text-sm">Total Price Per Unit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="totalPrice"
                  type="number"
                  className="pl-7 h-9"
                  value={totalPrice}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="markup" className="text-sm">Markup %</Label>
              <Input
                id="markup"
                type="number"
                min="0"
                max="100"
                step="1"
                value={markupPct}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setMarkupPct(0);
                  } else {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                      setMarkupPct(parsed);
                    }
                  }
                }}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="coverage" className="text-sm">Coverage</Label>
              <Input
                id="coverage"
                type="number"
                value={coverage}
                readOnly
                disabled
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="factor" className="text-sm">Factor</Label>
              <Input
                id="factor"
                type="number"
                value={factor}
                readOnly
                disabled
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="materialTabTotal" className="text-sm">Total (from Materials Tab)</Label>
              <Input
                id="materialTabTotal"
                type="number"
                value={materialTabTotal}
                readOnly
                disabled
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="unit" className="text-sm">Unit</Label>
              <Input
                id="unit"
                type="text"
                value={unit}
                readOnly
                disabled
                className="h-9"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-2 rounded">
            <p className="text-sm font-medium">
              Current Gross Profit Margin: {grossProfitMargin.toFixed(0)}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="showEstimate" className="text-sm">Show on Estimate</Label>
              <Switch
                id="showEstimate"
                checked={showOnEstimate}
                onCheckedChange={setShowOnEstimate}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showContract" className="text-sm">Show on Contract</Label>
              <Switch
                id="showContract"
                checked={showOnContract}
                onCheckedChange={setShowOnContract}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showMaterialOrder" className="text-sm">Show on Material Order</Label>
              <Switch
                id="showMaterialOrder"
                checked={showOnMaterialOrder}
                onCheckedChange={setShowOnMaterialOrder}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showLaborReport" className="text-sm">Show on Labor Report</Label>
              <Switch
                id="showLaborReport"
                checked={showOnLaborReport}
                onCheckedChange={setShowOnLaborReport}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="orderDescription" className="text-sm">Material Order Description</Label>
            <Input
              id="orderDescription"
              value={orderDescription}
              onChange={(e) => setOrderDescription(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            CANCEL
          </Button>
          <Button onClick={handleSave}>
            SAVE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
