import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { 
  Plus, Eye, Edit, Calendar, MapPin, Trash2, EyeOff, Share, Download, 
  ExternalLink, ArrowRight, FileText, ChevronDown, Link, Mail, Wand2, Loader2, Upload
} from 'lucide-react';
import { OptimizedImage } from '../ui/optimized-image';
import { GooglePlacesAutocomplete } from '../ui/google-places-autocomplete';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { useProposalManagement, type ProjectProposal } from '../../hooks/useProposalManagement';
import { useIsMobile } from '../../hooks/use-mobile';

interface QuoteOption {
  id: string;
  option_name: string;
  total_amount: number;
  status: string;
  display_order: number;
}

interface ProposalWithImages extends ProjectProposal {
  currentImage?: string;
  proposedImage?: string;
  quotes?: QuoteOption[];
}

const ProposalManager = () => {
  const [proposals, setProposals] = useState<ProposalWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [convertingToProject, setConvertingToProject] = useState(false);
  const [generatingProposed, setGeneratingProposed] = useState<string | null>(null);
  const [uploadingCurrent, setUploadingCurrent] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [showAddQuoteDialog, setShowAddQuoteDialog] = useState(false);
  const [selectedProposalForQuote, setSelectedProposalForQuote] = useState<string | null>(null);
  const [newQuote, setNewQuote] = useState({
    option_name: '',
    total_amount: '',
    roofType: '',
    roofColor: '',
  });
  const [showEditQuoteDialog, setShowEditQuoteDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteOption | null>(null);
  const [editQuote, setEditQuote] = useState({
    option_name: '',
    total_amount: '',
  });
  const [showRoofDetailsDialog, setShowRoofDetailsDialog] = useState(false);
  const [roofDetailsForGeneration, setRoofDetailsForGeneration] = useState<{
    proposalId: string;
    currentImageUrl: string;
  } | null>(null);
  const [roofDetails, setRoofDetails] = useState({
    roofType: '',
    roofColor: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { 
    createProposal, 
    generateShareableLink,
    exportToPdf,
    updateProposal,
    generateContract
  } = useProposalManagement();

  const [newProposal, setNewProposal] = useState({
    property_address: '',
    project_type: 'residential',
    client_name: '',
    client_email: '',
    client_phone: '',
    expires_at: '',
    scope_of_work: '',
    notes_disclaimers: ''
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('project_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch images and quotes for each proposal
      const proposalsWithImagesAndQuotes = await Promise.all(
        (data || []).map(async (proposal) => {
          const { data: photos } = await supabase
            .from('proposal_photos')
            .select('photo_url, photo_type')
            .eq('proposal_id', proposal.id)
            .in('photo_type', ['current', 'proposed'])
            .not('photo_url', 'is', null)
            .not('photo_url', 'eq', '')
            .order('created_at', { ascending: false });
          
          const { data: quotes } = await supabase
            .from('quotes')
            .select('id, option_name, total_amount, status, display_order')
            .eq('proposal_id', proposal.id)
            .order('display_order', { ascending: true });
          
          const currentImage = photos?.find(p => p.photo_type === 'current')?.photo_url;
          const proposedImage = photos?.find(p => p.photo_type === 'proposed')?.photo_url;
          
          return {
            ...proposal,
            currentImage,
            proposedImage,
            quotes: quotes || []
          };
        })
      );
      
      setProposals(proposalsWithImagesAndQuotes as ProposalWithImages[]);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch proposals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    try {
      // Set default expiry to 30 days from now if not provided
      let expiresAt;
      if (newProposal.expires_at && newProposal.expires_at.trim() !== '') {
        // If date is provided, convert to ISO string
        expiresAt = new Date(newProposal.expires_at + 'T00:00:00.000Z').toISOString();
      } else {
        // Default to 30 days from now
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      await createProposal.mutateAsync({
        ...newProposal,
        expires_at: expiresAt
      });

      setShowCreateDialog(false);
      setNewProposal({
        property_address: '',
        project_type: 'residential',
        client_name: '',
        client_email: '',
        client_phone: '',
        expires_at: '',
        scope_of_work: '',
        notes_disclaimers: ''
      });
      fetchProposals();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (proposal: ProjectProposal) => {
    try {
      const link = await generateShareableLink(proposal.id);
      await navigator.clipboard.writeText(link);
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (proposal: ProjectProposal) => {
    try {
      await exportToPdf(proposal.id);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleConvertToProject = async () => {
    if (!selectedProposal) return;

    try {
      setConvertingToProject(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform scope of work into story description
      let storyDescription = selectedProposal.scope_of_work || 'Converted from proposal';
      let originalScope = selectedProposal.scope_of_work;

      if (selectedProposal.scope_of_work) {
        try {
          const { data: transformData, error: transformError } = await supabase.functions.invoke(
            'transform-scope-to-story',
            {
              body: {
                scopeOfWork: selectedProposal.scope_of_work,
                clientName: selectedProposal.client_name,
                propertyAddress: selectedProposal.property_address,
                projectType: selectedProposal.project_type
              }
            }
          );

          if (transformError) {
            console.warn('Story transformation failed, using original scope:', transformError);
          } else if (transformData?.success) {
            storyDescription = transformData.storyDescription;
          }
        } catch (error) {
          console.warn('Story transformation error, using original scope:', error);
        }
      }

      // Create project from proposal
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${selectedProposal.client_name} - ${selectedProposal.property_address}`,
          description: storyDescription,
          original_scope: originalScope,
          project_type: selectedProposal.project_type,
          project_category: selectedProposal.project_type === 'residential' ? 'Residential' : 'Commercial',
          address: selectedProposal.property_address,
          status: 'planning',
          created_by: user.id,
          is_public: false,
          customer_email: selectedProposal.client_email
        })
        .select()
        .maybeSingle();

      if (projectError) throw projectError;

      // Add customer assignment
      const { error: assignmentError } = await supabase
        .from('project_assignments')
        .insert({
          project_id: projectData.id,
          customer_email: selectedProposal.client_email,
          assigned_by: user.id,
        });

      if (assignmentError) throw assignmentError;

      // Update proposal status
      const { error: proposalUpdateError } = await supabase
        .from('project_proposals')
        .update({ status: 'accepted' })
        .eq('id', selectedProposal.id);

      if (proposalUpdateError) throw proposalUpdateError;

      toast({
        title: "Success",
        description: "Proposal converted to project successfully",
      });

      setShowConvertDialog(false);
      setSelectedProposal(null);
      fetchProposals();
    } catch (error) {
      console.error('Error converting proposal:', error);
      toast({
        title: "Error",
        description: "Failed to convert proposal to project",
        variant: "destructive",
      });
    } finally {
      setConvertingToProject(false);
    }
  };


  const handleGenerateProposed = async (proposalId: string, currentImageUrl: string) => {
    // Open dialog to collect roof details
    setRoofDetailsForGeneration({ proposalId, currentImageUrl });
    setRoofDetails({ roofType: '', roofColor: '' });
    setShowRoofDetailsDialog(true);
  };

  const handleDeleteProposedImage = async (proposalId: string) => {
    try {
      // @ts-ignore - Bypass deep type instantiation issue with complex schema
      await supabase
        .from('proposal_photos')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('photo_type', 'proposed');

      toast({
        title: "Success",
        description: "Proposed image deleted successfully",
      });

      fetchProposals();
    } catch (error) {
      console.error('Error deleting proposed image:', error);
      toast({
        title: "Error",
        description: "Failed to delete proposed image",
        variant: "destructive",
      });
    }
  };

  const handleConfirmGenerateProposed = async () => {
    if (!roofDetailsForGeneration) return;
    
    const { proposalId, currentImageUrl } = roofDetailsForGeneration;
    
    try {
      setShowRoofDetailsDialog(false);
      setGeneratingProposed(proposalId);
      toast({
        title: "Generating...",
        description: "AI is creating your proposed roof image",
      });

      const { data, error } = await supabase.functions.invoke('generate-proposed-image', {
        body: { 
          currentImageUrl,
          roofType: roofDetails.roofType,
          roofColor: roofDetails.roofColor,
          roofingDetails: proposals.find(p => p.id === proposalId)?.scope_of_work 
        }
      });

      if (error) throw error;

      if (data.proposedImageUrl) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Convert base64 to blob
        const base64Response = await fetch(data.proposedImageUrl);
        const blob = await base64Response.blob();
        
        // Upload to Supabase storage
        const fileName = `${proposalId}/proposed-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(fileName);

        // Save to proposal_photos table
        const { error: dbError } = await supabase
          .from('proposal_photos')
          .insert({
            proposal_id: proposalId,
            photo_url: urlData.publicUrl,
            photo_type: 'proposed',
            uploaded_by: user.id,
            file_size: blob.size,
            display_order: 1
          });

        if (dbError) throw dbError;

        toast({
          title: "Success!",
          description: "Proposed image generated successfully",
        });
        fetchProposals(); // Refresh to show new image
      }
    } catch (error: any) {
      console.error('Error generating proposed image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate proposed image",
        variant: "destructive",
      });
    } finally {
      setGeneratingProposed(null);
    }
  };

  const handleCurrentImageUpload = async (proposalId: string, file: File) => {
    try {
      setUploadingCurrent(proposalId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP files are allowed');
      }

      const maxSizeBytes = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSizeBytes) {
        throw new Error('File size must be less than 50MB');
      }

      toast({
        title: "Uploading...",
        description: "Uploading current image",
      });

      // Upload to Supabase storage
      const fileName = `${proposalId}/current-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      // Save to proposal_photos table
      const { error: dbError } = await supabase
        .from('proposal_photos')
        .insert({
          proposal_id: proposalId,
          photo_url: urlData.publicUrl,
          photo_type: 'current',
          uploaded_by: user.id,
          file_size: file.size,
          display_order: 0
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Current image uploaded successfully",
      });
      fetchProposals(); // Refresh to show new image
    } catch (error: any) {
      console.error('Error uploading current image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload current image",
        variant: "destructive",
      });
    } finally {
      setUploadingCurrent(null);
    }
  };



  const deleteProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      const { error } = await supabase
        .from('project_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal deleted successfully",
      });
      fetchProposals();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast({
        title: "Error",
        description: "Failed to delete proposal",
        variant: "destructive",
      });
    }
  };

  const handleAddQuoteOption = (proposalId: string) => {
    setSelectedProposalForQuote(proposalId);
    setShowAddQuoteDialog(true);
  };

  const handleCreateQuote = async () => {
    if (!selectedProposalForQuote) return;

    try {
      const { data: existingQuotes } = await supabase
        .from('quotes')
        .select('display_order')
        .eq('proposal_id', selectedProposalForQuote)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existingQuotes?.[0]?.display_order ?? -1) + 1;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: newQuoteData, error } = await supabase
        .from('quotes')
        .insert([{
          proposal_id: selectedProposalForQuote,
          option_name: newQuote.option_name,
          total_amount: parseFloat(newQuote.total_amount),
          display_order: nextOrder,
          status: 'draft',
          quote_number: `Q-${Date.now()}`,
          created_by: user.id,
        }] as any)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Automatically create a comparison block for this quote option
      if (newQuoteData) {
        const blockId = crypto.randomUUID();
        const metadata = {
          blockId,
          blockTitle: `${newQuote.option_name} - Design Transformation`,
          blockSubtitle: 'Drag the slider to compare',
          swap: false,
          showBadges: true,
          visibility: 'private',
          notes: '',
          quoteId: newQuoteData.id,
          quoteOptionName: newQuote.option_name,
          quoteAmount: parseFloat(newQuote.total_amount)
        };

        // Create placeholder proposed image entry
        await supabase
          .from('proposal_photos')
          .insert({
            proposal_id: selectedProposalForQuote,
            photo_url: '',
            photo_type: 'proposed',
            comparison_block_id: blockId,
            comparison_metadata: metadata as any,
            uploaded_by: user.id,
            file_size: 0,
            display_order: 1
          });

        // Check if there's a current image and automatically generate proposed image
        const proposal = proposals.find(p => p.id === selectedProposalForQuote);
        if (proposal?.currentImage && newQuote.roofType && newQuote.roofColor) {
          toast({
            title: "Generating AI Image",
            description: "Creating proposed roof visualization...",
          });

          try {
            const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-proposed-image', {
              body: { 
                currentImageUrl: proposal.currentImage,
                roofType: newQuote.roofType,
                roofColor: newQuote.roofColor,
                roofingDetails: proposal.scope_of_work 
              }
            });

            if (aiError) throw aiError;

            if (aiData.proposedImageUrl) {
              // Convert base64 to blob
              const base64Response = await fetch(aiData.proposedImageUrl);
              const blob = await base64Response.blob();
              
              // Upload to Supabase storage
              const fileName = `${selectedProposalForQuote}/proposed-${blockId}-${Date.now()}.png`;
              const { error: uploadError } = await supabase.storage
                .from('project-photos')
                .upload(fileName, blob);

              if (uploadError) throw uploadError;

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('project-photos')
                .getPublicUrl(fileName);

              // Update the proposed photo entry with the actual image URL
              await supabase
                .from('proposal_photos')
                .update({ 
                  photo_url: urlData.publicUrl,
                  file_size: blob.size
                })
                .eq('comparison_block_id', blockId)
                .eq('photo_type', 'proposed');

              toast({
                title: "Success!",
                description: "Quote option created with AI-generated visualization",
              });
            }
          } catch (aiError) {
            console.error('Error generating AI image:', aiError);
            toast({
              title: "Quote Created",
              description: "Quote option created, but AI image generation failed. You can generate it manually later.",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Quote option created. Upload a current image to generate visualizations.",
          });
        }
      }

      setShowAddQuoteDialog(false);
      setSelectedProposalForQuote(null);
      setNewQuote({ option_name: '', total_amount: '', roofType: '', roofColor: '' });
      fetchProposals();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote option",
        variant: "destructive",
      });
    }
  };

  const handleEditQuote = (quote: QuoteOption) => {
    setEditingQuote(quote);
    setEditQuote({
      option_name: quote.option_name,
      total_amount: quote.total_amount.toString(),
    });
    setShowEditQuoteDialog(true);
  };

  const handleUpdateQuote = async () => {
    if (!editingQuote) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          option_name: editQuote.option_name,
          total_amount: parseFloat(editQuote.total_amount),
        })
        .eq('id', editingQuote.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote option updated successfully",
      });

      setShowEditQuoteDialog(false);
      setEditingQuote(null);
      setEditQuote({ option_name: '', total_amount: '' });
      fetchProposals();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote option",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote option? This will also remove the associated design transformation.')) return;

    try {
      // First, find and delete any comparison blocks associated with this quote
      const { data: photos, error: photosError } = await supabase
        .from('proposal_photos')
        .select('comparison_block_id, comparison_metadata')
        .not('comparison_block_id', 'is', null);

      if (photosError) throw photosError;

      // Find the comparison block that has this quoteId in its metadata
      const blockToDelete = photos?.find(photo => {
        const metadata = photo.comparison_metadata as any;
        return metadata?.quoteId === quoteId;
      });

      // Delete the comparison block if found (this will cascade delete the photos)
      if (blockToDelete?.comparison_block_id) {
        const { error: deleteBlockError } = await supabase
          .from('proposal_photos')
          .delete()
          .eq('comparison_block_id', blockToDelete.comparison_block_id);

        if (deleteBlockError) throw deleteBlockError;
      }

      // Now delete the quote
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote option and associated design transformation deleted successfully",
      });
      fetchProposals();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Error",
        description: "Failed to delete quote option",
        variant: "destructive",
      });
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      await updateProposal.mutateAsync({
        proposalId,
        updates: { status: newStatus as ProjectProposal['status'] }
      });
      fetchProposals();
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground">Proposal Management</h2>
          <p className="text-muted-foreground dark:text-muted-foreground">Create and manage customer-facing proposals</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {proposal.property_address}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {proposal.client_name}
                    {!isMobile && isExpired(proposal.expires_at) && proposal.status !== 'accepted' && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200 ml-2">
                        Expired
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                {!isMobile && (
                  <Select 
                    value={proposal.status} 
                    onValueChange={(value) => handleStatusChange(proposal.id, value)}
                  >
                    <SelectTrigger className="w-[120px] h-6 text-xs">
                      <SelectValue>
                        <Badge className={getStatusColor(proposal.status)} variant="outline">
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="negotiating">Under Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Current vs Proposed Preview - Always show both sections */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex gap-2 items-center">
                  {/* Current Image Section */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Current</div>
                    {proposal.currentImage ? (
                      <div 
                        className="relative aspect-video rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImagePreview({ url: proposal.currentImage!, title: 'Current Image' })}
                      >
                        <OptimizedImage
                          src={proposal.currentImage}
                          alt="Current"
                          className="w-full h-full object-cover"
                          sizes="150px"
                          quality={60}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          id={`current-upload-${proposal.id}`}
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleCurrentImageUpload(proposal.id, file);
                            }
                          }}
                          disabled={uploadingCurrent === proposal.id}
                        />
                        <label 
                          htmlFor={`current-upload-${proposal.id}`}
                          className="block cursor-pointer"
                        >
                          <div className={`w-full min-h-[84px] flex flex-col items-center justify-center gap-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${uploadingCurrent === proposal.id ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingCurrent === proposal.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span className="text-xs">Upload Current</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* Proposed Image Section */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Proposed</div>
                    {proposal.proposedImage ? (
                      <div 
                        className="relative aspect-video rounded-md overflow-hidden bg-muted"
                      >
                        <div 
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setImagePreview({ url: proposal.proposedImage!, title: 'Proposed Image' })}
                        >
                          <OptimizedImage
                            src={proposal.proposedImage}
                            alt="Proposed"
                            className="w-full h-full object-cover"
                            sizes="150px"
                            quality={60}
                            showDelete={true}
                            onDelete={() => handleDeleteProposedImage(proposal.id)}
                          />
                        </div>
                      </div>
                    ) : proposal.currentImage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateProposed(proposal.id, proposal.currentImage!)}
                        disabled={generatingProposed === proposal.id}
                        className="w-full h-full min-h-[84px] flex flex-col gap-1"
                      >
                        {generatingProposed === proposal.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4" />
                            <span className="text-xs">Generate with AI</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="w-full h-full min-h-[84px] flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-md bg-muted/20">
                        <span className="text-xs text-muted-foreground">Upload current first</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Options - Hidden on mobile */}
              {!isMobile && proposal.quotes && proposal.quotes.length > 0 && (
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Quote Options</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => handleAddQuoteOption(proposal.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {proposal.quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{quote.option_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ${quote.total_amount.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {quote.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditQuote(quote)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteQuote(quote.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Details - Hidden on mobile */}
              {!isMobile && (
                <div className="space-y-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{proposal.project_type.charAt(0).toUpperCase() + proposal.project_type.slice(1)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {proposal.property_address}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Created {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Expires {format(new Date(proposal.expires_at), 'MMM d, yyyy')}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!isMobile && (!proposal.quotes || proposal.quotes.length === 0) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddQuoteOption(proposal.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Quote Option
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/proposals/${proposal.id}`)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>

                {proposal.status === 'accepted' && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Ready for Contract →
                  </Badge>
                )}

                {!isMobile && proposal.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setShowConvertDialog(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Convert
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteProposal(proposal.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {proposals.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No proposals found. Create your first proposal to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Proposal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent 
          className="max-w-2xl"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Create a customer-facing proposal with pricing and project details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={newProposal.client_name}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={newProposal.client_email}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, client_email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_phone">Client Phone (Optional)</Label>
                <Input
                  id="client_phone"
                  value={newProposal.client_phone}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, client_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type</Label>
                <Select value={newProposal.project_type} onValueChange={(value) => setNewProposal(prev => ({ ...prev, project_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_address">Property Address</Label>
              <GooglePlacesAutocomplete
                value={newProposal.property_address}
                onChange={(value) => setNewProposal(prev => ({ ...prev, property_address: value }))}
                onPlaceSelected={(place) => {
                  console.log('Selected place:', place);
                }}
                placeholder="Start typing an address..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={newProposal.expires_at ? (newProposal.expires_at.includes('T') ? newProposal.expires_at.split('T')[0] : newProposal.expires_at) : ''}
                onChange={(e) => setNewProposal(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope_of_work">Scope of Work (Optional)</Label>
              <Textarea
                id="scope_of_work"
                value={newProposal.scope_of_work}
                onChange={(e) => setNewProposal(prev => ({ ...prev, scope_of_work: e.target.value }))}
                placeholder="Brief description of the work to be performed..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProposal}
              disabled={!newProposal.client_name || !newProposal.client_email || !newProposal.property_address}
            >
              Create Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Project Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Proposal to Project</DialogTitle>
            <DialogDescription>
              This will create a new project from the proposal and mark the proposal as accepted.
              The customer will be automatically assigned to the project.
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-2">
              <p><strong>Proposal:</strong> {selectedProposal.proposal_number}</p>
              <p><strong>Client:</strong> {selectedProposal.client_name}</p>
              <p><strong>Address:</strong> {selectedProposal.property_address}</p>
              <p><strong>Type:</strong> {selectedProposal.project_type}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToProject}
              disabled={convertingToProject}
            >
              {convertingToProject ? 'Converting...' : 'Convert to Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.title}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {imagePreview && (
              <OptimizedImage
                src={imagePreview.url}
                alt={imagePreview.title}
                className="w-full h-auto rounded-md"
                sizes="(max-width: 1024px) 100vw, 896px"
                quality={90}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Quote Option Dialog */}
      <Dialog open={showAddQuoteDialog} onOpenChange={setShowAddQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Quote Option</DialogTitle>
            <DialogDescription>
              Add a pricing option (e.g., Bronze, Silver, Gold) to this proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="option_name">Option Name</Label>
              <Input
                id="option_name"
                value={newQuote.option_name}
                onChange={(e) => setNewQuote(prev => ({ ...prev, option_name: e.target.value }))}
                placeholder="e.g., Standard, Premium, Deluxe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                value={newQuote.total_amount}
                onChange={(e) => setNewQuote(prev => ({ ...prev, total_amount: e.target.value }))}
                placeholder="Enter total price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roof_type">Roof Type</Label>
              <Select
                value={newQuote.roofType}
                onValueChange={(value) => setNewQuote(prev => ({ ...prev, roofType: value }))}
              >
                <SelectTrigger id="roof_type">
                  <SelectValue placeholder="Select roof type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asphalt Shingles">Asphalt Shingles</SelectItem>
                  <SelectItem value="Metal Roofing">Metal Roofing</SelectItem>
                  <SelectItem value="Tile Roofing">Tile Roofing</SelectItem>
                  <SelectItem value="Slate Roofing">Slate Roofing</SelectItem>
                  <SelectItem value="Wood Shingles">Wood Shingles</SelectItem>
                  <SelectItem value="Pine Crest">Pine Crest</SelectItem>
                  <SelectItem value="Flat Roofing">Flat Roofing</SelectItem>
                  <SelectItem value="TPO">TPO</SelectItem>
                  <SelectItem value="EPDM">EPDM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roof_color">Roof Color</Label>
              <Input
                id="roof_color"
                value={newQuote.roofColor}
                onChange={(e) => setNewQuote(prev => ({ ...prev, roofColor: e.target.value }))}
                placeholder="e.g., Charcoal Gray, Weathered Wood, Terra Cotta"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddQuoteDialog(false);
              setNewQuote({ option_name: '', total_amount: '', roofType: '', roofColor: '' });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateQuote}
              disabled={!newQuote.option_name || !newQuote.total_amount || !newQuote.roofType || !newQuote.roofColor}
            >
              Add Quote Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quote Option Dialog */}
      <Dialog open={showEditQuoteDialog} onOpenChange={setShowEditQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quote Option</DialogTitle>
            <DialogDescription>
              Update the pricing option details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_option_name">Option Name</Label>
              <Input
                id="edit_option_name"
                value={editQuote.option_name}
                onChange={(e) => setEditQuote(prev => ({ ...prev, option_name: e.target.value }))}
                placeholder="e.g., Standard, Premium, Deluxe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_total_amount">Total Amount</Label>
              <Input
                id="edit_total_amount"
                type="number"
                value={editQuote.total_amount}
                onChange={(e) => setEditQuote(prev => ({ ...prev, total_amount: e.target.value }))}
                placeholder="Enter total price"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditQuoteDialog(false);
              setEditingQuote(null);
              setEditQuote({ option_name: '', total_amount: '' });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateQuote}
              disabled={!editQuote.option_name || !editQuote.total_amount}
            >
              Update Quote Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roof Details Dialog */}
      <Dialog open={showRoofDetailsDialog} onOpenChange={setShowRoofDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roof Details</DialogTitle>
            <DialogDescription>
              Specify the type and color of roof you want to visualize.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roofType">Roof Type</Label>
              <Select
                value={roofDetails.roofType}
                onValueChange={(value) => setRoofDetails(prev => ({ ...prev, roofType: value }))}
              >
                <SelectTrigger id="roofType">
                  <SelectValue placeholder="Select roof type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asphalt_shingles">Asphalt Shingles</SelectItem>
                  <SelectItem value="metal">Metal Roofing</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="slate">Slate</SelectItem>
                  <SelectItem value="wood_shakes">Wood Shakes</SelectItem>
                  <SelectItem value="flat">Flat/TPO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roofColor">Roof Color</Label>
              <Input
                id="roofColor"
                value={roofDetails.roofColor}
                onChange={(e) => setRoofDetails(prev => ({ ...prev, roofColor: e.target.value }))}
                placeholder="e.g., Charcoal Gray, Weathered Wood, Terra Cotta"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRoofDetailsDialog(false);
              setRoofDetails({ roofType: '', roofColor: '' });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmGenerateProposed}
              disabled={!roofDetails.roofType || !roofDetails.roofColor}
            >
              Generate Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalManager;