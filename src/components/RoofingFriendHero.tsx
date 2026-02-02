
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ShoppingCart, Phone, Shield, Truck, Award, Star, ExternalLink } from 'lucide-react';
import HeroContent from './hero/HeroContent';
import HeroProjectShowcase from './hero/HeroProjectShowcase';
import { preloadImage } from '../utils/imageOptimization';
import { useHeroGallery } from '@/hooks/useBusinessConfig';

const RoofingFriendHero = () => {
  const navigate = useNavigate();

  // Load hero gallery from visual-assets.json
  const heroGallery = useHeroGallery();

  // Default fallback projects (used when visual-assets.json is empty)
  const defaultFallbackProjects = [
    {
      id: '1',
      name: 'Modern Residential',
      location: 'Castro Valley, CA',
      project_type: 'R-Panel System',
      materials_used: ['24 Gauge Kynar 500® Steel'],
      completed_date: '2024',
      photos: [{
        id: '1',
        photo_url: '/lovable-uploads/e38fb4df-7d2e-46af-847f-533d8f57166b.png',
        thumbnail_url: '/lovable-uploads/e38fb4df-7d2e-46af-847f-533d8f57166b.png',
        photo_type: 'after' as const,
        is_featured: true
      }]
    },
    {
      id: '2',
      name: 'Coastal Property',
      location: 'Los Gatos, CA',
      project_type: 'Standing Seam Metal Roof',
      materials_used: ['24 Gauge Kynar 500® Steel'],
      completed_date: '2024',
      photos: [{
        id: '2',
        photo_url: '/lovable-uploads/46e86e6f-b5da-4830-bf41-b71314e8818a.png',
        thumbnail_url: '/lovable-uploads/46e86e6f-b5da-4830-bf41-b71314e8818a.png',
        photo_type: 'after' as const,
        is_featured: true
      }]
    },
    {
      id: '3',
      name: 'Luxury Home Renovation',
      location: 'Tiburon, CA',
      project_type: 'Multi-V Panel',
      materials_used: ['24 Gauge Painted Steel'],
      completed_date: '2023',
      photos: [{
        id: '3',
        photo_url: '/lovable-uploads/0d76378a-7b98-4fbd-a8d5-ec44aab639bf.png',
        thumbnail_url: '/lovable-uploads/0d76378a-7b98-4fbd-a8d5-ec44aab639bf.png',
        photo_type: 'after' as const,
        is_featured: true
      }]
    },
    {
      id: '4',
      name: 'Commercial Warehouse',
      location: 'Tracy, CA',
      project_type: 'TPO Membrane',
      materials_used: ['60 mil White TPO Membrane'],
      completed_date: '2023',
      photos: [{
        id: '4',
        photo_url: '/lovable-uploads/0c2f1f66-3c46-49a9-bf3f-696eba2dce32.png',
        thumbnail_url: '/lovable-uploads/0c2f1f66-3c46-49a9-bf3f-696eba2dce32.png',
        photo_type: 'after' as const,
        is_featured: true
      }]
    }
  ];

  // Use hero gallery from config if available, otherwise use default fallback
  const fallbackProjects = useMemo(() => {
    if (heroGallery && heroGallery.length > 0) {
      return heroGallery.map((item, index) => ({
        id: String(index + 1),
        name: item.caption || `Project ${index + 1}`,
        location: item.location || '',
        project_type: item.projectType || '',
        materials_used: [],
        completed_date: new Date().getFullYear().toString(),
        photos: [{
          id: String(index + 1),
          photo_url: item.url,
          thumbnail_url: item.url,
          photo_type: 'after' as const,
          is_featured: true
        }]
      }));
    }
    return defaultFallbackProjects;
  }, [heroGallery]);

  // Preload critical hero images for better performance
  useEffect(() => {
    const criticalImages = fallbackProjects.map(project => 
      project.photos?.[0]?.photo_url
    ).filter(Boolean) as string[];
    
    criticalImages.forEach(url => {
      preloadImage(url).catch(() => {
        // Silently handle preload failures
      });
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 opacity-20 bg-white/5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-center py-8 sm:py-12 lg:py-20 xl:py-32">
          <div className="w-full">
            <HeroContent />
          </div>
          <div className="w-full">
            <HeroProjectShowcase 
              projects={fallbackProjects} 
              isLoading={false}
              videoSrc="/intro-video.mp4"
            />
          </div>
        </div>
        
        {/* Google Maps Portfolio Button */}
        <div className="text-center pb-8 lg:pb-12">
          <Button
            onClick={() => navigate('/projects')}
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Our Portfolio
          </Button>
        </div>
      </div>

      {/* Bottom wave pattern */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8 sm:h-12">
          <path d="M1200 120L0 120L0 0C400 80 800 80 1200 0V120Z" fill="white" fillOpacity="0.1"/>
        </svg>
      </div>
    </section>
  );
};

export default RoofingFriendHero;
