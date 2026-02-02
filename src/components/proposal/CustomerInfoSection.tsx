import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Calendar, FileText, Clock, User } from 'lucide-react';
import type { ProjectProposal } from '@/hooks/useProposalManagement';

interface CustomerInfoSectionProps {
  proposal: ProjectProposal;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  proposal
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getExpirationDate = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiration = new Date(created);
    expiration.setDate(created.getDate() + 30); // 30 days validity
    return expiration.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </div>
            
            <div className="space-y-3 ml-7">
              <div>
                <div className="font-medium text-foreground">
                  {proposal.client_name || 'Customer Name'}
                </div>
                {proposal.client_email && (
                  <div className="text-sm text-muted-foreground">
                    {proposal.client_email}
                  </div>
                )}
                {proposal.client_phone && (
                  <div className="text-sm text-muted-foreground">
                    {proposal.client_phone}
                  </div>
                )}
              </div>
              
              {proposal.property_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Project Address</div>
                    <div className="text-muted-foreground">
                      {proposal.property_address}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Proposal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Building className="h-5 w-5 text-primary" />
              Proposal Information
            </div>
            
            <div className="space-y-3 ml-7">
              <div>
                <div className="font-medium text-foreground">
                  Estimate #{proposal.proposal_number}
                </div>
                <div className="text-sm text-muted-foreground">
                  Professional Roofing Proposal
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">Date Prepared</div>
                  <div className="text-muted-foreground">
                    {formatDate(proposal.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">Valid Until</div>
                  <div className="text-muted-foreground">
                    {getExpirationDate(proposal.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Project Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Project Overview
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {proposal.scope_of_work || 
             'This proposal outlines a comprehensive roofing solution designed specifically for your property. Our team will provide professional installation using premium materials backed by industry-leading warranties.'
            }
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mt-6">
          <Badge 
            className={`px-4 py-2 text-sm font-medium ${
              proposal.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              proposal.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {proposal.status === 'sent' ? '⏳ Awaiting Your Response' : 
             proposal.status === 'accepted' ? '✅ Accepted' :
             proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)
            }
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};