import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ComparisonBlock, ComparisonBlockMetadata } from '@/types/comparison';

export const useComparisonBlocks = (proposalId?: string) => {
  const queryClient = useQueryClient();

  // Fetch comparison blocks for a proposal
  const fetchComparisonBlocks = async (proposalId: string): Promise<ComparisonBlock[]> => {
    if (!proposalId) return [];

    // Get all proposal photos for this proposal with their comparison metadata
    const { data: photos, error } = await supabase
      .from('proposal_photos')
      .select('*')
      .eq('proposal_id', proposalId)
      .in('photo_type', ['current', 'proposed', 'before', 'after'])
      .order('comparison_block_id')
      .order('display_order');

    if (error) throw error;

    // Fetch all quotes for this proposal
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('display_order');

    // Find proposal-level photos (comparison_block_id is null)
    const proposalCurrentImage = photos?.find(
      p => (p.photo_type === 'current' || p.photo_type === 'before') && !p.comparison_block_id
    );
    const proposalProposedImage = photos?.find(
      p => (p.photo_type === 'proposed' || p.photo_type === 'after') && !p.comparison_block_id
    );

    // Group photos by comparison block ID
    const blockMap = new Map<string, ComparisonBlock>();
    
    photos?.forEach(photo => {
      // Skip proposal-level photos in the loop
      if (!photo.comparison_block_id) return;
      
      const blockId = photo.comparison_block_id;
      const metadata = (photo.comparison_metadata as ComparisonBlockMetadata) || {};
      
      if (!blockMap.has(blockId)) {
        // Find matching quote if quoteId exists in metadata
        const matchingQuote = metadata.quoteId 
          ? quotes?.find(q => q.id === metadata.quoteId)
          : null;

        // Create new comparison block
        blockMap.set(blockId, {
          id: blockId,
          title: metadata.blockTitle || 'Design Transformation',
          subtitle: metadata.blockSubtitle || 'Drag the slider to compare',
          swap: metadata.swap || false,
          showBadges: metadata.showBadges !== false,
          visibility: (metadata.visibility as 'private' | 'public') || 'private',
          notes: metadata.notes || '',
          quoteId: metadata.quoteId,
          quoteOptionName: matchingQuote?.option_name || metadata.quoteOptionName,
          quoteAmount: matchingQuote?.total_amount || metadata.quoteAmount,
          createdAt: photo.created_at,
          updatedAt: photo.created_at
        });
      }

      const block = blockMap.get(blockId)!;
      
      // Assign photos to proposed only (current comes from proposal level)
      const photoType = photo.photo_type as 'current' | 'proposed' | 'before' | 'after';
      if (photoType === 'proposed' || photoType === 'after') {
        block.proposedImage = photo as any;
        if (!block.proposedCaption && photo.description) {
          block.proposedCaption = photo.description;
        }
      }
    });

    // Assign the proposal-level current image to ALL blocks
    if (proposalCurrentImage) {
      blockMap.forEach(block => {
        block.currentImage = proposalCurrentImage as any;
        if (!block.currentCaption && proposalCurrentImage.description) {
          block.currentCaption = proposalCurrentImage.description;
        }
      });
    }

    // If we have proposal-level photos but no blocks, create a default block
    if (blockMap.size === 0 && (proposalCurrentImage || proposalProposedImage)) {
      const defaultBlockId = 'default-comparison';
      blockMap.set(defaultBlockId, {
        id: defaultBlockId,
        title: 'Design Transformation',
        subtitle: 'Drag the slider to compare',
        swap: false,
        showBadges: true,
        visibility: 'private',
        notes: '',
        currentImage: proposalCurrentImage as any,
        proposedImage: proposalProposedImage as any,
        currentCaption: proposalCurrentImage?.description || '',
        proposedCaption: proposalProposedImage?.description || '',
        createdAt: proposalCurrentImage?.created_at || proposalProposedImage?.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return Array.from(blockMap.values());
  };

  // Query for comparison blocks
  const { 
    data: comparisonBlocks = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['comparison-blocks', proposalId],
    queryFn: () => fetchComparisonBlocks(proposalId!),
    enabled: !!proposalId
  });

  // Create new comparison block
  const createComparisonBlock = useMutation({
    mutationFn: async (blockData: {
      proposalId: string;
      title: string;
      subtitle: string;
      swap: boolean;
      showBadges: boolean;
      visibility: 'private' | 'public';
      notes: string;
      quoteId?: string;
      quoteOptionName?: string;
      quoteAmount?: number;
    }) => {
      const blockId = crypto.randomUUID();
      const metadata: ComparisonBlockMetadata = {
        blockId,
        blockTitle: blockData.title,
        blockSubtitle: blockData.subtitle,
        swap: blockData.swap,
        showBadges: blockData.showBadges,
        visibility: blockData.visibility,
        notes: blockData.notes,
        quoteId: blockData.quoteId,
        quoteOptionName: blockData.quoteOptionName,
        quoteAmount: blockData.quoteAmount
      };

      // Create placeholder entry for proposed image only (current is at proposal level)
      const { data: proposedPhoto, error: proposedError } = await supabase
        .from('proposal_photos')
        .insert({
          proposal_id: blockData.proposalId,
          photo_url: '', // Will be updated when image is uploaded
          photo_type: 'proposed',
          comparison_block_id: blockId,
          comparison_metadata: metadata as any, // Type assertion for JSONB
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
          file_size: 0,
          display_order: 1
        })
        .select()
        .maybeSingle();

      if (proposedError) throw proposedError;

      // Return the created comparison block
      const newBlock: ComparisonBlock = {
        id: blockId,
        title: blockData.title,
        subtitle: blockData.subtitle,
        swap: blockData.swap,
        showBadges: blockData.showBadges,
        visibility: blockData.visibility,
        notes: blockData.notes,
        quoteId: blockData.quoteId,
        quoteOptionName: blockData.quoteOptionName,
        quoteAmount: blockData.quoteAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return newBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
    },
    onError: (error) => {
      console.error('Error creating comparison block:', error);
      toast.error('Failed to create comparison block');
    }
  });

  // Update comparison block
  const updateComparisonBlock = useMutation({
    mutationFn: async ({
      blockId,
      updates
    }: {
      blockId: string;
      updates: Partial<ComparisonBlock>;
    }) => {
      const metadata: Partial<ComparisonBlockMetadata> = {
        blockTitle: updates.title,
        blockSubtitle: updates.subtitle,
        swap: updates.swap,
        showBadges: updates.showBadges,
        visibility: updates.visibility,
        notes: updates.notes
      };

      // Update all photos in this comparison block
      const { error } = await supabase
        .from('proposal_photos')
        .update({ 
          comparison_metadata: metadata as any // Type assertion for JSONB
        })
        .eq('comparison_block_id', blockId);

      if (error) throw error;

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
    },
    onError: (error) => {
      console.error('Error updating comparison block:', error);
      toast.error('Failed to update comparison block');
    }
  });

  // Delete comparison block
  const deleteComparisonBlock = useMutation({
    mutationFn: async (blockId: string) => {
      // Handle default-comparison (proposal-level photos without a real block ID)
      if (blockId === 'default-comparison') {
        // Delete proposal-level photos (those without comparison_block_id)
        const { error } = await supabase
          .from('proposal_photos')
          .delete()
          .eq('proposal_id', proposalId)
          .is('comparison_block_id', null)
          .in('photo_type', ['current', 'proposed', 'before', 'after']);

        if (error) throw error;
      } else {
        // Delete all photos in this comparison block
        const { error } = await supabase
          .from('proposal_photos')
          .delete()
          .eq('comparison_block_id', blockId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-photos'] });
      toast.success('Comparison block deleted');
    },
    onError: (error) => {
      console.error('Error deleting comparison block:', error);
      toast.error('Failed to delete comparison block');
    }
  });

  // Generate public link
  const generatePublicLink = async (blockId: string): Promise<string> => {
    // First update the block visibility to public
    await updateComparisonBlock.mutateAsync({
      blockId,
      updates: { visibility: 'public' }
    });

    const baseUrl = window.location.origin;
    return `${baseUrl}/comparison/${blockId}/public-view`;
  };

  // Export block to PDF
  const exportBlockToPdf = async (blockId: string): Promise<void> => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      toast.info('Generating PDF... Please wait');
      
      // Find the comparison block element
      const element = document.querySelector(`[data-comparison-block="${blockId}"]`) as HTMLElement;
      if (!element) {
        throw new Error('Comparison block not found for PDF generation');
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      
      // Download the PDF
      pdf.save(`comparison-block-${blockId}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  };

  return {
    comparisonBlocks,
    isLoading,
    error,
    createComparisonBlock,
    updateComparisonBlock,
    deleteComparisonBlock,
    generatePublicLink,
    exportBlockToPdf
  };
};