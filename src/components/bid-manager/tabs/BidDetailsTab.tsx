import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEstimates } from '@/hooks/useEstimates';
import { Loader2 } from 'lucide-react';

interface BidDetailsTabProps {
  formData: {
    title: string;
    estimate_id: string;
    bidding_deadline: string;
    deadline_time: string;
    status: string;
    bid_manager_id: string;
    reminder_days: number;
    scope_of_work: string;
  };
  setFormData: (data: any) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

export function BidDetailsTab({ formData, setFormData, onSave, isEditing, isSaving }: BidDetailsTabProps) {
  const { data: estimates = [] } = useEstimates();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter bid package title"
          />
        </div>

        <div>
          <Label htmlFor="estimate">Linked Estimate</Label>
          <Select
            value={formData.estimate_id}
            onValueChange={(value) => setFormData({ ...formData, estimate_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select estimate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No estimate</SelectItem>
              {estimates.map((est) => (
                <SelectItem key={est.id} value={est.id}>
                  {est.estimate_number} - {est.customer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deadline">Bidding Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.bidding_deadline}
            onChange={(e) => setFormData({ ...formData, bidding_deadline: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="deadline_time">Deadline Time</Label>
          <Input
            id="deadline_time"
            type="time"
            value={formData.deadline_time}
            onChange={(e) => setFormData({ ...formData, deadline_time: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="reminder">Reminder (days before deadline)</Label>
          <Input
            id="reminder"
            type="number"
            min={0}
            value={formData.reminder_days}
            onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="scope">Scope of Work</Label>
          <Textarea
            id="scope"
            value={formData.scope_of_work}
            onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
            placeholder="Describe the scope of work for this bid package..."
            rows={6}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onSave} disabled={!formData.title || isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Bid Package'}
        </Button>
      </div>
    </div>
  );
}
