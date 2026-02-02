import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { InventoryItemCard } from '../components/inventory/InventoryItemCard';
import { AddInventoryItemSheet } from '../components/inventory/AddInventoryItemSheet';
import { useInventoryItems, useInventoryCategories, InventoryCategory } from '@/hooks/useInventory';
const CATEGORY_COLORS: Record<string, string> = {
  garage: 'from-blue-500 to-blue-600',
  standing_seam: 'from-emerald-500 to-emerald-600',
  shingles: 'from-orange-500 to-orange-600',
  general: 'from-purple-500 to-purple-600'
};
const getGradient = (key: string) => {
  return CATEGORY_COLORS[key] || 'from-slate-500 to-slate-600';
};
export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('garage');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const {
    data: categories = []
  } = useInventoryCategories();
  const {
    data: items = [],
    isLoading
  } = useInventoryItems(activeCategory);

  // Set first category as active when categories load
  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.key === activeCategory)) {
      setActiveCategory(categories[0].key);
    }
  }, [categories, activeCategory]);
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCategoryInfo = categories.find(c => c.key === activeCategory);
  return <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getGradient(activeCategory)} text-white p-4 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/mobile/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Inventario</h1>
            <p className="text-sm opacity-90">{items.length} artículos en {activeCategoryInfo?.label}</p>
          </div>
          <Button size="icon" onClick={() => setIsAddSheetOpen(true)} className="bg-white/20 hover:bg-white/30 text-destructive-foreground">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
          <Input placeholder="Buscar artículos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white/20 border-none text-white placeholder:text-white/70 h-11" />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as InventoryCategory)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start overflow-x-auto p-1 h-auto bg-muted/50 rounded-none border-b">
          {categories.map(cat => <TabsTrigger key={cat.key} value={cat.key} className="flex-shrink-0 px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
              {cat.label}
            </TabsTrigger>)}
        </TabsList>

        {categories.map(cat => <TabsContent key={cat.key} value={cat.key} className="flex-1 p-4 space-y-3 mt-0">
            {isLoading ? <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div> : filteredItems.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">No hay artículos</p>
                <p className="text-sm">
                  {searchQuery ? 'Intenta otra búsqueda' : 'Agrega tu primer artículo'}
                </p>
                <Button className="mt-4" onClick={() => setIsAddSheetOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div> : filteredItems.map(item => <InventoryItemCard key={item.id} item={item} />)}
          </TabsContent>)}
      </Tabs>

      {/* Add Item Sheet */}
      <AddInventoryItemSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} defaultCategory={activeCategory} />
    </div>;
};