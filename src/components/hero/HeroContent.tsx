
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Camera, FileText } from 'lucide-react';
import HeroTrustIndicators from './HeroTrustIndicators';
import HeroReviewsPreview from './HeroReviewsPreview';
import SolarOptionsButton from '../solar/SolarOptionsButton';
import { useHero, useBusiness } from '@/hooks/useBusinessConfig';

const HeroContent = () => {
  const navigate = useNavigate();
  const hero = useHero();
  const business = useBusiness();

  // Parse headline into main text and highlighted word
  const headline = hero?.headline || `Welcome to ${business.name}`;
  const highlight = hero?.headlineHighlight || '';
  const subheadline = hero?.subheadline || business.tagline || '';

  return (
    <div className="text-center lg:text-left space-y-6 lg:space-y-8">
      <div className="space-y-4 lg:space-y-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-arial font-bold leading-tight">
          {headline} {highlight && <span className="text-accent animate-text-glow animate-best-bounce relative inline-block bg-gradient-to-r from-accent via-accent to-accent bg-[length:200%_100%] animate-shine bg-clip-text">{highlight}</span>}
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
          {subheadline}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start flex-wrap">
        <Button
          size="lg"
          onClick={() => navigate('/contact')}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto animate-pulse-cta hover:animate-glow hover:scale-105 motion-safe:animate-float-gentle group"
        >
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse group-hover:animate-glow" />
          <span className="hidden sm:inline">{hero?.ctaPrimary || 'Get Free Estimate'}</span>
          <span className="sm:hidden">{hero?.ctaPrimary || 'Get Quote'}</span>
        </Button>
        <Button
          size="lg"
          variant="white-outline"
          onClick={() => navigate('/projects')}
          className="font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg group"
        >
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-flash" />
          <span className="hidden sm:inline">{hero?.ctaSecondary || 'View Our Work'}</span>
          <span className="sm:hidden">{hero?.ctaSecondary || 'Portfolio'}</span>
        </Button>
        <SolarOptionsButton />
      </div>

      <HeroTrustIndicators />
      <HeroReviewsPreview />
    </div>
  );
};

export default HeroContent;
