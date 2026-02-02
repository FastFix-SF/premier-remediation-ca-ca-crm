import React from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Mail, Star, Shield, Truck, Award, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import SEOHead from '../components/SEOHead';
import { LocalBusinessStructuredData, ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import Breadcrumbs from '../components/Breadcrumbs';
interface LocationData {
  name: string;
  slug: string;
  fullName: string;
  description: string;
  population: string;
  keyAreas: string[];
  services: string[];
  testimonial: {
    name: string;
    text: string;
    rating: number;
    project: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// City-specific image mapping
const getCityImage = (slug: string): string => {
  const imageMap: Record<string, string> = {
    'san-francisco': '/lovable-uploads/0ff36cf7-372c-449f-9bca-52afe3c60788.png',
    'santa-clara': '/lovable-uploads/2fc6c2fb-566b-4583-8603-9c50250ac72e.png',
    'walnut-creek': '/lovable-uploads/e32f3b68-afff-4e34-ad9f-677737ef64d9.png',
    'tiburon': '/lovable-uploads/d2cfa2fb-47cb-4697-8e3f-70fa16d38b52.png',
    'santa-cruz': '/lovable-uploads/86b90df1-efd6-414b-b031-d245c49c67f3.png',
    'santa-rosa': '/lovable-uploads/c273371c-c036-4c60-9353-7a61495ef41b.png',
    'modesto': '/lovable-uploads/89b3586f-7ff9-4109-984e-d58bd6ae40df.png',
    'alameda-county': '/lovable-uploads/fa871e2e-df53-42cc-b446-c90fb8d57a4e.png',
    'san-anselmo': '/lovable-uploads/10c13837-207c-4fb5-8499-cf35502a0372.png',
    'kentfield': '/lovable-uploads/eb4de00e-10cf-45a6-8e3b-bd4d76b1bfec.png',
    'contra-costa': '/lovable-uploads/5adbe72d-e67a-4421-b76a-f077f28fd1a0.png',
    'petaluma': '/lovable-uploads/03902760-7765-4751-946f-a327c25fa662.png',
    'los-gatos': '/lovable-uploads/67672a0a-4f98-4638-b03a-8e118a42bc94.png'
  };
  return imageMap[slug] || '/src/assets/modern-metal-roof-home.jpg'; // Default fallback
};
const locationData: Record<string, LocationData> = {
  'san-francisco': {
    name: 'San Francisco',
    slug: 'san-francisco',
    fullName: 'San Francisco, California',
    description: 'Premier metal roofing services in the heart of San Francisco, serving residential and commercial properties with expert craftsmanship and premium materials.',
    population: '875,000+',
    keyAreas: ['Mission District', 'SOMA', 'Pacific Heights', 'Richmond', 'Sunset District', 'Castro', 'Haight-Ashbury'],
    services: ['Standing Seam Metal Roofing', 'R-Panel Installation', 'Roof Repair & Maintenance', 'Commercial Roofing', 'Emergency Roof Services'],
    testimonial: {
      name: 'Sarah Chen',
      text: 'Outstanding work on our Victorian home. The metal roof looks amazing and the team was professional throughout.',
      rating: 5,
      project: 'Standing Seam Installation'
    },
    faqs: [{
      question: 'Do you provide metal roofing services throughout San Francisco?',
      answer: 'Yes, we provide comprehensive metal roofing services throughout all San Francisco neighborhoods, including the Mission, SOMA, Pacific Heights, and more.'
    }, {
      question: 'What types of metal roofing work best in San Francisco\'s climate?',
      answer: 'Standing seam and R-panel systems work excellently in San Francisco due to their durability against fog, salt air, and temperature variations.'
    }, {
      question: 'How long does a metal roof installation take in San Francisco?',
      answer: 'Most residential installations take 2-5 days, depending on the size and complexity. We work efficiently while maintaining our high quality standards.'
    }],
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  'santa-clara': {
    name: 'Santa Clara',
    slug: 'santa-clara',
    fullName: 'Santa Clara, California',
    description: 'Expert metal roofing solutions for Santa Clara residents and businesses, featuring energy-efficient systems perfect for Silicon Valley\'s climate.',
    population: '130,000+',
    keyAreas: ['Northside', 'Westside', 'Central Park', 'Old Quad', 'Technology District'],
    services: ['Residential Metal Roofing', 'Commercial Systems', 'Solar Panel Integration', 'Energy-Efficient Coatings', 'Maintenance Programs'],
    testimonial: {
      name: 'Mike Rodriguez',
      text: 'Perfect installation on our tech company headquarters. Professional, timely, and excellent quality.',
      rating: 5,
      project: 'Commercial R-Panel System'
    },
    faqs: [{
      question: 'Do you serve all areas of Santa Clara?',
      answer: 'Yes, we provide metal roofing services throughout Santa Clara, including residential neighborhoods and the technology district.'
    }, {
      question: 'Can metal roofing help with energy costs in Santa Clara?',
      answer: 'Absolutely! Metal roofing with reflective coatings can significantly reduce cooling costs in Santa Clara\'s warm climate.'
    }, {
      question: 'Do you work with solar panel installations?',
      answer: 'Yes, we coordinate with solar installers and can prepare your metal roof for solar panel integration.'
    }],
    coordinates: {
      lat: 37.3541,
      lng: -121.9552
    }
  },
  'walnut-creek': {
    name: 'Walnut Creek',
    slug: 'walnut-creek',
    fullName: 'Walnut Creek, California',
    description: 'Premium metal roofing services in Walnut Creek, providing durable and attractive roofing solutions for Contra Costa County homes and businesses.',
    population: '70,000+',
    keyAreas: ['Downtown', 'Northgate', 'Southgate', 'Rossmoor', 'Castle Hill', 'Countrywood'],
    services: ['Luxury Residential Roofing', 'Multi-V Panel Systems', 'Custom Color Matching', 'Tile to Metal Conversion', 'Storm Damage Repair'],
    testimonial: {
      name: 'Jennifer Walsh',
      text: 'Beautiful metal roof installation that perfectly matches our home\'s architecture. Highly recommend!',
      rating: 5,
      project: 'Standing Seam with Custom Color'
    },
    faqs: [{
      question: 'What metal roofing styles work best in Walnut Creek?',
      answer: 'Standing seam and Multi-V panels are popular choices that complement Walnut Creek\'s architectural styles beautifully.'
    }, {
      question: 'Do you offer custom colors for metal roofing?',
      answer: 'Yes, we offer a wide range of custom colors and can match existing architectural elements perfectly.'
    }, {
      question: 'How does metal roofing handle Walnut Creek\'s weather?',
      answer: 'Metal roofing excels in Walnut Creek\'s climate, handling both hot summers and occasional storms with superior durability.'
    }],
    coordinates: {
      lat: 37.9063,
      lng: -122.0654
    }
  },
  'tiburon': {
    name: 'Tiburon',
    slug: 'tiburon',
    fullName: 'Tiburon, California',
    description: 'Luxury metal roofing services for Tiburon\'s waterfront homes, offering premium materials and expert installation with stunning bay views in mind.',
    population: '9,000+',
    keyAreas: ['Belvedere Tiburon', 'Blackie\'s Pasture', 'Paradise Beach', 'Tiburon Peninsula', 'Richardson Bay'],
    services: ['Luxury Standing Seam', 'Corrugated Metal Roofing', 'Marine Environment Protection', 'Custom Architectural Design', 'Historic Home Restoration'],
    testimonial: {
      name: 'David Thompson',
      text: 'Exceptional work on our bayfront property. The metal roof handles the marine environment perfectly and looks stunning.',
      rating: 5,
      project: 'Marine-Grade Standing Seam'
    },
    faqs: [{
      question: 'Does metal roofing work well in Tiburon\'s marine environment?',
      answer: 'Yes, we use marine-grade coatings and materials specifically designed to resist salt air corrosion in coastal environments.'
    }, {
      question: 'Can you work on historic homes in Tiburon?',
      answer: 'Absolutely! We specialize in historic home restoration and can design metal roofing that complements traditional architecture.'
    }, {
      question: 'How do you handle Tiburon\'s building requirements?',
      answer: 'We\'re fully familiar with Tiburon\'s building codes and permit requirements, handling all documentation for you.'
    }],
    coordinates: {
      lat: 37.8736,
      lng: -122.4564
    }
  },
  'san-anselmo': {
    name: 'San Anselmo',
    slug: 'san-anselmo',
    fullName: 'San Anselmo, California',
    description: 'Custom metal roofing installations in San Anselmo, serving this charming Marin County town with quality craftsmanship and personalized service.',
    population: '12,500+',
    keyAreas: ['Downtown San Anselmo', 'Brookside', 'Sleepy Hollow', 'San Francisco Theological Seminary', 'Red Hill'],
    services: ['Custom Metal Roofing', 'R-Panel Systems', 'Residential Retrofits', 'Creek Flood Protection', 'Energy Star Certified Systems'],
    testimonial: {
      name: 'Lisa Martinez',
      text: 'Wonderful experience from start to finish. Our new metal roof has transformed our home and performs beautifully.',
      rating: 5,
      project: 'Custom Color R-Panel'
    },
    faqs: [{
      question: 'Do you provide services throughout San Anselmo?',
      answer: 'Yes, we serve all areas of San Anselmo including downtown, Sleepy Hollow, and surrounding neighborhoods.'
    }, {
      question: 'Can metal roofing help with San Anselmo\'s flood concerns?',
      answer: 'Metal roofing provides excellent water shedding capabilities and can be designed to handle heavy rainfall effectively.'
    }, {
      question: 'What\'s the typical timeline for installation in San Anselmo?',
      answer: 'Most residential projects take 2-4 days, weather permitting. We work efficiently to minimize disruption to your daily routine.'
    }],
    coordinates: {
      lat: 37.9746,
      lng: -122.5614
    }
  },
  'santa-cruz': {
    name: 'Santa Cruz',
    slug: 'santa-cruz',
    fullName: 'Santa Cruz, California',
    description: 'Coastal roofing specialists serving Santa Cruz with marine-grade metal roofing systems designed to withstand ocean conditions and seismic activity.',
    population: '65,000+',
    keyAreas: ['Downtown Santa Cruz', 'Westside', 'Eastside', 'UCSC Campus', 'Beach Flats', 'Seabright'],
    services: ['Marine-Grade Metal Roofing', 'Seismic-Safe Installation', 'Coastal Weather Protection', 'University Housing', 'Beach Property Specialists'],
    testimonial: {
      name: 'Robert Kim',
      text: 'Perfect solution for our beachfront home. The metal roof handles the salt air and weather beautifully.',
      rating: 5,
      project: 'Coastal Standing Seam'
    },
    faqs: [{
      question: 'How does metal roofing perform in Santa Cruz\'s coastal environment?',
      answer: 'Our marine-grade metal roofing systems are specifically designed for coastal conditions, resisting salt corrosion and high winds.'
    }, {
      question: 'Do you work with earthquake considerations in Santa Cruz?',
      answer: 'Yes, all our installations meet seismic requirements and use flexible mounting systems designed for earthquake zones.'
    }, {
      question: 'Can you handle Santa Cruz\'s permitting process?',
      answer: 'Absolutely! We\'re familiar with Santa Cruz building requirements and handle all permit applications and inspections.'
    }],
    coordinates: {
      lat: 36.9741,
      lng: -122.0308
    }
  },
  'modesto': {
    name: 'Modesto',
    slug: 'modesto',
    fullName: 'Modesto, California',
    description: 'Central Valley roofing experts serving Modesto with durable metal roofing solutions designed for extreme temperature variations and agricultural environments.',
    population: '218,000+',
    keyAreas: ['Downtown Modesto', 'West Modesto', 'East Modesto', 'Village One', 'Bret Harte', 'Airport District'],
    services: ['Agricultural Metal Roofing', 'Extreme Weather Systems', 'Commercial Warehouses', 'Residential Retrofits', 'Heat-Reflective Coatings'],
    testimonial: {
      name: 'Carlos Gutierrez',
      text: 'Outstanding work on our warehouse. The metal roof keeps temperatures down and looks great.',
      rating: 5,
      project: 'Commercial R-Panel with Heat Reflection'
    },
    faqs: [{
      question: 'How does metal roofing handle Modesto\'s extreme temperatures?',
      answer: 'Our reflective metal roofing systems are perfect for Modesto\'s hot summers, reducing cooling costs by up to 30%.'
    }, {
      question: 'Do you work on agricultural buildings in Modesto?',
      answer: 'Yes, we specialize in agricultural roofing including barns, warehouses, and processing facilities.'
    }, {
      question: 'What\'s the best metal roofing for Central Valley weather?',
      answer: 'R-Panel and corrugated systems with reflective coatings work excellently in the Central Valley\'s climate.'
    }],
    coordinates: {
      lat: 37.6391,
      lng: -120.9969
    }
  },
  'kentfield': {
    name: 'Kentfield',
    slug: 'kentfield',
    fullName: 'Kentfield, California',
    description: 'Premium roofing services in Kentfield, offering luxury metal roofing solutions for this exclusive Marin County community with custom design options.',
    population: '6,500+',
    keyAreas: ['College of Marin', 'Kent Woodlands', 'Kentfield Hills', 'Corte Madera Creek', 'Sir Francis Drake'],
    services: ['Luxury Metal Roofing', 'Custom Architectural Design', 'Premium Standing Seam', 'Historic Preservation', 'Landscape Integration'],
    testimonial: {
      name: 'Patricia Johnson',
      text: 'Exceptional craftsmanship and attention to detail. Our metal roof is both beautiful and incredibly durable.',
      rating: 5,
      project: 'Custom Architectural Standing Seam'
    },
    faqs: [{
      question: 'Do you specialize in luxury roofing for Kentfield homes?',
      answer: 'Yes, we specialize in high-end metal roofing with custom colors, profiles, and architectural details for luxury properties.'
    }, {
      question: 'Can you work with landscape architects in Kentfield?',
      answer: 'Absolutely! We regularly collaborate with landscape architects to ensure roofing integrates beautifully with outdoor spaces.'
    }, {
      question: 'What makes your Kentfield service unique?',
      answer: 'We provide white-glove service with custom design consultation and premium materials to match Kentfield\'s luxury standards.'
    }],
    coordinates: {
      lat: 37.9527,
      lng: -122.5581
    }
  },
  'santa-rosa': {
    name: 'Santa Rosa',
    slug: 'santa-rosa',
    fullName: 'Santa Rosa, California',
    description: 'North Bay roofing professionals serving Santa Rosa with fire-resistant metal roofing systems and expert installation for Sonoma County properties.',
    population: '178,000+',
    keyAreas: ['Downtown Santa Rosa', 'Fountaingrove', 'Bennett Valley', 'Rincon Valley', 'Roseland', 'Montgomery Village'],
    services: ['Fire-Resistant Metal Roofing', 'Wildfire Recovery', 'Wine Country Structures', 'Residential & Commercial', 'Insurance Claim Assistance'],
    testimonial: {
      name: 'Michael Brown',
      text: 'After the fires, we needed a reliable, fire-resistant roof. The metal roofing gives us peace of mind and looks fantastic.',
      rating: 5,
      project: 'Fire-Resistant Standing Seam'
    },
    faqs: [{
      question: 'How fire-resistant is metal roofing in Santa Rosa?',
      answer: 'Metal roofing has a Class A fire rating, the highest available, making it ideal for wildfire-prone areas like Santa Rosa.'
    }, {
      question: 'Do you help with insurance claims for fire damage?',
      answer: 'Yes, we have extensive experience working with insurance companies and can help navigate the claims process.'
    }, {
      question: 'Can you handle wine industry buildings in Santa Rosa?',
      answer: 'Absolutely! We specialize in winery and agricultural buildings with custom metal roofing solutions.'
    }],
    coordinates: {
      lat: 38.4404,
      lng: -122.7144
    }
  },
  'alameda-county': {
    name: 'Alameda County',
    slug: 'alameda-county',
    fullName: 'Alameda County, California',
    description: 'Comprehensive roofing services throughout Alameda County, serving diverse communities from Oakland to Fremont with expert metal roofing solutions.',
    population: '1.67M+',
    keyAreas: ['Oakland', 'Fremont', 'Hayward', 'Berkeley', 'San Leandro', 'Union City', 'Alameda', 'Dublin', 'Pleasanton'],
    services: ['County-Wide Service', 'Multi-Family Housing', 'Commercial Complexes', 'Industrial Facilities', 'Municipal Buildings'],
    testimonial: {
      name: 'Angela Davis',
      text: 'Excellent service across multiple properties in Alameda County. Consistent quality and professional teams.',
      rating: 5,
      project: 'Multi-Property Commercial Installation'
    },
    faqs: [{
      question: 'Do you serve all cities in Alameda County?',
      answer: 'Yes, we provide comprehensive metal roofing services throughout all Alameda County cities and unincorporated areas.'
    }, {
      question: 'Can you handle large commercial projects in Alameda County?',
      answer: 'Absolutely! We have the capacity and experience for large-scale commercial and industrial roofing projects.'
    }, {
      question: 'What\'s your response time for service calls in Alameda County?',
      answer: 'We typically respond within 24 hours for emergency calls and within 48 hours for standard service requests.'
    }],
    coordinates: {
      lat: 37.6017,
      lng: -121.7195
    }
  },
  'contra-costa-county': {
    name: 'Contra Costa County',
    slug: 'contra-costa-county',
    fullName: 'Contra Costa County, California',
    description: 'Full-service roofing across Contra Costa County, providing expert metal roofing installation and maintenance from Richmond to Brentwood.',
    population: '1.16M+',
    keyAreas: ['Concord', 'Richmond', 'Antioch', 'Walnut Creek', 'Pittsburg', 'San Ramon', 'Martinez', 'Brentwood', 'Danville'],
    services: ['County-Wide Coverage', 'Suburban Residential', 'Refinery & Industrial', 'Educational Facilities', 'Municipal Projects'],
    testimonial: {
      name: 'Steve Wilson',
      text: 'Professional service throughout Contra Costa County. They handled our industrial facility perfectly.',
      rating: 5,
      project: 'Industrial Complex Re-Roofing'
    },
    faqs: [{
      question: 'Do you cover all of Contra Costa County?',
      answer: 'Yes, we provide metal roofing services throughout Contra Costa County, from coastal areas to inland communities.'
    }, {
      question: 'Can you handle industrial facilities in Contra Costa County?',
      answer: 'Yes, we have extensive experience with industrial and refinery facilities requiring specialized roofing systems.'
    }, {
      question: 'Do you work with schools and municipal buildings?',
      answer: 'Absolutely! We regularly work with school districts and municipal agencies throughout the county.'
    }],
    coordinates: {
      lat: 37.8534,
      lng: -121.9018
    }
  },
  'petaluma': {
    name: 'Petaluma',
    slug: 'petaluma',
    fullName: 'Petaluma, California',
    description: 'Quality roofing services in Petaluma, Sonoma County, specializing in metal roofing for residential homes and agricultural buildings in wine country.',
    population: '60,000+',
    keyAreas: ['Historic Downtown', 'West Petaluma', 'East Petaluma', 'Adobe Creek', 'Riverfront', 'McNear Peninsula'],
    services: ['Historic Home Restoration', 'Agricultural Buildings', 'Wine Industry Facilities', 'Residential Metal Roofing', 'Storm Damage Repair'],
    testimonial: {
      name: 'Maria Rodriguez',
      text: 'Beautiful work on our historic Victorian. The metal roof respects the architecture while providing modern protection.',
      rating: 5,
      project: 'Historic Home Metal Roof Restoration'
    },
    faqs: [{
      question: 'Do you work on historic buildings in Petaluma?',
      answer: 'Yes, we specialize in historic preservation and can design metal roofing that complements Petaluma\'s Victorian architecture.'
    }, {
      question: 'Can you handle agricultural buildings in Petaluma?',
      answer: 'Absolutely! We work extensively with farms, dairies, and agricultural facilities throughout Sonoma County.'
    }, {
      question: 'How do you handle Petaluma\'s building preservation requirements?',
      answer: 'We work closely with the city\'s planning department to ensure all work meets historic preservation guidelines.'
    }],
    coordinates: {
      lat: 38.2324,
      lng: -122.6367
    }
  },
  'los-gatos': {
    name: 'Los Gatos',
    slug: 'los-gatos',
    fullName: 'Los Gatos, California',
    description: 'High-end metal roofing solutions for Los Gatos luxury homes, offering premium materials and expert craftsmanship in the heart of Silicon Valley.',
    population: '33,000+',
    keyAreas: ['Old Town Los Gatos', 'Los Gatos Hills', 'Surmont', 'Belgatos', 'Ridgecrest', 'Monte Sereno Border'],
    services: ['Luxury Residential Roofing', 'Custom Standing Seam', 'Silicon Valley Homes', 'High-End Retrofits', 'Architectural Consultation'],
    testimonial: {
      name: 'Thomas Chang',
      text: 'Exceptional quality and service. Our custom metal roof is a perfect match for our modern home design.',
      rating: 5,
      project: 'Modern Architectural Standing Seam'
    },
    faqs: [{
      question: 'Do you specialize in luxury homes in Los Gatos?',
      answer: 'Yes, we specialize in high-end residential metal roofing with custom designs and premium materials for luxury properties.'
    }, {
      question: 'Can you work with architects and designers in Los Gatos?',
      answer: 'Absolutely! We regularly collaborate with architects and designers to create custom roofing solutions.'
    }, {
      question: 'What makes Los Gatos roofing projects unique?',
      answer: 'Los Gatos projects often require custom colors, profiles, and integration with sophisticated home automation systems.'
    }],
    coordinates: {
      lat: 37.2358,
      lng: -121.9623
    }
  }
};
const LocationService: React.FC = () => {
  const {
    locationSlug
  } = useParams<{
    locationSlug: string;
  }>();
  const location = locationSlug ? locationData[locationSlug] : null;
  if (!location) {
    return <div className="min-h-screen bg-background">
        <RoofingFriendHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Location Not Found</h1>
          <p className="text-muted-foreground">The requested service area was not found.</p>
        </div>
      </div>;
  }
  const breadcrumbItems = [{
    name: 'Home',
    url: '/'
  }, {
    name: location.name,
    url: `/roofing-services/${location.slug}`
  }];
  return <div className="min-h-screen bg-background">
      <SEOHead title={`Metal Roofing Services in ${location.name} | Expert Installation & Repair`} description={`Professional metal roofing services in ${location.fullName}. Licensed contractors, 25-year warranty, free estimates. Serving ${location.keyAreas.join(', ')}.`} keywords={`metal roofing ${location.name}, roof installation ${location.name}, roofing contractor ${location.name}, ${location.name} roofing services`} location={{
      name: location.name,
      region: 'California'
    }} />
      
      <LocalBusinessStructuredData location={{
      name: location.name,
      coordinates: location.coordinates
    }} />
      
      <ServiceStructuredData serviceName="Metal Roofing Installation" location={location.fullName} />
      
      <FAQStructuredData faqs={location.faqs} />

      <RoofingFriendHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Metal Roofing Services in
            <span className="block text-primary">{location.name}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {location.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="tel:+14156971849">
              <Button size="lg" variant="green-text">
                <Phone className="w-5 h-5 mr-2" />
                Call (415) 697-1849
              </Button>
            </a>
            <a href="/contact">
              <Button size="lg" variant="secondary" className="bg-success hover:bg-success/90 text-slate-950">
                <Phone className="w-5 h-5 mr-2" />
                Get Free Estimate
              </Button>
            </a>
          </div>
          
          {/* City Image Showcase */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={getCityImage(location.slug)} 
              alt={`${location.name} cityscape and roofing services area`} 
              className="w-full h-64 sm:h-80 object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                Proudly serving {location.name}
              </p>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Areas We Serve in {location.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {location.keyAreas.map((area, index) => <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm">{area}</span>
                  </div>)}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Population Served: {location.population} residents
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Our {location.name} Roofing Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {location.services.map((service, index) => <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{service}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Professional {service.toLowerCase()} services with premium materials and expert installation.
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="bg-muted/30 rounded-xl p-8 mb-12">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">25-Year Warranty</h3>
              <p className="text-sm text-muted-foreground">Comprehensive warranty coverage</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Award className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Licensed & Insured</h3>
              <p className="text-sm text-muted-foreground">Fully licensed contractor</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Free Estimates</h3>
              <p className="text-sm text-muted-foreground">No obligation consultations</p>
            </div>
          </div>
        </section>

        {/* Customer Testimonial */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            What {location.name} Customers Say
          </h2>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(location.testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <blockquote className="text-lg italic mb-4">
                "{location.testimonial.text}"
              </blockquote>
              <div className="font-semibold">{location.testimonial.name}</div>
              <div className="text-sm text-muted-foreground">{location.testimonial.project}</div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions - {location.name}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {location.faqs.map((faq, index) => <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your {location.name} Roofing Project?
          </h2>
          <p className="text-xl mb-6">
            Contact us today for a free consultation and estimate
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+14156971849">
              <Button size="lg" variant="secondary">
                <Phone className="w-5 h-5 mr-2" />
                Call (415) 697-1849
              </Button>
            </a>
            <a href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                <Mail className="w-5 h-5 mr-2" />
                Email Us
              </Button>
            </a>
          </div>
        </section>
      </main>
    </div>;
};
export default LocationService;