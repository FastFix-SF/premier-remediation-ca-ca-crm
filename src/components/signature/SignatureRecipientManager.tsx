import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { EnvelopeRecipient } from '@/types/signature';

interface SignatureRecipientManagerProps {
  recipients: Partial<EnvelopeRecipient>[];
  onAddRecipient: () => void;
  onUpdateRecipient: (index: number, updates: Partial<EnvelopeRecipient>) => void;
  onRemoveRecipient: (index: number) => void;
}

export const SignatureRecipientManager: React.FC<SignatureRecipientManagerProps> = ({
  recipients,
  onAddRecipient,
  onUpdateRecipient,
  onRemoveRecipient,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recipients</h3>
        <Button onClick={onAddRecipient} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Recipient
        </Button>
      </div>

      <div className="space-y-4">
        {recipients.map((recipient, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recipient {index + 1}</span>
              {recipients.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveRecipient(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={recipient.name || ''}
                  onChange={(e) => onUpdateRecipient(index, { name: e.target.value })}
                  placeholder="Recipient name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={recipient.email || ''}
                  onChange={(e) => onUpdateRecipient(index, { email: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={recipient.role || 'signer'}
                  onValueChange={(value) => onUpdateRecipient(index, { role: value as EnvelopeRecipient['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signer">Signer</SelectItem>
                    <SelectItem value="cc">CC (Receives Copy)</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Signing Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={recipient.signing_order || 1}
                  onChange={(e) => onUpdateRecipient(index, { signing_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
