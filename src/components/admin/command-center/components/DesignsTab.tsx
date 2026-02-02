import React, { useState } from 'react';
import { Palette, Plus, Loader2, AlertCircle, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Design {
  id: string;
  name: string;
  design_url: string | null;
  thumbnail_url: string | null;
  category: 'background' | 'logo' | 'illustration' | 'pattern';
  description: string | null;
  status: 'pending' | 'generating' | 'ready' | 'error';
  error_message: string | null;
  created_at: string;
}

interface DesignsTabProps {
  clientId: string;
  designs: Design[];
  onDesignsChange: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'background', label: 'Background' },
  { value: 'logo', label: 'Logo' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'pattern', label: 'Pattern' },
];

export function DesignsTab({ clientId, designs, onDesignsChange }: DesignsTabProps) {
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'background' as const,
    description: '',
    inspiration_url: '',
  });

  const handleCreateDesign = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a design name');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('client_designs').insert({
        client_id: clientId,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        inspiration_url: formData.inspiration_url || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Design request created');
      setShowCreateModal(false);
      setFormData({ name: '', category: 'background', description: '', inspiration_url: '' });
      onDesignsChange();
    } catch (error) {
      console.error('Error creating design:', error);
      toast.error('Failed to create design');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      const { error } = await supabase
        .from('client_designs')
        .delete()
        .eq('id', designId);

      if (error) throw error;

      toast.success('Design deleted');
      onDesignsChange();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500/20 text-blue-400">Generating</Badge>;
      case 'ready':
        return <Badge className="bg-green-500/20 text-green-400">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      background: 'bg-purple-500/20 text-purple-400',
      logo: 'bg-blue-500/20 text-blue-400',
      illustration: 'bg-amber-500/20 text-amber-400',
      pattern: 'bg-green-500/20 text-green-400',
    };
    return (
      <Badge className={colors[category] || 'bg-gray-500/20 text-gray-400'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Palette className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">AI Designs</h4>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Design
        </Button>
      </div>

      {designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Palette className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No designs yet</p>
          <p className="text-xs mt-1">Create a design request to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {designs.map((design) => (
            <div
              key={design.id}
              className="group relative rounded-lg border bg-card overflow-hidden"
            >
              {design.thumbnail_url || design.design_url ? (
                <img
                  src={design.thumbnail_url || design.design_url || ''}
                  alt={design.name}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  {getStatusIcon(design.status)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {design.design_url && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-white hover:bg-white/20"
                    onClick={() => setPreviewDesign(design)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-white hover:bg-red-500/50"
                  onClick={() => handleDeleteDesign(design.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <p className="font-medium text-sm truncate">{design.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryBadge(design.category)}
                  {getStatusBadge(design.status)}
                </div>
                {design.error_message && (
                  <p className="text-xs text-red-400 truncate">{design.error_message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create AI Design</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Design Name</Label>
              <Input
                placeholder="e.g., Hero Background"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v as typeof formData.category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what you want the design to look like..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Inspiration URL (Optional)</Label>
              <Input
                placeholder="https://..."
                value={formData.inspiration_url}
                onChange={(e) => setFormData({ ...formData, inspiration_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDesign} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewDesign} onOpenChange={() => setPreviewDesign(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDesign?.name}</DialogTitle>
          </DialogHeader>
          {previewDesign?.design_url && (
            <img
              src={previewDesign.design_url}
              alt={previewDesign.name}
              className="w-full h-auto rounded-lg"
            />
          )}
          {previewDesign?.description && (
            <p className="text-sm text-muted-foreground">{previewDesign.description}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
