import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, ExternalLink, Calendar, FileText, Check } from 'lucide-react';
import { SubmittalItemPanel } from './SubmittalItemPanel';
import { AddSubmittalItemDialog } from './AddSubmittalItemDialog';
import { cn } from '@/lib/utils';

interface SubmittalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submittalId: string;
}

const STATUS_STEPS = [
  { id: 'draft', label: 'Draft' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'response-required', label: 'Response Required' },
  { id: 'approved', label: 'Approved' },
];

export const SubmittalDetailDialog: React.FC<SubmittalDetailDialogProps> = ({
  open,
  onOpenChange,
  submittalId,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teamMembers = [] } = useTeamMembers();

  // Fetch submittal details
  const { data: submittal, isLoading } = useQuery({
    queryKey: ['submittal-detail', submittalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('submittals')
        .select('*')
        .eq('id', submittalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!submittalId,
  });

  // Fetch submittal items
  const { data: items = [] } = useQuery({
    queryKey: ['submittal-items', submittalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('submittal_items')
        .select('*')
        .eq('submittal_id', submittalId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!submittalId,
  });

  // Update submittal mutation
  const updateSubmittal = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await (supabase as any)
        .from('submittals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', submittalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-detail', submittalId] });
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
    },
  });

  const handleFieldUpdate = (field: string, value: any) => {
    updateSubmittal.mutate({ [field]: value });
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.full_name || member?.email || 'Unassigned';
  };

  const getMemberAvatar = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.avatar_url || '';
  };

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{submittal?.name}</DialogTitle>
            <Badge variant="outline" className="capitalize">{submittal?.status || 'draft'}</Badge>
          </div>
        </DialogHeader>

        {/* Status Pipeline */}
        <div className="flex items-center justify-between py-4 px-2 bg-muted/30 rounded-lg mb-6">
          {STATUS_STEPS.map((step, index) => {
            const currentIndex = getStatusIndex(submittal?.status || 'draft');
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleFieldUpdate('status', step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                    isCurrent ? "border-primary bg-primary text-primary-foreground" : 
                    isActive ? "border-primary bg-primary/20" : "border-muted-foreground/30"
                  )}>
                    {isActive && index < currentIndex ? <Check className="h-4 w-4" /> : (index + 1)}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                </button>
                {index < STATUS_STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2",
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Column 1 - Basic Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h3>
            
            {/* Submitted By */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Submitted By</Label>
              <Select 
                value={submittal?.submitted_by || ''} 
                onValueChange={(value) => handleFieldUpdate('submitted_by', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select team member">
                    {submittal?.submitted_by && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getMemberAvatar(submittal.submitted_by)} />
                          <AvatarFallback className="text-xs">
                            {getMemberName(submittal.submitted_by).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getMemberName(submittal.submitted_by)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(member.full_name || member.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.full_name || member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coordinator */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Coordinator</Label>
              <Select 
                value={submittal?.coordinator_id || ''} 
                onValueChange={(value) => handleFieldUpdate('coordinator_id', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select coordinator">
                    {submittal?.coordinator_id && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getMemberAvatar(submittal.coordinator_id)} />
                          <AvatarFallback className="text-xs">
                            {getMemberName(submittal.coordinator_id).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getMemberName(submittal.coordinator_id)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(member.full_name || member.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.full_name || member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Received */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Received</Label>
              <Input
                type="date"
                value={submittal?.date_received ? format(new Date(submittal.date_received), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFieldUpdate('date_received', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-background"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <Input
                type="date"
                value={submittal?.due_date ? format(new Date(submittal.due_date), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFieldUpdate('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-background"
              />
            </div>

            {/* Sent To (CC) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sent To (CC)</Label>
              <Input
                value={submittal?.sent_to || ''}
                onChange={(e) => handleFieldUpdate('sent_to', e.target.value)}
                placeholder="Enter recipients"
                className="bg-background"
              />
            </div>

            {/* Plan Sheet Numbers */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Plan Sheet Numbers</Label>
              <Input
                value={submittal?.plan_sheet_numbers || ''}
                onChange={(e) => handleFieldUpdate('plan_sheet_numbers', e.target.value)}
                placeholder="e.g., A-101, A-102"
                className="bg-background"
              />
            </div>

            {/* Spec Section */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Spec Section</Label>
              <Input
                value={submittal?.spec_section || ''}
                onChange={(e) => handleFieldUpdate('spec_section', e.target.value)}
                placeholder="e.g., 07 31 00"
                className="bg-background"
              />
            </div>

            {/* External Link */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">External Link</Label>
              <div className="flex gap-2">
                <Input
                  value={submittal?.external_link || ''}
                  onChange={(e) => handleFieldUpdate('external_link', e.target.value)}
                  placeholder="https://..."
                  className="bg-background flex-1"
                />
                {submittal?.external_link && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(submittal.external_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Column 2 - Internal Approver */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Internal Approver</h3>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Internal Approver</Label>
              <Select 
                value={submittal?.internal_approver_id || ''} 
                onValueChange={(value) => handleFieldUpdate('internal_approver_id', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select approver">
                    {submittal?.internal_approver_id && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getMemberAvatar(submittal.internal_approver_id)} />
                          <AvatarFallback className="text-xs">
                            {getMemberName(submittal.internal_approver_id).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getMemberName(submittal.internal_approver_id)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(member.full_name || member.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.full_name || member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Response</Label>
              <Select 
                value={submittal?.internal_response || ''} 
                onValueChange={(value) => handleFieldUpdate('internal_response', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
                  <SelectItem value="revise-resubmit">Revise & Resubmit</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Comments</Label>
              <Textarea
                value={submittal?.internal_comments || ''}
                onChange={(e) => handleFieldUpdate('internal_comments', e.target.value)}
                placeholder="Add internal comments..."
                rows={4}
                className="bg-background"
              />
            </div>
          </div>

          {/* Column 3 - External Approver */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">External Approver</h3>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">External Approver</Label>
              <Input
                value={submittal?.external_approver || ''}
                onChange={(e) => handleFieldUpdate('external_approver', e.target.value)}
                placeholder="Enter external approver name"
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select 
                value={submittal?.external_status || ''} 
                onValueChange={(value) => handleFieldUpdate('external_status', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
                  <SelectItem value="revise-resubmit">Revise & Resubmit</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Comments</Label>
              <Textarea
                value={submittal?.external_comments || ''}
                onChange={(e) => handleFieldUpdate('external_comments', e.target.value)}
                placeholder="Add external comments..."
                rows={4}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Submittal Items Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Submittal Items</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddItemDialog(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Item to Submittal
            </Button>
          </div>

          {/* Items Table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Item #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Item Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Date Sent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Date Received</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No items added yet. Click "Item to Submittal" to add one.
                    </td>
                  </tr>
                ) : (
                  items.map((item: any) => (
                    <tr 
                      key={item.id} 
                      className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <td className="px-4 py-3 text-sm">{item.item_number}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.date_sent ? format(new Date(item.date_sent), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.date_received ? format(new Date(item.date_received), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.status || 'pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item Detail Panel */}
        {selectedItemId && (
          <SubmittalItemPanel
            itemId={selectedItemId}
            submittalId={submittalId}
            onClose={() => setSelectedItemId(null)}
          />
        )}

        {/* Add Item Dialog */}
        <AddSubmittalItemDialog
          open={showAddItemDialog}
          onOpenChange={setShowAddItemDialog}
          submittalId={submittalId}
          onItemAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['submittal-items', submittalId] });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
