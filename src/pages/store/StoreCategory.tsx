import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Grid, List, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  panelProfile: string;
  category: string;
}

interface CategoryInfo {
  title: string;
  description: string;
  advantages: string[];
  seoTitle: string;
  seoDescription: string;
}

const categoryData: Record<string, CategoryInfo> = {
  'exposed-fastener': {
    title: 'Exposed Fastener Panels',
    description: 'Exposed fastener metal roofing panels are a cost-effective and durable solution for residential, commercial, and agricultural buildings. With quick installation and easy maintenance, these panels provide excellent weather protection.',
    advantages: [
      'Quick and easy installation',
      'Cost-effective roofing solution',
      'Easy panel replacement if damaged',
      'Excellent for agricultural and commercial buildings',
      'Wide variety of colors and finishes',
    ],
    seoTitle: 'Exposed Fastener Metal Roofing Panels | The Roofing Friend',
    seoDescription: 'Browse our selection of exposed fastener metal roofing panels. Cost-effective, durable, and easy to install. Perfect for residential, commercial, and agricultural buildings.',
  },
  'standing-seam': {
    title: 'Standing Seam Panels',
    description: 'Standing seam metal roofing offers superior weather protection with concealed fasteners. These premium panels provide a sleek, modern appearance and exceptional durability for residential and commercial projects.',
    advantages: [
      'Concealed fastener system',
      'Superior weather protection',
      'Modern architectural appearance',
      'Excellent for low-slope roofs',
      'Long-lasting performance',
    ],
    seoTitle: 'Standing Seam Metal Roofing Panels | The Roofing Friend',
    seoDescription: 'Premium standing seam metal roofing panels with concealed fasteners. Modern appearance, superior weather protection, and exceptional durability.',
  },
  'r-panel': {
    title: 'R-Panel Metal Roofing',
    description: 'R-Panel is one of the most popular exposed fastener profiles, perfect for commercial, industrial, and agricultural buildings. With a 1.25" rib height and various widths available.',
    advantages: [
      'Industry-standard commercial profile',
      'Excellent structural performance',
      'Multiple gauge options available',
      'Wide color selection',
      'Ideal for long-span applications',
    ],
    seoTitle: 'R-Panel Metal Roofing Panels | The Roofing Friend',
    seoDescription: 'Shop R-Panel metal roofing - the industry standard for commercial and agricultural buildings. Multiple gauges and colors available.',
  },
  'max-rib': {
    title: 'Max-Rib Metal Panels',
    description: 'Max-Rib panels from McElroy Metal offer exceptional coverage with a 38" panel width. Available in multiple finishes including painted and Galvalume options.',
    advantages: [
      'Wide 38" coverage width',
      'MoistureLok sealant option',
      'Multiple finish options',
      'Economical installation',
      'Great for residential and commercial',
    ],
    seoTitle: 'Max-Rib Metal Roofing Panels | The Roofing Friend',
    seoDescription: 'Max-Rib metal panels with 38" coverage. Available with MoistureLok sealant option. Perfect for residential and commercial projects.',
  },
  'all': {
    title: 'All Metal Roofing Panels',
    description: 'Browse our complete selection of McElroy Metal roofing panels. From exposed fastener to standing seam systems, we have the right panel for your project.',
    advantages: [
      'Premium McElroy Metal quality',
      'Wide selection of profiles and colors',
      'Residential and commercial options',
      'Fast Bay Area delivery',
      'Expert support included',
    ],
    seoTitle: 'Metal Roofing Panels | The Roofing Friend Store',
    seoDescription: 'Complete selection of McElroy Metal roofing panels. Exposed fastener, standing seam, and specialty panels for residential and commercial projects.',
  },
};

// Map panel profiles to categories
const profileToCategory: Record<string, string> = {
  '5V': 'exposed-fastener',
  'Max-Rib': 'max-rib',
  'Max-Rib II': 'max-rib',
  'Max-Rib Ultra': 'max-rib',
  'M-Cor': 'r-panel',
  'Mega-Rib 7.2': 'r-panel',
  'Mesa': 'r-panel',
  'Mesa Ultra': 'r-panel',
  'Mini-Rib': 'exposed-fastener',
  'Medallion-Lok': 'standing-seam',
  'Met-Seam': 'standing-seam',
  'Met-Tile': 'standing-seam',
  'Multi-Rib': 'r-panel',
  'R-Panel': 'r-panel',
};

const StoreCategory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoryInfo = categoryData[category || 'all'] || categoryData['all'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/data/products.json');
        const data = await response.json();
        
        const allProducts: Product[] = data.products.roofing_panels.map((p: any) => ({
          id: p.id,
          title: p.title,
          img: p.image_url,
          gauge: p.gauge_range,
          color: p.colors_available !== 'N/A' && p.colors_available !== '—' 
            ? p.colors_available.split(',')[0].trim() 
            : 'Standard',
          support: p.moisturelok_option ? 'MoistureLok' : 'Standard',
          unit: p.unit,
          pricePerUnit: p.price_per_unit,
          description: `${p.panel_profile} panel with ${p.finish_type} finish`,
          panelProfile: p.panel_profile,
          category: profileToCategory[p.panel_profile] || 'exposed-fastener',
        }));

        // Filter by category
        const filtered = category === 'all' || !category
          ? allProducts
          : allProducts.filter(p => p.category === category);

        setProducts(filtered);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const uniqueProfiles = useMemo(() => {
    return [...new Set(products.map(p => p.panelProfile))];
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-20 w-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={categoryInfo.seoTitle}
        description={categoryInfo.seoDescription}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/store')}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Button>

        {/* Category Hero */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {categoryInfo.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {categoryInfo.description}
          </p>
        </div>

        {/* Advantages */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Key Advantages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryInfo.advantages.map((advantage, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-foreground">{advantage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Profiles Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Panel Profiles:
          </span>
          {uniqueProfiles.map(profile => (
            <Badge key={profile} variant="secondary">
              {profile}
            </Badge>
          ))}
        </div>

        {/* View Toggle & Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
            <Button onClick={() => navigate('/store')} className="mt-4">
              Browse All Products
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-4"
          }>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreCategory;
