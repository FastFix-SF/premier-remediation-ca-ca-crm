import React, { useState, useEffect } from 'react';
import { Trash2, Save, ImageIcon, AlertTriangle, Camera, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  InventoryItem, 
  useUpdateInventoryItem, 
  useUpdateQuantity,
  useDeleteInventoryItem, 
  useInventoryCategories,
  useAddInventoryCategory,
  useDeleteInventoryCategory,
  uploadInventoryPhoto 
} from '@/hooks/useInventory';
import { toast } from 'sonner';

interface InventoryItemDetailSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InventoryItemDetailSheet: React.FC<InventoryItemDetailSheetProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [quantity, setQuantity] = useState('0');
  const [requiresProtection, setRequiresProtection] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const updateItem = useUpdateInventoryItem();
  const updateQuantity = useUpdateQuantity();
  const deleteItem = useDeleteInventoryItem();
  const { data: categories = [] } = useInventoryCategories();
  const addCategory = useAddInventoryCategory();
  const deleteCategory = useDeleteInventoryCategory();

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity.toString());
      setRequiresProtection(item.requires_protection);
      setPhotoUrl(item.photo_url);
      setNotes(item.notes || '');
    }
  }, [item]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadInventoryPhoto(file);
      setPhotoUrl(url);
      toast.success('Foto subida');
    } catch (error) {
      toast.error('Error al subir foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!item || !name.trim()) return;

    const newQuantity = Math.max(0, parseInt(quantity) || 0);

    // Update item details
    await updateItem.mutateAsync({
      itemId: item.id,
      updates: {
        name: name.trim(),
        category,
        requires_protection: requiresProtection,
        photo_url: photoUrl,
        notes: notes.trim() || null,
      },
    });

    // Update quantity if changed
    if (newQuantity !== item.quantity) {
      await updateQuantity.mutateAsync({
        itemId: item.id,
        newQuantity,
        previousQuantity: item.quantity,
      });
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!item) return;
    await deleteItem.mutateAsync(item.id);
    onOpenChange(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) return;

    await addCategory.mutateAsync({
      key: newCategoryLabel.trim(),
      label: newCategoryLabel.trim(),
    });
    setCategory(newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '_'));
    setNewCategoryLabel('');
    setShowAddCategory(false);
  };

  if (!item) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Editar Artículo</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 space-y-5 overflow-y-auto">
            {/* Photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-lg bg-muted overflow-hidden relative">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button variant="outline" size="sm" asChild disabled={isUploading}>
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
                  </span>
                </Button>
              </label>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del artículo"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center">
                        <SelectItem value={cat.key} className="flex-1">
                          {cat.label}
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 mr-1 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (category === cat.key) {
                              setCategory('general');
                            }
                            deleteCategory.mutate(cat.id);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="item-notes">Notas</Label>
              <Textarea
                id="item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre este artículo..."
                rows={3}
              />
            </div>

            {/* Requires Protection */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <Label htmlFor="protection" className="cursor-pointer text-sm">
                  Requiere protección contra agua
                </Label>
              </div>
              <Switch
                id="protection"
                checked={requiresProtection}
                onCheckedChange={setRequiresProtection}
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="item-quantity">Cantidad</Label>
              <Input
                id="item-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center text-lg font-bold"
              />
            </div>
          </div>

          <DrawerFooter className="border-t gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!name.trim() || updateItem.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Artículo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará "{item.name}" permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category">Nombre de categoría</Label>
              <Input
                id="new-category"
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
