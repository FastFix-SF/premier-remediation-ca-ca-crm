import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductCalculatorDialog from '@/components/ProductCalculatorDialog';
import AuthPromptModal from '@/components/store/AuthPromptModal';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight, FileText, Package, Building2, Home, Factory, Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Import 5V specific images
import fiveVResidentialHero from '@/assets/store/5v-residential-hero.jpg';
import fiveVCommercialTexas from '@/assets/store/5v-commercial-texas.jpg';
import fiveVPanelProfile from '@/assets/store/5v-panel-profile.png';
import fiveVPanelDimensions from '@/assets/store/5v-panel-dimensions.png';

// Import generic metal roof images as fallback
import heroImage from '@/assets/store/metal-roof-hero-1.jpg';
import commercialImage from '@/assets/store/metal-roof-commercial-1.jpg';
import industrialImage from '@/assets/store/metal-roof-industrial-1.jpg';
import residentialImage from '@/assets/store/metal-roof-residential-2.jpg';

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
  panelProfile?: string;
  finishType?: string;
  grade?: string;
  coverWidth?: string;
  colorsAvailable?: string;
  moisturelokOption?: boolean;
  category?: string;
}

interface ProductData {
  products: {
    roofing_panels: Array<{
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
      price_per_unit: number | null;
      notes?: string;
    }>;
  };
}

// Product-specific data for 5V panels
const productSpecificData: Record<string, {
  tagline: string;
  description: string;
  extendedDescription: string;
  heroImage: string;
  galleryImages: { src: string; alt: string }[];
  profileImage?: string;
  dimensionsImage?: string;
  specifications: { label: string; value: string }[];
  testing: { label: string; value: string }[];
  panelOptions: { label: string; value: string }[];
  installation: string[];
  manufacturingFacilities: string;
  notes: string[];
}> = {
  '5v': {
    tagline: '5V-Crimp is a classic exposed fastened panel with a subtle ½" rib height, providing timeless appeal for residential and agricultural projects.',
    description: 'Homeowners across the country are discovering that 5V metal roofing not only adds value to their home but provides beauty as well. McElroy\'s 5V panels are 24 inches wide and incorporate a classic design that adds beauty to any home. 5V is also commonly installed as an interior liner or accent panel.',
    extendedDescription: 'McElroy\'s 5V panel is available with fade and chalk resistant Kynar 500/PVDF coatings, which provides assurance that a roof retains its like-new beauty year-after-year.',
    heroImage: fiveVResidentialHero,
    galleryImages: [
      { src: fiveVResidentialHero, alt: 'Elegant farmhouse with 5V metal roofing' },
      { src: fiveVCommercialTexas, alt: 'Texas roadhouse with 5V galvalume roofing' },
    ],
    profileImage: fiveVPanelProfile,
    dimensionsImage: fiveVPanelDimensions,
    specifications: [
      { label: 'Minimum slope (with sealant)', value: '3:12' },
      { label: 'Cover Width', value: '24"' },
      { label: 'Rib Height', value: '½"' },
      { label: 'Rib Spacing', value: '12"' },
    ],
    testing: [
      { label: 'Fire Rating', value: 'Class A' },
      { label: 'Uplift Test', value: 'UL580 Class 90' },
      { label: 'Class 4 Impact Resistance', value: 'UL 2218' },
      { label: 'Fire Resistance', value: 'UL263' },
      { label: 'Florida State Approval', value: '1832.1' },
      { label: 'Texas Department of Insurance', value: 'RC-13' },
    ],
    panelOptions: [
      { label: 'Coating', value: 'Kynar 500® (PVDF)' },
      { label: 'Substrate', value: '26 GA Galvalume®; 29 Ga. Galvanized in bare only' },
    ],
    installation: [
      'Must be over solid decking',
    ],
    manufacturingFacilities: 'Produced in Ashburn, GA; Lockhart, TX',
    notes: [
      'Oil Canning is a natural occurrence in metal panels and is not a cause for panel rejection',
    ],
  },
};

