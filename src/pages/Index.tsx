
import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import Header from '../components/Header';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import TrustBadges from '../components/TrustBadges';
import { Button } from '../components/ui/button';

interface Product {
  id: string;
  title: string;
  img: string;
  gauge: string;
  color: string;
  support: string;
  unit: string;
  pricePerUnit: number | null;
  description: string;
}

interface ProductData {
  products: {
    roofing_panels: {
      id: string;
      title: string;
      panel_profile: string;
      finish_type: string;
      grade: string;
      gauge_range: string;
      cover_width_inches: string;
      colors_available: string;
      moisturelok_option: boolean;
      unit: string;
      category: string;
      image_url: string;
      price_per_unit?: number | null;
    }[];
  };
  metadata: any;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGauge, setFilterGauge] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSupport, setFilterSupport] = useState('');
  const [filterProductType, setFilterProductType] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, filterGauge, filterColor, filterSupport, filterProductType, sortBy]);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products from /data/products.json...');
      const response = await fetch('/data/products.json');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw response length:', text.length);
      console.log('First 200 characters:', text.substring(0, 200));
      
      const data: ProductData = JSON.parse(text);
      console.log('Parsed data:', data);
      
      // Transform the new JSON structure to match the expected Product interface
      const transformedProducts: Product[] = data.products.roofing_panels.map(item => ({
        id: item.id,
        title: item.title,
        img: item.image_url,
        gauge: item.gauge_range,
        color: item.colors_available,
        support: item.panel_profile, // Using panel_profile as support
        unit: item.unit,
        pricePerUnit: item.price_per_unit ?? null,
        description: `${item.finish_type} finish, Grade ${item.grade}. Cover width: ${item.cover_width_inches}".${item.moisturelok_option ? ' MoistureLok available.' : ''}`
      }));
      
      console.log('Number of products:', transformedProducts.length);
      console.log('Transformed products:', transformedProducts);
      
      setProducts(transformedProducts);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to load products: ${error.message}`);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = products.filter(product => {
      // Add null checks for title and description before calling toLowerCase()
      const title = product.title || '';
      const description = product.description || '';
      
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filterGauge) {
      filtered = filtered.filter(product => product.gauge === filterGauge);
    }

    if (filterColor) {
      filtered = filtered.filter(product => product.color === filterColor);
    }

    if (filterSupport) {
      filtered = filtered.filter(product => product.support === filterSupport);
    }

    if (filterProductType) {
      filtered = filtered.filter(product => {
        const title = product.title || '';
        return title.toLowerCase().includes(filterProductType.toLowerCase());
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.pricePerUnit || 0) - (b.pricePerUnit || 0);
        case 'price-high':
          return (b.pricePerUnit || 0) - (a.pricePerUnit || 0);
        case 'gauge':
          return a.gauge.localeCompare(b.gauge);
        default:
          return a.title.localeCompare(b.title);
      }
    });

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGauge('');
    setFilterColor('');
    setFilterSupport('');
    setFilterProductType('');
    setSortBy('title');
  };

  const uniqueGauges = [...new Set(products.map(p => p.gauge))].sort();
  const uniqueColors = [...new Set(products.map(p => p.color))].sort();
  const uniqueSupports = [...new Set(products.map(p => p.support))].sort();
  const productTypes = ['Max-Rib Ultra', 'Max-Rib II', 'Multi-Rib', 'R-Panel'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, filterGauge, filterColor, filterSupport, filterProductType, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground font-medium">Loading premium roofing materials...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-6 h-6 bg-destructive rounded-full"></div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Connection Error</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchProducts}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Mobile Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:hidden">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Hidden on mobile */}
          <div className="hidden lg:block">
            <FilterSidebar
              filterGauge={filterGauge}
              setFilterGauge={setFilterGauge}
              filterColor={filterColor}
              setFilterColor={setFilterColor}
              filterSupport={filterSupport}
              setFilterSupport={setFilterSupport}
              filterProductType={filterProductType}
              setFilterProductType={setFilterProductType}
              uniqueGauges={uniqueGauges}
              uniqueColors={uniqueColors}
              uniqueSupports={uniqueSupports}
              productTypes={productTypes}
              clearFilters={clearFilters}
              filteredCount={filteredProducts.length}
              totalCount={products.length}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredProducts.length}</span> of {products.length} materials
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-card border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-colors"
                >
                  <option value="title">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="gauge">Sort by Gauge</option>
                </select>

                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Empty States */}
        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Filter className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No materials found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Try adjusting your search criteria or filters to find the perfect roofing materials.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#146193] text-white rounded-xl font-medium hover:bg-[#125580] transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              Clear all filters
            </button>
          </div>
        )}

        {products.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-gray-600 mb-4">No materials available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
