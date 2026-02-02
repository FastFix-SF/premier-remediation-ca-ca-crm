import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  qty: number;
  feet: number;
  inches: number;
  fraction: number;
  pieceMark: string;
}

interface Product {
  id: string;
  title: string;
  img: string;
  unit: string;
  pricePerUnit: number;
}

interface PanelCalculatorProps {
  product: Product;
  onAddToCart: () => void;
}

const FRACTION_OPTIONS = [
  { value: 0, label: '—' },
  { value: 1, label: '1/16' },
  { value: 2, label: '1/8' },
  { value: 3, label: '3/16' },
  { value: 4, label: '1/4' },
  { value: 5, label: '5/16' },
  { value: 6, label: '3/8' },
  { value: 7, label: '7/16' },
  { value: 8, label: '1/2' },
  { value: 9, label: '9/16' },
  { value: 10, label: '5/8' },
  { value: 11, label: '11/16' },
  { value: 12, label: '3/4' },
  { value: 13, label: '13/16' },
  { value: 14, label: '7/8' },
  { value: 15, label: '15/16' },
];

const createEmptyLine = (): LineItem => ({
  id: crypto.randomUUID(),
  qty: 1,
  feet: 0,
  inches: 0,
  fraction: 0,
  pieceMark: '',
});

const PanelCalculator: React.FC<PanelCalculatorProps> = ({ product, onAddToCart }) => {
  const { addToCart } = useCart();
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine()]);

  const calculateLengthPerPanel = (line: LineItem): number => {
    return line.feet + (line.inches / 12) + (line.fraction / 16 / 12);
  };

  const calculateLineTotalLF = (line: LineItem): number => {
    return line.qty * calculateLengthPerPanel(line);
  };

  const calculateLinePrice = (line: LineItem): number => {
    return calculateLineTotalLF(line) * product.pricePerUnit;
  };

  const getTotalLF = (): number => {
    return lines.reduce((sum, line) => sum + calculateLineTotalLF(line), 0);
  };

  const getTotalPrice = (): number => {
    return lines.reduce((sum, line) => sum + calculateLinePrice(line), 0);
  };

  const updateLine = (id: string, field: keyof LineItem, value: number | string) => {
    setLines(prev => prev.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const addLine = () => {
    setLines(prev => [...prev, createEmptyLine()]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(prev => prev.filter(line => line.id !== id));
    }
  };

  const handleAddToCart = () => {
    const validLines = lines.filter(line => line.qty > 0 && calculateLengthPerPanel(line) > 0);
    
    if (validLines.length === 0) {
      toast.error("Please enter valid measurements");
      return;
    }

    const cartLines = validLines.map(line => ({
      qty: line.qty,
      feet: line.feet,
      inches: line.inches,
      fraction: line.fraction,
      pieceMark: line.pieceMark,
      lengthPerPanel: calculateLengthPerPanel(line),
      totalLF: calculateLineTotalLF(line),
      linePrice: calculateLinePrice(line),
    }));

    const cartItem = {
      productId: product.id,
      title: product.title,
      img: product.img,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      quantity: getTotalLF(),
      totalPrice: getTotalPrice(),
      lines: cartLines,
    };

    addToCart(cartItem);
    
    toast.success("Added to cart!", {
      description: `${product.title} has been added to your cart.`,
      duration: 2000,
    });

    onAddToCart();
  };

  const formatLength = (line: LineItem): string => {
    const feet = line.feet;
    const inches = line.inches;
    const fraction = FRACTION_OPTIONS.find(f => f.value === line.fraction);
    
    let result = `${feet}'`;
    if (inches > 0 || line.fraction > 0) {
      result += ` ${inches}`;
      if (line.fraction > 0 && fraction) {
        result += ` ${fraction.label}`;
      }
      result += '"';
    }
    return result;
  };

  return (
    <div className="border-t pt-8">
      <h3 className="text-xl font-bold text-foreground mb-4">Configure Your Order</h3>
      
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <div className="col-span-1">Qty</div>
        <div className="col-span-1">Feet</div>
        <div className="col-span-1">Inches</div>
        <div className="col-span-2">Fraction</div>
        <div className="col-span-2">Piece Mark</div>
        <div className="col-span-2 text-right">Ext. Qty (LF)</div>
        <div className="col-span-2 text-right">Ext. Price</div>
        <div className="col-span-1"></div>
      </div>

      {/* Line Items */}
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div key={line.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/30 rounded-lg border border-border">
            {/* Mobile Labels */}
            <div className="col-span-12 md:hidden text-xs text-muted-foreground mb-1">
              Line {index + 1}
            </div>
            
            {/* Qty */}
            <div className="col-span-3 md:col-span-1">
              <label className="md:hidden text-xs text-muted-foreground">Qty</label>
              <input
                type="number"
                min="1"
                value={line.qty}
                onChange={(e) => updateLine(line.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-2 py-2 text-sm border border-input rounded bg-background text-foreground text-center"
              />
            </div>

            {/* Feet */}
            <div className="col-span-3 md:col-span-1">
              <label className="md:hidden text-xs text-muted-foreground">Feet</label>
              <input
                type="number"
                min="0"
                value={line.feet}
                onChange={(e) => updateLine(line.id, 'feet', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2 py-2 text-sm border border-input rounded bg-background text-foreground text-center"
              />
            </div>

            {/* Inches */}
            <div className="col-span-3 md:col-span-1">
              <label className="md:hidden text-xs text-muted-foreground">Inches</label>
              <input
                type="number"
                min="0"
                max="11"
                value={line.inches}
                onChange={(e) => updateLine(line.id, 'inches', Math.min(11, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-2 py-2 text-sm border border-input rounded bg-background text-foreground text-center"
              />
            </div>

            {/* Fraction */}
            <div className="col-span-3 md:col-span-2">
              <label className="md:hidden text-xs text-muted-foreground">Fraction</label>
              <select
                value={line.fraction}
                onChange={(e) => updateLine(line.id, 'fraction', parseInt(e.target.value))}
                className="w-full px-2 py-2 text-sm border border-input rounded bg-background text-foreground"
              >
                {FRACTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Piece Mark */}
            <div className="col-span-6 md:col-span-2">
              <label className="md:hidden text-xs text-muted-foreground">Piece Mark</label>
              <input
                type="text"
                value={line.pieceMark}
                onChange={(e) => updateLine(line.id, 'pieceMark', e.target.value)}
                placeholder="Optional"
                className="w-full px-2 py-2 text-sm border border-input rounded bg-background text-foreground"
              />
            </div>

            {/* Ext. Qty (LF) */}
            <div className="col-span-3 md:col-span-2 text-right">
              <label className="md:hidden text-xs text-muted-foreground">Ext. Qty</label>
              <div className="py-2 text-sm font-medium text-foreground">
                {calculateLineTotalLF(line).toFixed(2)} LF
              </div>
            </div>

            {/* Ext. Price */}
            <div className="col-span-3 md:col-span-2 text-right">
              <label className="md:hidden text-xs text-muted-foreground">Ext. Price</label>
              <div className="py-2 text-sm font-semibold text-primary">
                ${calculateLinePrice(line).toFixed(2)}
              </div>
            </div>

            {/* Delete Button */}
            <div className="col-span-12 md:col-span-1 flex justify-end">
              <button
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 1}
                className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove line"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Another Length Button */}
      <button
        onClick={addLine}
        className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Another Length
      </button>

      {/* Summary Section */}
      <div className="mt-6 bg-primary/5 p-6 rounded-lg border border-primary/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Price per LF:</span>
          <span className="font-medium text-foreground">${product.pricePerUnit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Total Linear Feet:</span>
          <span className="font-medium text-foreground">{getTotalLF().toFixed(2)} LF</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Number of Panels:</span>
          <span className="font-medium text-foreground">{lines.reduce((sum, line) => sum + line.qty, 0)}</span>
        </div>
        <hr className="my-3 border-border" />
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-foreground">Subtotal:</span>
          <span className="text-2xl font-bold text-primary">${getTotalPrice().toFixed(2)}</span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={getTotalLF() <= 0}
        className="mt-6 w-full bg-accent text-accent-foreground py-3 px-6 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add to Cart
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PanelCalculator;