// Default fallback data for products not specifically defined
const getDefaultProductData = (product: Product) => ({
  tagline: `${product.panelProfile} panel with ${product.finishType} finish for superior durability.`,
  description: `Our ${product.panelProfile} panels provide exceptional weather resistance and aesthetics, available in ${product.gauge} gauge with ${product.finishType} finish.`,
  extendedDescription: 'With an opportunity to choose from various profiles, McElroy Metal represents the industry\'s broadest selection of metal roofing systems.',
  heroImage: heroImage,
  galleryImages: [
    { src: commercialImage, alt: 'Commercial building with metal roofing' },
    { src: residentialImage, alt: 'Residential home with metal roof' },
    { src: industrialImage, alt: 'Industrial facility with metal panels' },
  ],
  specifications: [
    { label: 'Profile', value: product.panelProfile || 'N/A' },
    { label: 'Cover Width', value: `${product.coverWidth}"` },
    { label: 'Gauge', value: product.gauge },
  ],
  testing: [
    { label: 'Fire Rating', value: 'Class A' },
    { label: 'Uplift Test', value: 'UL580 Class 90, FM 4471' },
    { label: 'Impact Resistance', value: 'Class 4 - UL 2218' },
  ],
  panelOptions: [
    { label: 'Finish', value: product.finishType || 'N/A' },
    { label: 'MoistureLok', value: product.moisturelokOption ? 'Available' : 'Not Available' },
  ],
  installation: ['Follow manufacturer installation guidelines'],
  manufacturingFacilities: 'McElroy Metal Manufacturing',
  notes: [],
});

const StoreProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useStoreAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('/data/products.json');
        const data: ProductData = await response.json();
        
        const foundProduct = data.products.roofing_panels.find(p => p.id === id);
        
        if (foundProduct) {
          setProduct({
            id: foundProduct.id,
            title: foundProduct.title,
            img: foundProduct.image_url,
            gauge: foundProduct.gauge_range,
            color: foundProduct.colors_available !== 'N/A' && foundProduct.colors_available !== '—' 
              ? foundProduct.colors_available.split(',')[0].trim() 
              : 'Standard',
            support: foundProduct.moisturelok_option ? 'MoistureLok Available' : 'Standard',
            unit: foundProduct.unit,
            pricePerUnit: foundProduct.price_per_unit,
            description: `${foundProduct.panel_profile} panel with ${foundProduct.finish_type} finish. Grade: ${foundProduct.grade}. Cover width: ${foundProduct.cover_width_inches}".`,
            panelProfile: foundProduct.panel_profile,
            finishType: foundProduct.finish_type,
            grade: foundProduct.grade,
            coverWidth: foundProduct.cover_width_inches,
            colorsAvailable: foundProduct.colors_available,
            moisturelokOption: foundProduct.moisturelok_option,
            category: foundProduct.category,
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSelectProduct = () => {
    if (isAuthenticated) {
      setDialogOpen(true);
    } else {
      setAuthPromptOpen(true);
    }
  };

  // Determine which product-specific data to use
  const getProductKey = (productId: string): string | null => {
    if (productId?.toLowerCase().includes('5v')) return '5v';
    return null;
  };

  const productKey = id ? getProductKey(id) : null;
  const productData = productKey && productSpecificData[productKey] 
    ? productSpecificData[productKey] 
    : product ? getDefaultProductData(product) : null;

  const nextGalleryImage = () => {
    if (!productData) return;
    setCurrentGalleryIndex((prev) => (prev + 1) % productData.galleryImages.length);
  };

  const prevGalleryImage = () => {
    if (!productData) return;
    setCurrentGalleryIndex((prev) => (prev - 1 + productData.galleryImages.length) % productData.galleryImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Skeleton className="w-full h-[60vh]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product || !productData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you are looking for does not exist.</p>
          <Button onClick={() => navigate('/store')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  const is5VProduct = id?.toLowerCase().includes('5v');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${product.title} | Metal Roofing Panels | The Roofing Friend`}
        description={`${product.title} - ${product.panelProfile} metal roofing panel with ${product.finishType} finish. Available in ${product.gauge} gauge. Buy online from The Roofing Friend.`}
      />
      <Header />

      {/* Hero Image - Full Width */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={productData.heroImage}
          alt={`${product.title} installed on property`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Product Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {is5VProduct ? '5V Metal Roofing Panel' : product.title}
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground text-lg max-w-4xl mb-8">
          {productData.tagline}
        </p>

        {/* Great For Section */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Great for:</h2>
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 flex items-center justify-center border-2 border-muted-foreground/30 rounded-lg">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">Walls</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 flex items-center justify-center border-2 border-muted-foreground/30 rounded-lg">
                <Factory className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">Roofs</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 flex items-center justify-center border-2 border-muted-foreground/30 rounded-lg">
                <Home className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">Residential</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 flex items-center justify-center border-2 border-muted-foreground/30 rounded-lg">
                <Warehouse className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">Commercial</span>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="prose prose-lg max-w-none mb-8">
          <p className="text-foreground leading-relaxed text-lg">
            {productData.description}
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            {productData.extendedDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Button
            variant="outline"
            size="lg"
            className="border-2"
          >
            <FileText className="w-5 h-5 mr-2" />
            View Related Files
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-2"
          >
            <Package className="w-5 h-5 mr-2" />
            Build a Submittal Package
          </Button>
          <Button
            size="lg"
            onClick={handleSelectProduct}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {product.pricePerUnit ? 'Calculate & Order' : 'Request Quote'}
          </Button>
        </div>

        {/* Project Gallery */}
        <div className="mb-12">
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] max-w-3xl mx-auto">
            <img
              src={productData.galleryImages[currentGalleryIndex]?.src}
              alt={productData.galleryImages[currentGalleryIndex]?.alt}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Gallery Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevGalleryImage}
              className="rounded-full hover:bg-muted"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <span className="text-lg font-medium text-foreground">
              {currentGalleryIndex + 1}/{productData.galleryImages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextGalleryImage}
              className="rounded-full hover:bg-muted"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Renderings & Profiles Section */}
        {(productData as typeof productSpecificData['5v']).profileImage && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary mb-6">Renderings & Profiles</h2>
            <div className="flex flex-col items-center gap-8">
              {/* 3D Panel Rendering */}
              <div className="max-w-lg">
                <img
                  src={(productData as typeof productSpecificData['5v']).profileImage}
                  alt={`${product.title} 3D profile rendering`}
                  className="w-full h-auto"
                />
              </div>
              
              {/* Dimensions Diagram */}
              {(productData as typeof productSpecificData['5v']).dimensionsImage && (
                <div className="max-w-md">
                  <img
                    src={(productData as typeof productSpecificData['5v']).dimensionsImage}
                    alt={`${product.title} dimensions diagram`}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specifications & Details */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Specifications & Details</h2>
          <Card className="overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-0">
              <div className="text-center py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Details</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {productData.specifications.map((spec, index) => (
                    <tr key={index} className="border-b border-border last:border-b-0">
                      <td className="px-6 py-4 text-foreground font-medium">{spec.label}</td>
                      <td className="px-6 py-4 text-foreground">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Installation Section */}
        {productData.installation.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Installation</h2>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              {productData.installation.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Manufacturing Facilities */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Manufacturing Facilities</h2>
          <p className="text-foreground">{productData.manufacturingFacilities}</p>
        </div>

        {/* Notes */}
        {productData.notes.length > 0 && (
          <div className="mb-12 p-4 bg-muted rounded-lg">
            <h2 className="text-lg font-bold text-foreground mb-2">Note</h2>
            {productData.notes.map((note, index) => (
              <p key={index} className="text-muted-foreground italic">{note}</p>
            ))}
          </div>
        )}

        {/* Testing Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Testing</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  {productData.testing.map((test, index) => (
                    <tr key={index} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                      <td className="px-6 py-4 text-foreground font-medium w-1/2">{test.label}</td>
                      <td className="px-6 py-4 text-foreground">{test.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-3">
            For available Test Data, Section Properties or Load Tables, please visit our downloads section.
          </p>
        </div>

        {/* Panel Options */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Panel Options</h2>
          <div className="space-y-4">
            {productData.panelOptions.map((option, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-foreground">{option.label}</h3>
                <p className="text-muted-foreground">{option.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Files Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Specifications',
              'CAD Drawings',
              'PDF Drawings',
              'Color Charts',
              'Brochures/Flyers',
              'Finish and Substrate Warranties',
              'Metal Panel Care & Maintenance',
              'Product Data Sheets',
              'Product & Trim Information Books',
              'English Installation Manuals',
              'Product Approval Report / Miami-Dade Notice of Acceptance (NOA)',
              'Technical Bulletins / Approvals',
            ].map((file, index) => (
              <Button
                key={index}
                variant="link"
                className="justify-start text-primary hover:text-primary/80 h-auto py-1"
              >
                • {file}
              </Button>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-8 bg-muted rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Order?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Use our calculator to estimate your project needs and add items to your cart.
          </p>
          <Button
            size="lg"
            onClick={handleSelectProduct}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {product.pricePerUnit ? 'Calculate & Order' : 'Request Quote'}
          </Button>
        </div>
      </div>

      {/* Product Calculator Dialog */}
      {product && (
        <ProductCalculatorDialog
          product={{
            id: product.id,
            title: product.title,
            img: product.img,
            gauge: product.gauge,
            color: product.color,
            support: product.support,
            unit: product.unit,
            pricePerUnit: product.pricePerUnit,
            description: product.description,
          }}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        title="Sign In to Order"
        description="Please sign in to access the product calculator and place orders."
      />
    </div>
  );
};

export default StoreProductDetail;
