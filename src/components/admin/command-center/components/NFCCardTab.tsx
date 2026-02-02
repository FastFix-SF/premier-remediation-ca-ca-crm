import React, { useState } from 'react';
import { CreditCard, Plus, Loader2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NFCCard {
  id: string;
  card_name: string;
  design_url: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'generating' | 'ready' | 'error';
  design_instructions: string | null;
  error_message: string | null;
  created_at: string;
}

interface NFCCardTabProps {
  clientId: string;
  cards: NFCCard[];
  onCardsChange: () => void;
}

export function NFCCardTab({ clientId, cards, onCardsChange }: NFCCardTabProps) {
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewCard, setPreviewCard] = useState<NFCCard | null>(null);
  const [formData, setFormData] = useState({
    card_name: '',
    design_instructions: '',
  });

  const handleCreateCard = async () => {
    if (!formData.card_name.trim()) {
      toast.error('Please enter a card name');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('client_nfc_cards').insert({
        client_id: clientId,
        card_name: formData.card_name,
        design_instructions: formData.design_instructions || null,
        status: 'draft',
      });

      if (error) throw error;

      toast.success('NFC card created');
      setShowCreateModal(false);
      setFormData({ card_name: '', design_instructions: '' });
      onCardsChange();
    } catch (error) {
      console.error('Error creating NFC card:', error);
      toast.error('Failed to create NFC card');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('client_nfc_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast.success('NFC card deleted');
      onCardsChange();
    } catch (error) {
      console.error('Error deleting NFC card:', error);
      toast.error('Failed to delete NFC card');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">NFC Cards</h4>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CreditCard className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No NFC cards yet</p>
          <p className="text-xs mt-1">Create a card to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {card.thumbnail_url ? (
                <img
                  src={card.thumbnail_url}
                  alt={card.card_name}
                  className="w-16 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                  {getStatusIcon(card.status)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{card.card_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(card.status)}
                  {card.error_message && (
                    <span className="text-xs text-red-400 truncate">
                      {card.error_message}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {card.design_url && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8"
                    onClick={() => setPreviewCard(card)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => handleDeleteCard(card.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create NFC Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card Name</Label>
              <Input
                placeholder="e.g., Business Card v1"
                value={formData.card_name}
                onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Design Instructions (Optional)</Label>
              <Textarea
                placeholder="Describe the design you want..."
                value={formData.design_instructions}
                onChange={(e) => setFormData({ ...formData, design_instructions: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCard} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewCard?.card_name}</DialogTitle>
          </DialogHeader>
          {previewCard?.design_url && (
            <img
              src={previewCard.design_url}
              alt={previewCard.card_name}
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
