import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';

interface ProposalHeroProps {
  proposal: any;
  isClientView?: boolean;
}

export const ProposalHero: React.FC<ProposalHeroProps> = ({ 
  proposal, 
  isClientView = false 
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      
      {/* Hero Content */}
      <div className="relative px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-4 mb-6">
            <Badge className={getStatusColor(proposal?.status || 'draft')}>
              {proposal?.status || 'Draft'}
            </Badge>
            {proposal?.created_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Created {new Date(proposal.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {proposal?.title || 'Roofing Proposal'}
            </h1>
            
            {proposal?.description && (
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {proposal.description}
              </p>
            )}
          </div>

          {/* Project Details */}
          <div className="flex flex-wrap gap-6 mt-8">
            {proposal?.project_address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{proposal.project_address}</span>
              </div>
            )}
            
            {proposal?.estimated_duration && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>{proposal.estimated_duration} days</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Professional Installation</span>
            </div>
          </div>

          {/* CTA for Client View */}
          {isClientView && proposal?.status !== 'accepted' && (
            <div className="mt-8">
              <Button 
                size="lg" 
                className="animate-pulse"
                onClick={() => {
                  const comparisonSection = document.getElementById('current-vs-proposed');
                  if (comparisonSection) {
                    comparisonSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Review Your Custom Proposal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};