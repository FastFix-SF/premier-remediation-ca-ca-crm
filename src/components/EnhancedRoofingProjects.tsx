import React from 'react';
import { Star, MapPin, Calendar, Wrench } from 'lucide-react';

interface RoofProject {
  id: string;
  title: string;
  location: string;
  type: string;
  material: string;
  completedDate: string;
  rating: number;
  image: string;
  description: string;
}

const roofProjects: RoofProject[] = [
  {
    id: '1',
    title: 'Modern Residential Installation',
    location: 'San Francisco, CA',
    type: 'Standing Seam Metal Roof',
    material: '24 Gauge Steel',
    completedDate: '2024',
    rating: 5,
    image: '/api/placeholder/300/200',
    description: 'Complete roof replacement with premium standing seam metal roofing'
  },
  {
    id: '2',
    title: 'Commercial Warehouse Project',
    location: 'Santa Clara, CA',
    type: 'R-Panel System',
    material: '26 Gauge Galvanized',
    completedDate: '2024',
    rating: 5,
    image: '/api/placeholder/300/200',
    description: '15,000 sq ft commercial roofing with energy-efficient coating'
  },
  {
    id: '3',
    title: 'Luxury Home Renovation',
    location: 'Tiburon, CA',
    type: 'Multi-V Panel',
    material: '29 Gauge Painted Steel',
    completedDate: '2023',
    rating: 5,
    image: '/api/placeholder/300/200',
    description: 'High-end residential project with custom color matching'
  },
  {
    id: '4',
    title: 'Coastal Property Protection',
    location: 'Santa Cruz, CA',
    type: 'Corrugated Metal',
    material: '26 Gauge Aluminum',
    completedDate: '2023',
    rating: 5,
    image: '/api/placeholder/300/200',
    description: 'Weather-resistant roofing solution for coastal conditions'
  }
];

const EnhancedRoofingProjects: React.FC = () => {
  return (
    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {roofProjects.map((project, index) => (
          <div 
            key={project.id}
            className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg transform transition-all duration-700 hover:scale-105 cursor-pointer group"
            style={{
              animation: `float 6s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.5}s`
            }}
          >
            {/* Project Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative group-hover:shadow-lg transition-shadow">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <Wrench className="w-8 h-8 sm:w-12 sm:h-12 text-primary opacity-60" />
              </div>
              {/* Overlay with project type */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                {project.type}
              </div>
            </div>
            
            {/* Project Details */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-foreground font-semibold line-clamp-1">
                {project.title}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{project.location}</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{project.completedDate}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {project.material}
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1">
                {[...Array(project.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-white/80 text-xs sm:text-sm">
          Recent completed projects across the Bay Area
        </p>
        <p className="text-white/60 text-xs mt-1">
          Over 500+ successful installations since 2020
        </p>
      </div>
    </div>
  );
};

export default EnhancedRoofingProjects;