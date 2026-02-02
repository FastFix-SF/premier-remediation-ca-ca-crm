// Types for the Current vs. Proposed Comparison system

export interface ComparisonBlock {
  id: string;
  title: string;
  subtitle: string;
  currentImage?: ProposalPhoto;
  proposedImage?: ProposalPhoto;
  currentCaption?: string;
  proposedCaption?: string;
  notes?: string;
  swap: boolean;
  showBadges: boolean;
  visibility: 'private' | 'public';
  quoteId?: string;
  quoteOptionName?: string;
  quoteAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalPhoto {
  id: string;
  proposal_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'current' | 'proposed' | 'reference' | 'progress';
  description: string | null;
  display_order: number;
  file_size: number;
  comparison_metadata?: ComparisonBlockMetadata;
  comparison_block_id?: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface ComparisonBlockMetadata {
  [key: string]: string | boolean | number | undefined;
  blockId?: string;
  blockTitle?: string;
  blockSubtitle?: string;
  currentCaption?: string;
  proposedCaption?: string;
  notes?: string;
  swap?: boolean;
  showBadges?: boolean;
  visibility?: string;
  quoteId?: string;
  quoteOptionName?: string;
  quoteAmount?: number;
}

export type ComparisonViewMode = 'slider' | 'sideBySide' | 'fade';

export interface ComparisonUploadSlot {
  type: 'current' | 'proposed';
  image?: ProposalPhoto;
  isEmpty: boolean;
}