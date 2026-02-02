import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectProposal {
  id: string;
  proposal_number: string;
  property_address: string;
  project_type: string;
  status: 'draft' | 'sent' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  scope_of_work: string | null;
  notes_disclaimers: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  expires_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  contract_url?: string | null;
  contract_created_at?: string | null;
  agreement_number?: string | null;
  contract_price?: number | null;
  payment_schedule?: any;
}

export interface ProposalPricing {
  id: string;
  proposal_id: string;
  system_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  is_recommended: boolean;
  is_optional: boolean;
  display_order: number;
}

export interface ProposalPhoto {
  id: string;
  proposal_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'current' | 'proposed' | 'reference' | 'progress';
  description: string | null;
  display_order: number;
  file_size: number;
  comparison_metadata?: any;
  comparison_block_id?: string | null;
  uploaded_by?: string;
  created_at?: string;
}

export const useProposalManagement = () => {
  const queryClient = useQueryClient();

  // Fetch single proposal by ID (admin access)
  const fetchProposal = async (proposalId: string): Promise<ProjectProposal> => {
    const { data, error } = await supabase
      .from('project_proposals')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();

    if (error) throw error;
    return data as ProjectProposal;
  };

  // Fetch single proposal by access token (client access)
  const fetchProposalByToken = async (accessToken: string): Promise<ProjectProposal> => {
    const { data, error } = await supabase
      .from('project_proposals')
      .select('*')
      .eq('access_token', accessToken)
      .maybeSingle();

    if (error) throw error;
    return data as ProjectProposal;
  };

  // Fetch proposal pricing
  const fetchProposalPricing = async (proposalId: string): Promise<ProposalPricing[]> => {
    const { data, error } = await supabase
      .from('proposal_pricing')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  };

  // Fetch proposal quotes
  const fetchProposalQuotes = async (proposalId: string) => {
    const { data, error } = await supabase
      .from('quotes')
      .select('id, option_name, total_amount, status, display_order')
      .eq('proposal_id', proposalId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  // Fetch proposal photos
  const fetchProposalPhotos = async (proposalId: string): Promise<ProposalPhoto[]> => {
    const { data, error } = await supabase
      .from('proposal_photos')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('display_order');

    if (error) throw error;
    return (data || []) as ProposalPhoto[];
  };

  // Create new proposal
  const createProposal = useMutation({
    mutationFn: async (proposalData: {
      property_address: string;
      project_type: string;
      client_name: string;
      client_email: string;
      client_phone?: string;
      expires_at?: string;
      scope_of_work?: string;
      notes_disclaimers?: string;
      quote_request_id?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_proposals')
        .insert({
          property_address: proposalData.property_address,
          project_type: proposalData.project_type,
          client_name: proposalData.client_name,
          client_email: proposalData.client_email,
          client_phone: proposalData.client_phone,
          expires_at: proposalData.expires_at,
          scope_of_work: proposalData.scope_of_work,
          notes_disclaimers: proposalData.notes_disclaimers,
          quote_request_id: proposalData.quote_request_id,
          created_by: user.data.user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as ProjectProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal created successfully');
    },
    onError: (error) => {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal');
    }
  });

  // Update proposal
  const updateProposal = useMutation({
    mutationFn: async ({ proposalId, updates }: { proposalId: string; updates: Partial<ProjectProposal> }) => {
      const { data, error } = await supabase
        .from('project_proposals')
        .update(updates)
        .eq('id', proposalId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as ProjectProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal updated successfully');
    },
    onError: (error) => {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal');
    }
  });

  // Update proposal status
  const updateProposalStatus = async (proposalId: string, status: string) => {
    const { error } = await supabase
      .from('project_proposals')
      .update({ status })
      .eq('id', proposalId);

    if (error) throw error;
  };

  // Add pricing item
  const addPricingItem = useMutation({
    mutationFn: async (pricingData: Omit<ProposalPricing, 'id' | 'total_price'>) => {
      const { data, error } = await supabase
        .from('proposal_pricing')
        .insert(pricingData)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-pricing'] });
      toast.success('Pricing item added');
    },
    onError: (error) => {
      console.error('Error adding pricing item:', error);
      toast.error('Failed to add pricing item');
    }
  });

  // Update pricing item
  const updatePricingItem = useMutation({
    mutationFn: async ({ pricingId, updates }: { pricingId: string; updates: Partial<ProposalPricing> }) => {
      const { data, error } = await supabase
        .from('proposal_pricing')
        .update(updates)
        .eq('id', pricingId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-pricing'] });
      toast.success('Pricing item updated');
    },
    onError: (error) => {
      console.error('Error updating pricing item:', error);
      toast.error('Failed to update pricing item');
    }
  });

  // Delete pricing item
  const deletePricingItem = useMutation({
    mutationFn: async (pricingId: string) => {
      const { error } = await supabase
        .from('proposal_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-pricing'] });
      toast.success('Pricing item deleted');
    },
    onError: (error) => {
      console.error('Error deleting pricing item:', error);
      toast.error('Failed to delete pricing item');
    }
  });

  // Upload proposal photo
  const uploadProposalPhoto = useMutation({
    mutationFn: async ({ 
      proposalId, 
      file, 
      photoType, 
      description,
      comparisonBlockId
    }: {
      proposalId: string;
      file: File;
      photoType: 'before' | 'after' | 'current' | 'proposed' | 'reference' | 'progress';
      description?: string;
      comparisonBlockId?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `proposal_${proposalId}_${photoType}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `proposals/${proposalId}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      // Save to database
      const { data, error: dbError } = await supabase
        .from('proposal_photos')
        .insert({
          proposal_id: proposalId,
          photo_url: publicUrl,
          photo_type: photoType,
          description: description || null,
          uploaded_by: user.data.user.id,
          file_size: file.size,
          display_order: 0,
          comparison_block_id: comparisonBlockId || null
        })
        .select()
        .maybeSingle();

      if (dbError) {
        // Clean up uploaded file on database error
        await supabase.storage
          .from('project-photos')
          .remove([filePath]);
        throw dbError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
      toast.success('Photo uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    }
  });

  // Generate shareable link using the proposal's access token for client view
  const generateShareableLink = async (proposalId: string): Promise<string> => {
    try {
      // Fetch the proposal to get its access_token
      const { data: proposal, error } = await supabase
        .from('project_proposals')
        .select('access_token')
        .eq('id', proposalId)
        .maybeSingle();

      if (error || !proposal?.access_token) {
        console.error('Error fetching proposal access token:', error);
        throw new Error('Failed to generate shareable link');
      }

      const baseUrl = window.location.origin;
      // Use the access_token for client access, not the proposal ID
      return `${baseUrl}/proposals/${proposal.access_token}`;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      throw error;
    }
  };

  // Enhanced Export to PDF with properly formatted content
  const exportToPdf = async (proposalId: string): Promise<void> => {
    try {
      const { generateProposalPDF } = await import('@/lib/proposalPdfGenerator');
      
      toast.loading('Generating PDF...', { id: 'pdf-generation' });
      
      // Fetch proposal data
      const proposalData = await fetchProposal(proposalId);
      
      // Fetch quotes and pricing items
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, option_name, total_amount, status')
        .eq('proposal_id', proposalId)
        .order('display_order', { ascending: true });
      
      const pricingItems = await fetchProposalPricing(proposalId);
      
      // Fetch comparison blocks with images
      const { data: photos, error: photosError } = await supabase
        .from('proposal_photos')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });
      
      console.log('Fetched photos:', photos);
      console.log('Photos error:', photosError);
      
      // Find proposal-level photos (no comparison_block_id)
      const currentImage = photos?.find(p => 
        (p.photo_type === 'current' || p.photo_type === 'before') && !p.comparison_block_id
      );
      const proposedImage = photos?.find(p => 
        (p.photo_type === 'proposed' || p.photo_type === 'after') && !p.comparison_block_id
      );
      
      console.log('Found current image:', currentImage?.photo_url);
      console.log('Found proposed image:', proposedImage?.photo_url);
      
      // Group photos into comparison blocks
      const blockMap = new Map();
      
      photos?.forEach(photo => {
        if (photo.comparison_block_id && photo.comparison_metadata) {
          const blockId = photo.comparison_block_id;
          const metadata = photo.comparison_metadata as any;
          if (!blockMap.has(blockId)) {
            blockMap.set(blockId, {
              id: blockId,
              title: metadata.blockTitle || 'Comparison',
              subtitle: metadata.blockSubtitle || '',
              quoteOptionName: metadata.quoteOptionName,
              quoteAmount: metadata.quoteAmount,
              visibility: metadata.visibility || 'private',
              currentImage: currentImage ? { photo_url: currentImage.photo_url } : null,
              proposedImage: null
            });
          }
          
          const block = blockMap.get(blockId);
          if (photo.photo_type === 'proposed') {
            block.proposedImage = { photo_url: photo.photo_url };
          }
        }
      });
      
      // If no comparison blocks exist but we have proposal-level images, create a default block
      if (blockMap.size === 0 && (currentImage || proposedImage)) {
        blockMap.set('default-comparison', {
          id: 'default-comparison',
          title: 'Design Transformation',
          subtitle: '',
          currentImage: currentImage ? { photo_url: currentImage.photo_url } : null,
          proposedImage: proposedImage ? { photo_url: proposedImage.photo_url } : null
        });
      }
      
      const comparisonBlocks = Array.from(blockMap.values()).filter(
        block => block.currentImage || block.proposedImage
      );
      
      console.log('Final comparison blocks for PDF:', comparisonBlocks.length, comparisonBlocks);
      
      // Generate PDF
      await generateProposalPDF({
        proposal: proposalData,
        quotes: quotes || [],
        pricingItems: pricingItems || [],
        comparisonBlocks
      });
      
      toast.success('PDF generated successfully', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-generation' });
      throw error;
    }
  };

  // Generate contract HTML (for client-side PDF generation)
  const generateContract = async (proposalId: string, contractData: any): Promise<{ htmlContent: string; agreementNumber: string; proposalId: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
        body: {
          proposalId,
          ...contractData,
        },
      });

      if (error) throw error;

      // Return HTML content for client-side PDF generation
      return {
        htmlContent: data.htmlContent,
        agreementNumber: data.agreementNumber,
        proposalId: data.proposalId,
      };
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  };

  return {
    fetchProposal,
    fetchProposalByToken,
    fetchProposalPricing,
    fetchProposalQuotes,
    fetchProposalPhotos,
    createProposal,
    updateProposal,
    updateProposalStatus,
    addPricingItem,
    updatePricingItem,
    deletePricingItem,
    uploadProposalPhoto,
    generateShareableLink,
    exportToPdf,
    generateContract,
  };
};