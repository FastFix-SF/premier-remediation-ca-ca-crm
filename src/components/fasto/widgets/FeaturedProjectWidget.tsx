import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FeaturedProjectWidget = () => {
  const navigate = useNavigate();
  
  const { data: featuredProject } = useQuery({
    queryKey: ['featured-project-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address, status, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const currentTime = new Date();

  return (
    <div 
      className="relative h-full min-h-[320px] rounded-3xl overflow-hidden cursor-pointer group"
      onClick={() => featuredProject && navigate(`/admin?tab=projects&project=${featuredProject.id}`)}
    >
      {/* Background gradient with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-white/20 rounded-full blur-3xl transform -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-black/20 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between z-10">
        {/* Top: Time & Weather */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-5xl font-light text-white tracking-tight">
              {format(currentTime, 'h:mm')}
            </p>
            <p className="text-white/70 text-lg mt-1">
              {format(currentTime, 'EEEE')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-light text-white">62°</p>
            <p className="text-white/60 text-sm">Partly Cloudy</p>
          </div>
        </div>

        {/* Bottom: Project Info */}
        <div className="space-y-3">
          {featuredProject ? (
            <>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white uppercase tracking-wider">
                  Active Project
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white leading-tight">
                {featuredProject.name}
              </h3>
              <div className="flex items-center gap-4 text-white/70">
                {featuredProject.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm truncate max-w-[200px]">{featuredProject.address}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                  View Project
                </span>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white uppercase tracking-wider">
                  Dashboard
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white">
                Welcome to Fasto
              </h3>
              <p className="text-white/70 text-sm">
                Your AI-powered roofing business command center
              </p>
            </>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
};
