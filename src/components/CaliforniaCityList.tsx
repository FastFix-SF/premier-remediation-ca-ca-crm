
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useAreas, useBusiness } from '@/hooks/useBusinessConfig';

const CaliforniaCityList: React.FC = () => {
  const navigate = useNavigate();
  const areas = useAreas();
  const business = useBusiness();

  // Transform areas from config into service locations
  const serviceLocations = areas.map((area, index) => ({
    id: String(index + 1),
    name: area.name,
    slug: area.slug,
    description: area.description || `Professional services in ${area.name}`
  }));

  const handleLocationClick = (slug: string) => {
    navigate(`/areas/${slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center justify-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        Our Service Areas
      </h3>
      
      {/* Grid layout for better organization */}
      {serviceLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {serviceLocations.map((location, index) => (
            <button
              key={location.id}
              onClick={() => handleLocationClick(location.slug)}
              aria-label={`View services in ${location.name}`}
              className="group text-left p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/40 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 shadow-card hover:shadow-card-hover active:scale-[0.98]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-5 h-5">
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></span>
                    <span className="absolute inset-1 rounded-full bg-primary/20 animate-ping [animation-delay:150ms]"></span>
                    <span className="relative z-10 block w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-primary/40"></span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors story-link group-hover:underline underline-offset-4">
                      {location.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {location.description}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Contact us to learn about our service areas.</p>
        </div>
      )}
    </div>
  );
};

export default CaliforniaCityList;
