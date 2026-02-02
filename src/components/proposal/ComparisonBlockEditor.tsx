import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  RotateCcw, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Wand2,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { ImageFit } from '@/components/ui/ImageFit';
import type { ComparisonBlock } from '@/types/comparison';
import { useProposalPhotos } from '@/hooks/useProposalPhotos';
import { supabase } from '@/integrations/supabase/client';

interface ComparisonBlockEditorProps {
  block: ComparisonBlock;
  proposalId: string;
  onUpdate: (updates: Partial<ComparisonBlock>) => void;
  onClose: () => void;
}

export const ComparisonBlockEditor: React.FC<ComparisonBlockEditorProps> = ({
  block,
  proposalId,
  onUpdate,
  onClose
}) => {
  const [localBlock, setLocalBlock] = useState(block);
  const { uploadProposalPhoto, deleteProposalPhoto } = useProposalPhotos(block.id);
  const [proposalCurrentImage, setProposalCurrentImage] = useState(block.currentImage);
  const [showRoofDetailsDialog, setShowRoofDetailsDialog] = useState(false);
  const [roofDetails, setRoofDetails] = useState({
    roofType: '',
    roofColor: '',
  });
  const [generatingProposed, setGeneratingProposed] = useState(false);

  // Fetch proposal-level current image
  React.useEffect(() => {
    const fetchProposalImage = async () => {
      const { data } = await supabase
        .from('proposal_photos')
        .select('*')
        .eq('proposal_id', proposalId)
        .eq('photo_type', 'current')
        .is('comparison_block_id', null)
        .maybeSingle();
      
      if (data) {
        setProposalCurrentImage(data as any);
      }
    };
    
    fetchProposalImage();
  }, [proposalId]);

  const updateLocalBlock = (updates: Partial<ComparisonBlock>) => {
    const updatedBlock = { ...localBlock, ...updates };
    setLocalBlock(updatedBlock);
    onUpdate(updates);
  };

  // Current image dropzone
  const currentDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    onDrop: (files) => {
      if (files.length > 0) {
        uploadProposalPhoto.mutate({
          file: files[0],
          photoType: 'current',
          comparisonBlockId: block.id,
          proposalId: proposalId,
          description: localBlock.currentCaption
        }, {
          onSuccess: (photo) => {
            updateLocalBlock({ currentImage: photo });
            toast.success('Current image uploaded');
          }
        });
      }
    },
    disabled: uploadProposalPhoto.isPending
  });

  // Proposed image dropzone  
  const proposedDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    onDrop: (files) => {
      if (files.length > 0) {
        uploadProposalPhoto.mutate({
          file: files[0],
          photoType: 'proposed',
          comparisonBlockId: block.id,
          proposalId: proposalId,
          description: localBlock.proposedCaption
        }, {
          onSuccess: (photo) => {
            updateLocalBlock({ proposedImage: photo });
            toast.success('Proposed image uploaded');
          }
        });
      }
    },
    disabled: uploadProposalPhoto.isPending
  });

  const removeCurrentImage = () => {
    if (localBlock.currentImage) {
      deleteProposalPhoto.mutate(localBlock.currentImage.id, {
        onSuccess: () => {
          updateLocalBlock({ currentImage: undefined });
          toast.success('Current image removed');
        }
      });
    }
  };

  const removeProposedImage = () => {
    if (localBlock.proposedImage) {
      deleteProposalPhoto.mutate(localBlock.proposedImage.id, {
        onSuccess: () => {
          updateLocalBlock({ proposedImage: undefined });
          toast.success('Proposed image removed');
        }
      });
    }
  };

  const handleGenerateProposed = () => {
    if (!proposalCurrentImage) {
      toast.error('Please upload a current image first');
      return;
    }
    setRoofDetails({ roofType: '', roofColor: '' });
    setShowRoofDetailsDialog(true);
  };

  const handleConfirmGenerateProposed = async () => {
    if (!proposalCurrentImage) return;
    
    try {
      setShowRoofDetailsDialog(false);
      setGeneratingProposed(true);
      toast.info('AI is creating your proposed roof image...');

      const { data, error } = await supabase.functions.invoke('generate-proposed-image', {
        body: { 
          currentImageUrl: proposalCurrentImage.photo_url,
          roofType: roofDetails.roofType,
          roofColor: roofDetails.roofColor,
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
        const fileName = `comparisons/${block.id}/proposed-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(fileName);

        // Save to proposal_photos table
        const { data: photoData, error: dbError } = await supabase
          .from('proposal_photos')
          .insert({
            proposal_id: proposalId,
            photo_url: urlData.publicUrl,
            photo_type: 'proposed',
            comparison_block_id: block.id,
            uploaded_by: user.id,
            file_size: blob.size,
            display_order: 1
          })
          .select()
          .maybeSingle();

        if (dbError) throw dbError;

        updateLocalBlock({ proposedImage: photoData as any });
        toast.success('Proposed image generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating proposed image:', error);
      toast.error(error.message || 'Failed to generate proposed image');
    } finally {
      setGeneratingProposed(false);
    }
  };

  const swapImages = () => {
    updateLocalBlock({ 
      swap: !localBlock.swap,
      currentCaption: localBlock.proposedCaption,
      proposedCaption: localBlock.currentCaption
    });
    toast.success('Images swapped');
  };

  const getDefaultCaption = (type: 'current' | 'proposed') => {
    if (type === 'current') {
      return localBlock.currentCaption || 'Current roof – source: site/Street View';
    }
    return localBlock.proposedCaption || 'Proposed roof design (render)';
  };

  const isValid = localBlock.currentImage && localBlock.proposedImage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Comparison Block</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={localBlock.title}
              onChange={(e) => updateLocalBlock({ title: e.target.value })}
              placeholder="Design Transformation"
            />
          </div>
          
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={localBlock.subtitle}
              onChange={(e) => updateLocalBlock({ subtitle: e.target.value })}
              placeholder="Drag the slider to compare"
            />
          </div>
        </div>

        <Separator />

        {/* Image Upload Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Images</h3>
            
            <div className="flex items-center gap-4">
              {/* Validation Status */}
              <div className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Ready to share</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600">
                      Both images required
                    </span>
                  </>
                )}
              </div>
              
              {/* Swap Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={swapImages}
                disabled={!localBlock.currentImage || !localBlock.proposedImage}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Swap Images
              </Button>
            </div>
          </div>

          {/* Upload Areas */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Image - Shared from Proposal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-600 text-white">
                  Current
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Shared across all comparisons
                </Badge>
                {localBlock.swap && (
                  <Badge variant="outline" className="text-xs">
                    (Displayed on right)
                  </Badge>
                )}
              </div>
              
              <div className="border-2 border-muted rounded-lg p-6 text-center h-48 flex flex-col items-center justify-center bg-muted/20">
                {proposalCurrentImage ? (
                  <div className="relative w-full h-full">
                    <ImageFit 
                      src={proposalCurrentImage.photo_url} 
                      alt="Current roof (shared)"
                      className="rounded"
                    />
                    <Badge className="absolute bottom-2 right-2 text-xs bg-blue-600 text-white">
                      Proposal Image
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Upload current image in the main proposal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      It will automatically appear in all comparison blocks
                    </p>
                  </div>
                )}
              </div>
              
              {/* Current Caption */}
              <div>
                <Label htmlFor="currentCaption">Current Caption</Label>
                <Input
                  id="currentCaption"
                  value={localBlock.currentCaption || ''}
                  onChange={(e) => updateLocalBlock({ currentCaption: e.target.value })}
                  placeholder={getDefaultCaption('current')}
                />
              </div>
            </div>

            {/* Proposed Image */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">
                  Proposed
                </Badge>
                {localBlock.swap && (
                  <Badge variant="outline" className="text-xs">
                    (Displayed on left)
                  </Badge>
                )}
              </div>
              
              {localBlock.proposedImage ? (
                <div className="relative border-2 border-muted rounded-lg p-6 h-48">
                  <div className="relative w-full h-full">
                    <ImageFit 
                      src={localBlock.proposedImage.photo_url} 
                      alt="Proposed roof"
                      className="rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProposedImage();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : proposalCurrentImage ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateProposed}
                    disabled={generatingProposed}
                    className="w-full h-48 flex flex-col gap-2"
                  >
                    {generatingProposed ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Generating with AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-8 w-8" />
                        <span className="text-sm font-medium">Generate with AI</span>
                        <span className="text-xs text-muted-foreground">Visualize a new roof</span>
                      </>
                    )}
                  </Button>
                  <div className="text-center text-xs text-muted-foreground">or</div>
                  <div
                    {...proposedDropzone.getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                      transition-colors flex flex-col items-center justify-center
                      ${proposedDropzone.isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                      }
                      ${uploadProposalPhoto.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...proposedDropzone.getInputProps()} />
                    {uploadProposalPhoto.isPending ? (
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-xs text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          Upload your own image
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center h-48 flex flex-col items-center justify-center bg-muted/20">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload current image first
                  </p>
                </div>
              )}
              
              {/* Proposed Caption */}
              <div>
                <Label htmlFor="proposedCaption">Proposed Caption</Label>
                <Input
                  id="proposedCaption"
                  value={localBlock.proposedCaption || ''}
                  onChange={(e) => updateLocalBlock({ proposedCaption: e.target.value })}
                  placeholder={getDefaultCaption('proposed')}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showBadges">Show image badges</Label>
              <p className="text-sm text-muted-foreground">
                Display "Current" and "Proposed" labels on images
              </p>
            </div>
            <Switch
              id="showBadges"
              checked={localBlock.showBadges}
              onCheckedChange={(checked) => updateLocalBlock({ showBadges: checked })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={localBlock.notes || ''}
              onChange={(e) => updateLocalBlock({ notes: e.target.value })}
              placeholder="Add any scope notes or context for this comparison..."
              rows={3}
            />
          </div>
        </div>

        {/* Thumbnails Section */}
        {(localBlock.currentImage || localBlock.proposedImage) && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Thumbnail Preview</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Photos Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Current Photos ({localBlock.currentImage ? 1 : 0})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {localBlock.currentImage && (
                      <div className="relative aspect-square bg-muted rounded overflow-hidden">
                        <ImageFit 
                          src={localBlock.currentImage.photo_url}
                          alt="Current roof thumbnail"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Proposed Photos Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Proposed Photos ({localBlock.proposedImage ? 1 : 0})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {localBlock.proposedImage && (
                      <div className="relative aspect-square bg-muted rounded overflow-hidden">
                        <ImageFit 
                          src={localBlock.proposedImage.photo_url}
                          alt="Proposed roof thumbnail"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

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
    </Card>
  );
};