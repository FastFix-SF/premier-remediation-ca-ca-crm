import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Settings, Share, Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { ComparisonBlockEditor } from './ComparisonBlockEditor';
import { ComparisonViewer } from './ComparisonViewer';
import { useComparisonBlocks } from '@/hooks/useComparisonBlocks';
import { toast } from 'sonner';
import type { ComparisonBlock } from '@/types/comparison';

interface CurrentVsProposedComparisonProps {
  proposalId?: string;
  isEditing: boolean;
}

export const CurrentVsProposedComparison: React.FC<CurrentVsProposedComparisonProps> = ({
  proposalId,
  isEditing
}) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const { 
    comparisonBlocks, 
    isLoading,
    createComparisonBlock,
    updateComparisonBlock,
    deleteComparisonBlock,
    generatePublicLink,
    exportBlockToPdf 
  } = useComparisonBlocks(proposalId);

  if (!proposalId && !isEditing) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Current vs. Proposed comparisons will appear here once you create a proposal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateBlock = () => {
    if (!proposalId) {
      toast.error('Please save the proposal first');
      return;
    }
    
    const newBlock = {
      proposalId,
      title: 'Design Transformation',
      subtitle: 'Drag the slider to compare',
      swap: false,
      showBadges: true,
      visibility: 'private' as const,
      notes: ''
    };

    createComparisonBlock.mutate(newBlock, {
      onSuccess: (createdBlock) => {
        setActiveBlockId(createdBlock.id);
        setIsCreatingNew(false);
        toast.success('Comparison block created');
      }
    });
  };

  const handleShare = async (block: ComparisonBlock) => {
    if (!block.currentImage || !block.proposedImage) {
      toast.error('Both Current and Proposed images are required for sharing');
      return;
    }

    try {
      const link = await generatePublicLink(block.id);
      await navigator.clipboard.writeText(link);
      toast.success('Public link copied to clipboard');
    } catch (error) {
      toast.error('Failed to generate public link');
    }
  };

  const handleExportPdf = async (block: ComparisonBlock) => {
    if (!block.currentImage || !block.proposedImage) {
      toast.error('Both Current and Proposed images are required for PDF export');
      return;
    }

    try {
      await exportBlockToPdf(block.id);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const toggleBlockVisibility = (block: ComparisonBlock) => {
    const newVisibility = block.visibility === 'private' ? 'public' : 'private';
    
    updateComparisonBlock.mutate({
      blockId: block.id,
      updates: { visibility: newVisibility }
    }, {
      onSuccess: () => {
        toast.success(`Block is now ${newVisibility}`);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading comparisons...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Current vs. Proposed</h2>
          <p className="text-xs text-muted-foreground">
            Visual comparisons showing the transformation
          </p>
        </div>
        
        {isEditing && proposalId && (
          <Button onClick={handleCreateBlock} disabled={createComparisonBlock.isPending} size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Comparison
          </Button>
        )}
      </div>

      {/* Comparison Blocks */}
      {comparisonBlocks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-medium mb-2">No Comparisons Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first Current vs. Proposed comparison to show clients the transformation.
              </p>
              {isEditing && proposalId && (
                <Button onClick={handleCreateBlock} disabled={createComparisonBlock.isPending} size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Create First Comparison
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comparisonBlocks.map((block, index) => (
            <div key={block.id} className="space-y-1">
              {/* Block Header */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {block.title || `Comparison ${index + 1}`}
                    </h3>
                    {block.quoteOptionName && block.quoteAmount && (
                      <p className="text-xs text-muted-foreground mt-0">
                        {block.quoteOptionName} - <span className="font-semibold text-primary">${block.quoteAmount.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {block.visibility === 'public' ? (
                      <Eye className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <EyeOff className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {block.visibility}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Block Controls */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(block)}
                    disabled={!block.currentImage || !block.proposedImage}
                    className="h-6 w-6 p-0"
                  >
                    <Share className="h-2.5 w-2.5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPdf(block)}
                    disabled={!block.currentImage || !block.proposedImage}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="h-2.5 w-2.5" />
                  </Button>
                  
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBlockVisibility(block)}
                      className="h-6 w-6 p-0"
                    >
                      {block.visibility === 'private' ? (
                        <Eye className="h-2.5 w-2.5" />
                      ) : (
                        <EyeOff className="h-2.5 w-2.5" />
                      )}
                    </Button>
                  )}
                  
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveBlockId(
                        activeBlockId === block.id ? null : block.id
                      )}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this design transformation?')) {
                          deleteComparisonBlock.mutate(block.id);
                        }
                      }}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Block Content */}
              {activeBlockId === block.id && isEditing ? (
                <ComparisonBlockEditor
                  block={block}
                  proposalId={proposalId!}
                  onUpdate={(updates) => {
                    updateComparisonBlock.mutate({
                      blockId: block.id,
                      updates
                    });
                  }}
                  onClose={() => setActiveBlockId(null)}
                />
              ) : (
                <ComparisonViewer
                  block={block}
                  isEditing={isEditing}
                />
              )}

              {index < comparisonBlocks.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};