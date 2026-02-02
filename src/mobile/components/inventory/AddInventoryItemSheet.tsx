import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  InventoryCategory,
  InventoryUnitType,
  UNIT_TYPE_OPTIONS,
  useAddInventoryItem, 
  useInventoryCategories,
  useAddInventoryCategory,
  uploadInventoryPhoto 
} from '@/hooks/useInventory';
import { toast } from 'sonner';

interface AddInventoryItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: InventoryCategory;
}

export const AddInventoryItemSheet: React.FC<AddInventoryItemSheetProps> = ({
  open,
  onOpenChange,
  defaultCategory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [category, setCategory] = useState<InventoryCategory>(defaultCategory);
  const [unitType, setUnitType] = useState<InventoryUnitType>('unit');
  const [requiresProtection, setRequiresProtection] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const addItem = useAddInventoryItem();
  const { data: categories = [] } = useInventoryCategories();
  const addCategory = useAddInventoryCategory();

  const resetForm = () => {
    setName('');
    setQuantity('0');
    setCategory(defaultCategory);
    setUnitType('unit');
    setRequiresProtection(false);
    setNotes('');
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Por favor ingresa un nombre');
      return;
    }

    setIsUploading(true);
    try {
      let photo_url: string | undefined;
      
      if (photoFile) {
        photo_url = await uploadInventoryPhoto(photoFile);
      }

      await addItem.mutateAsync({
        name: name.trim(),
        quantity: parseInt(quantity) || 0,
        category,
        unit_type: unitType,
        requires_protection: requiresProtection,
        photo_url,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) return;

    const newKey = newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '_');
    
    const result = await addCategory.mutateAsync({
      key: newKey,
      label: newCategoryLabel.trim(),
    });
    
    // Use the key returned from the database to ensure consistency
    setCategory(result.key);
    setNewCategoryLabel('');
    setShowAddCategory(false);
  };

  // Update category when sheet opens with new defaultCategory
  React.useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
    }
  }, [open, defaultCategory]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Agregar Artículo</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 overflow-y-auto pb-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex gap-3">
                {photoPreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 w-24 flex-col gap-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs">Cámara</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 w-24 flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Galería</span>
                    </Button>
                  </>
                )}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre del artículo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="flex gap-2">
                <Select value={category} onValueChange={(v) => setCategory(v as InventoryCategory)}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Unit Type */}
            <div className="space-y-2">
              <Label>Tipo de Unidad</Label>
              <Select value={unitType} onValueChange={(v) => setUnitType(v as InventoryUnitType)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.labelEs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad Inicial</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notas</Label>
              <Textarea
                id="add-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre este artículo..."
                rows={2}
              />
            </div>

            {/* Requires Protection */}
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">Proteger del agua</p>
                  <p className="text-xs text-muted-foreground">Mostrar advertencia</p>
                </div>
              </div>
              <Switch
                checked={requiresProtection}
                onCheckedChange={setRequiresProtection}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleSubmit}
              disabled={isUploading || addItem.isPending}
            >
              {(isUploading || addItem.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Agregar Artículo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-cat">Nombre de categoría</Label>
              <Input
                id="new-cat"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Ej: Herramientas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddCategory(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategoryLabel.trim() || addCategory.isPending}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
