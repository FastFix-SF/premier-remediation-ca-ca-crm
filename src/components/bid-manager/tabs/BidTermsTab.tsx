import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface BidTermsTabProps {
  formData: {
    terms: string;
    inclusions: string;
    exclusions: string;
    clarification: string;
  };
  setFormData: (data: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function BidTermsTab({ formData, setFormData, onSave, isSaving }: BidTermsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="terms">Terms</Label>
        <Textarea
          id="terms"
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          placeholder="Enter terms and conditions..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="inclusions">Inclusions</Label>
        <Textarea
          id="inclusions"
          value={formData.inclusions}
          onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
          placeholder="What is included in this bid package..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="exclusions">Exclusions</Label>
        <Textarea
          id="exclusions"
          value={formData.exclusions}
          onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
          placeholder="What is excluded from this bid package..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="clarification">Clarification</Label>
        <Textarea
          id="clarification"
          value={formData.clarification}
          onChange={(e) => setFormData({ ...formData, clarification: e.target.value })}
          placeholder="Any clarifications or notes..."
          rows={4}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Terms
        </Button>
      </div>
    </div>
  );
}
