import React, { useState } from 'react';
import { Minus, Plus, AlertTriangle, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, useUpdateQuantity } from '@/hooks/useInventory';
import { InventoryItemDetailSheet } from './InventoryItemDetailSheet';

interface InventoryItemCardProps {
  item: InventoryItem;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item }) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [detailOpen, setDetailOpen] = useState(false);
  const updateQuantity = useUpdateQuantity();

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail sheet
    const newQuantity = Math.max(0, localQuantity + delta);
    setLocalQuantity(newQuantity);
    
    updateQuantity.mutate({
      itemId: item.id,
      newQuantity,
      previousQuantity: item.quantity,
    });
  };

  // Sync local state when server data changes
  React.useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const isLowStock = localQuantity <= 3 && localQuantity > 0;
  const isOutOfStock = localQuantity === 0;

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer active:bg-muted/50 transition-colors"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Photo */}
            <div className="w-20 h-20 flex-shrink-0 bg-muted relative">
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              {item.requires_protection && (
                <div className="absolute top-1 left-1">
                  <Badge 
                    variant="secondary" 
                    className="bg-amber-100 text-amber-800 text-[10px] px-1 py-0 h-5"
                  >
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    Agua
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex items-center justify-between min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                {isOutOfStock && (
                  <span className="text-xs text-destructive font-medium">Sin stock</span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="text-xs text-amber-600 font-medium">Stock bajo</span>
                )}
              </div>

              {/* Quantity Controls - Smaller */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => handleQuantityChange(-1, e)}
                  disabled={localQuantity === 0 || updateQuantity.isPending}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                
                <div className={`w-8 text-center font-bold text-sm ${
                  isOutOfStock ? 'text-destructive' : 
                  isLowStock ? 'text-amber-600' : 
                  'text-foreground'
                }`}>
                  {localQuantity}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => handleQuantityChange(1, e)}
                  disabled={updateQuantity.isPending}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <InventoryItemDetailSheet
        item={item}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};
