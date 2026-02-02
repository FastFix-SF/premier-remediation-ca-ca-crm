import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Building, Calendar, MapPin, DollarSign, Share, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useProposalManagement, type ProjectProposal } from '@/hooks/useProposalManagement';
import { supabase } from '@/integrations/supabase/client';
import { ProposalHeader } from '@/components/proposal/ProposalHeader';
import { CustomerInfoSection } from '@/components/proposal/CustomerInfoSection';
import { CurrentVsProposedComparison } from '@/components/proposal/CurrentVsProposedComparison';
import { ProposalDetails } from '@/components/proposal/ProposalDetails';
import { PricingTable } from '@/components/proposal/PricingTable';
import { ProposalGallery } from '@/components/proposal/ProposalGallery';
import { ProposalCallToAction } from '@/components/proposal/ProposalCallToAction';
import { ProposalHero } from '@/components/proposal/ProposalHero';
import { TrustIndicators } from '@/components/proposal/TrustIndicators';
import { FloatingActions } from '@/components/proposal/FloatingActions';
import { cn } from '@/lib/utils';

// Remove duplicate interface - using the one from useProposalManagement

export const ProjectProposalPage: React.FC = () => {
  const { id, token } = useParams<{ id?: string; token?: string }>();
  const navigate = useNavigate();
  
  // Check URL parameters to determine view mode
  const urlParams = new URLSearchParams(window.location.search);
  const shareParam = urlParams.get('share');
  const isClientView = !!token || !!shareParam;
  
  const actualProposalId = id || token || null;
  const isNewProposal = actualProposalId === 'new';
  
  const [proposal, setProposal] = useState<ProjectProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isNewProposal);

  const { 
    fetchProposal, 
    fetchProposalByToken,
    updateProposalStatus, 
    generateShareableLink,
    exportToPdf 
  } = useProposalManagement();

  useEffect(() => {
    if ((id && id !== 'new') || (token && isClientView)) {
      loadProposal();
    } else {
      setLoading(false);
    }
  }, [id, token, isClientView]);

  // Removed magic link verification for now - direct access allowed

  const loadProposal = async () => {
    try {
      setLoading(true);
      let data;
      
      if (isClientView && token) {
        // Client access via token
        data = await fetchProposalByToken(token);
      } else if (id && id !== 'new') {
        // Admin access via ID
        data = await fetchProposal(id);
      } else {
        throw new Error('No valid proposal identifier found');
      }
      
      setProposal(data);
    } catch (error) {
      console.error('Error loading proposal:', error);
      toast.error('Failed to load proposal');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!proposal) return;
    
    try {
      await updateProposalStatus(proposal.id, newStatus);
      setProposal(prev => prev ? { 
        ...prev, 
        status: newStatus as ProjectProposal['status'] 
      } : null);
      toast.success(`Proposal status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update proposal status');
    }
  };

  const handleShare = async () => {
    if (!proposal) return;
    
    try {
      const link = await generateShareableLink(proposal.id);
      
      // Try to copy to clipboard with fallback
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        toast.success('Shareable link copied to clipboard');
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Shareable link copied to clipboard');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      // Show the link in a dialog if clipboard fails
      alert(`Share this link: ${await generateShareableLink(proposal.id)}`);
    }
  };

  const handleExportPdf = async () => {
    if (!proposal) return;
    
    try {
      await exportToPdf(proposal.id);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'negotiating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Removed magic link error state - allowing direct access

  return (
      <div className="min-h-screen bg-background layout-lock-desktop">
        <SEOHead 
          title={proposal ? `Roofing Proposal - ${proposal.proposal_number}` : 'New Roofing Proposal'}
          description={proposal ? `Professional roofing proposal for ${proposal.property_address}` : 'Create a new professional roofing proposal'}
        />
        
        {/* Admin Header Section */}
        {!isClientView && (
          <div className="bg-background border-b border-border">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="h-8 text-xs"
                  >
                    ← Back
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {isNewProposal ? 'New Proposal' : proposal?.proposal_number}
                    </h1>
                    {proposal && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn("text-xs h-5", getStatusColor(proposal.status))}>
                          {getStatusIcon(proposal.status)}
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {proposal && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 text-xs"
                    >
                      <Share className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={!proposal}
                      className="h-8 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-8 text-xs"
                    >
                      {isEditing ? 'View' : 'Edit'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        {isClientView && proposal && (
          <ProposalHero 
            proposal={proposal}
            isClientView={isClientView}
          />
        )}

        {/* Trust Indicators */}
        {isClientView && (
          <div className="max-w-6xl mx-auto px-6 py-4">
            <TrustIndicators />
          </div>
        )}

         {/* Main Content */}
         <div className="w-full max-w-6xl mx-auto layout-lock">
           <div className={cn(
             "space-y-4 pb-12",
             isClientView ? "px-6" : "px-4 py-4"
           )} data-proposal-content>
            {/* Project Header - Always include for PDF but conditionally display */}
            <div className={cn(!isClientView ? "block" : "hidden print:block")}>
              <ProposalHeader 
                proposal={proposal}
                isEditing={isEditing}
                isNewProposal={isNewProposal}
                onProposalUpdate={setProposal}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* Customer Information - Always include for PDF */}
            {proposal && (
              <div className={cn(isClientView ? "block" : "hidden print:block")}>
                <CustomerInfoSection proposal={proposal} />
              </div>
            )}

            {/* Current vs. Proposed Comparison - Full Width */}
            <div id="current-vs-proposed" className="pdf-section col-span-2">
              <CurrentVsProposedComparison 
                proposalId={proposal?.id}
                isEditing={isEditing}
              />
            </div>

            {/* Two Column Layout for Details and Pricing */}
            <div className="grid md:grid-cols-2 gap-4 col-span-2">
              {/* Proposal Details */}
              <div className="pdf-section">
                <ProposalDetails 
                  proposal={proposal}
                  isEditing={isEditing}
                  onUpdate={setProposal}
                />
              </div>

              {/* Pricing Table */}
              <div className="pdf-section">
                <PricingTable 
                  proposalId={proposal?.id}
                  isEditing={isEditing}
                />
              </div>
            </div>

            {/* Why Choose Roofing Friend - Always include for PDF */}
            <div className={cn("pdf-section", isClientView ? "block" : "hidden print:block")}>
              <Card>
                <CardContent className="py-6 px-6">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold text-center mb-4 text-foreground">
                      Why Choose Roofing Friend?
                    </h2>
                    <p className="text-sm text-center mb-6 text-muted-foreground max-w-2xl mx-auto">
                      At Roofing Friend, we're not just contractors — we're your partner in protecting and transforming your home.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-base font-semibold mb-3 text-foreground">How We're Different</h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                            <div className="text-sm">
                              <strong className="text-foreground">Visualize before you decide:</strong> With our AI tools, you can see how your roof will look in different styles and colors before the project starts.
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                            <div className="text-sm">
                              <strong className="text-foreground">Proven materials:</strong> We only use high-performance products tested for durability, energy efficiency, and backed by strong warranties.
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                            <div className="text-sm">
                              <strong className="text-foreground">Local expertise:</strong> California weather demands more from your roof — our team knows what works here and what lasts.
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                            <div className="text-sm">
                              <strong className="text-foreground">Clean & professional process:</strong> From tear-off to final inspection, we treat your home with respect and leave it spotless.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-semibold mb-3 text-foreground">Our Work Speaks for Itself</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Clients choose Roofing Friend for reliable, beautiful results. Our gallery of before-and-after transformations shows exactly what you can expect.
                        </p>
                        
                        <h3 className="text-base font-semibold mb-3 text-foreground">Products You Can Trust</h3>
                        <p className="text-sm text-muted-foreground">
                          We carefully select roofing systems that balance strength, aesthetics, and value. Whether it's metal, shingle, or flat systems, we recommend what will serve your home best long-term.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            {proposal && isClientView && (
              <ProposalCallToAction 
                proposal={proposal}
                onStatusUpdate={handleStatusChange}
              />
            )}
          </div>
        </div>

        {/* Floating Actions */}
        {proposal && (
          <FloatingActions
            proposal={proposal}
            onAccept={() => handleStatusChange('accepted')}
            onSchedule={() => console.log('Schedule consultation')}
            onShare={handleShare}
            onExport={handleExportPdf}
            isClientView={isClientView}
          />
        )}

        {/* Footer for client view */}
        {isClientView && (
          <div className="bg-muted/30 mt-8 py-4">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Questions about this proposal? Contact us at info@roofingfriend.com</p>
                <p>© 2024 RoofingFriend - Professional Roofing Solutions</p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};