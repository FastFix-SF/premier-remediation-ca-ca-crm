import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Award, 
  Users, 
  Clock, 
  Star,
  CheckCircle,
  Zap,
  Phone
} from 'lucide-react';

export const TrustIndicators: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCert, setHoveredCert] = useState<number | null>(null);
  const [hoveredGuarantee, setHoveredGuarantee] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const certifications = [
    {
      icon: Shield,
      title: "Licensed & Insured",
      description: "Fully bonded contractor",
      badge: "CLSB # 1067709",
      animation: "animate-gentle-pulse",
      hoverEffect: "group-hover:animate-glow"
    },
    {
      icon: Award,
      title: "15+ Years Experience",
      description: "Trusted local expertise",
      badge: "Since 2009",
      animation: "animate-subtle-bounce",
      hoverEffect: "group-hover:animate-float-gentle"
    },
    {
      icon: Users,
      title: "500+ Projects",
      description: "Satisfied customers",
      badge: "98% Rating",
      animation: "animate-soft-float",
      hoverEffect: "group-hover:animate-pulse-cta"
    },
    {
      icon: Star,
      title: "A+ BBB Rating",
      description: "Accredited business",
      badge: "Top Rated",
      animation: "animate-gentle-glow",
      hoverEffect: "group-hover:animate-glow"
    }
  ];

  const guarantees = [
    {
      icon: CheckCircle,
      title: "Lifetime Warranty",
      description: "On workmanship",
      animation: "hover:animate-soft-ripple",
      baseAnimation: "animate-gentle-pulse"
    },
    {
      icon: Zap,
      title: "Fast Response",
      description: "24hr emergency service",
      animation: "hover:animate-elegant-spark",
      baseAnimation: "animate-glow"
    },
    {
      icon: Phone,
      title: "Direct Communication",
      description: "No middlemen",
      animation: "hover:animate-subtle-bounce",
      baseAnimation: "animate-float-gentle"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Trust Badges */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
        {/* Animated background pattern */}
        <div 
          className="absolute inset-0 opacity-30 animate-solar-flow"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />
        
        <CardContent className="p-6 relative z-10">
          <h3 className="text-lg font-semibold mb-6 text-center animate-text-glow">
            Why Choose Our Roofing Services?
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {certifications.map((cert, index) => (
              <div 
                key={index} 
                className={`text-center space-y-2 group/cert cursor-pointer transform transition-all duration-300 hover:scale-[1.02] ${
                  isVisible ? 'animate-fade-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCert(index)}
                onMouseLeave={() => setHoveredCert(null)}
              >
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center relative overflow-hidden group-hover/cert:bg-primary/20 transition-all duration-300 group-hover/cert:shadow-lg">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cert:translate-x-full transition-transform duration-700" />
                  
                  <cert.icon 
                    className={`h-6 w-6 text-primary transition-all duration-300 ${cert.animation} ${
                      hoveredCert === index ? cert.hoverEffect : ''
                    }`} 
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm group-hover/cert:text-primary transition-colors duration-300">{cert.title}</p>
                  <p className="text-xs text-muted-foreground group-hover/cert:text-foreground transition-colors duration-300">{cert.description}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs border-primary/30 group-hover/cert:border-primary group-hover/cert:bg-primary/10 transition-all duration-300 ${
                      hoveredCert === index ? 'animate-flash' : ''
                    }`}
                  >
                    {cert.badge}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Guarantees */}
      <div className="grid md:grid-cols-3 gap-4">
        {guarantees.map((guarantee, index) => (
          <Card 
            key={index} 
            className={`hover:shadow-lg transition-all duration-300 cursor-pointer group/guarantee border-accent/20 hover:border-accent/40 hover:-translate-y-0.5 ${
              isVisible ? 'animate-fade-up' : 'opacity-0'
            }`}
            style={{ animationDelay: `${600 + index * 150}ms` }}
            onMouseEnter={() => setHoveredGuarantee(index)}
            onMouseLeave={() => setHoveredGuarantee(null)}
          >
            <CardContent className="p-4 text-center relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover/guarantee:opacity-100 transition-opacity duration-500" />
              
              <div className={`w-10 h-10 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3 relative group-hover/guarantee:bg-accent/20 transition-all duration-300 ${guarantee.baseAnimation}`}>
                <guarantee.icon 
                  className={`h-5 w-5 text-accent transition-all duration-300 ${guarantee.animation} ${
                    hoveredGuarantee === index ? 'scale-110' : ''
                  }`} 
                />
              </div>
              
              <h4 className="font-semibold text-sm mb-1 group-hover/guarantee:text-accent transition-colors duration-300 relative z-10">{guarantee.title}</h4>
              <p className="text-xs text-muted-foreground group-hover/guarantee:text-foreground transition-colors duration-300 relative z-10">{guarantee.description}</p>
              
              {/* Ripple effect on hover */}
              {hoveredGuarantee === index && (
                <div className="absolute inset-0 rounded-lg border-2 border-accent/30 animate-ripple" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};