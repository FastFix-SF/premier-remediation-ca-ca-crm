import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { Button } from '../ui/button';
import { OptimizedImage } from '../ui/optimized-image';
import { ExternalLink } from 'lucide-react';

interface SolarImage {
  src: string;
  alt: string;
  caption: string;
}

interface SolarGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const solarImages: SolarImage[] = [
  {
    src: '/lovable-uploads/03abe1d5-4466-4edd-8721-625623a0dbc2.png',
    alt: 'Blue solar panels on standing seam metal roof with precision mounting hardware',
    caption: 'Standing Seam + Flush-Mount Solar'
  },
  {
    src: '/images/solar/metal-solar-2.jpg',
    alt: 'Residential bronze metal roof with solar panel array',
    caption: 'Bronze Metal + Residential Solar'
  },
  {
    src: '/images/solar/metal-solar-3.jpg',
    alt: 'Modern farmhouse corrugated metal roof with solar mounting',
    caption: 'Corrugated Metal + Low-Profile Mounts'
  },
  {
    src: '/lovable-uploads/52097ec4-ec66-4e7d-a13c-b329d7a7467a.png',
    alt: 'Large commercial solar array on RoofingFriend.com warehouse metal roof',
    caption: 'Commercial Metal + Large Array'
  },
  {
    src: '/images/solar/metal-solar-5.jpg',
    alt: 'Gray standing seam with ballasted solar system',
    caption: 'Standing Seam + Ballasted System'
  },
  {
    src: '/images/solar/metal-solar-6.jpg',
    alt: 'Luxury copper metal roof with integrated solar panels',
    caption: 'Copper Metal + Integrated Solar'
  }
];

// Detect language (basic implementation - can be enhanced)
const getLanguage = (): 'en' | 'es' => {
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/es') || 
           navigator.language.startsWith('es') ? 'es' : 'en';
  }
  return 'en';
};

const content = {
  en: {
    title: 'See How Solar Looks on Your Roof',
    subtitle: 'Your home can look this good — high-efficiency solar on durable metal roofing.',
    bullets: [
      'Engineered for metal roofs (no leaks)',
      'Clean, low-profile mounts',
      'Design mockup included before you commit'
    ],
    primaryCta: "I'm Ready to Get a Quote",
    secondaryLink: 'See More Solar Projects',
    microcopy: "We'll send a free mockup of your roof with your preferred color/material + solar layout."
  },
  es: {
    title: 'Ve Cómo Se Ve Solar en Tu Techo',
    subtitle: 'Tu casa puede verse así — paneles solares de alta eficiencia en techo metálico.',
    bullets: [
      'Diseñado para techos metálicos (sin filtraciones)',
      'Montajes limpios y de perfil bajo',
      'Diseño incluido antes de comprometerte'
    ],
    primaryCta: 'Estoy Listo para Obtener una Cotización',
    secondaryLink: 'Ver Más Proyectos Solares',
    microcopy: 'Te enviamos un diseño gratis de tu techo con tu color/material + distribución de paneles.'
  }
};

export const SolarGalleryModal: React.FC<SolarGalleryModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();
  const lang = getLanguage();
  const copy = content[lang];

  useEffect(() => {
    if (isOpen) {
      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'solar_gallery_view');
      }
    }
  }, [isOpen]);

  const handleQuoteClick = () => {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'solar_quote_click', {
        from: 'gallery_modal'
      });
    }
    
    onClose();
    navigate('/contact');
  };

  const handleProjectsClick = () => {
    onClose();
    navigate('/projects?type=solar');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center sm:text-left">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground text-center sm:text-left">
            {copy.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Carousel */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {solarImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative">
                      <OptimizedImage
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-64 sm:h-80 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                        {image.caption}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          {/* Reassurance Bullets */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <ul className="space-y-2">
              {copy.bullets.map((bullet, index) => (
                <li key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3 flex-shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleQuoteClick}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {copy.primaryCta}
            </Button>
            <Button 
              onClick={handleProjectsClick}
              variant="outline"
              className="flex-1 sm:flex-none font-semibold py-3 text-base rounded-xl"
            >
              {copy.secondaryLink}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Microcopy */}
          <p className="text-xs text-muted-foreground text-center">
            {copy.microcopy}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};