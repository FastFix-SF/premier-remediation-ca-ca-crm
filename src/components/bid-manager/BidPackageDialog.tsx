import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBidPackage, useCreateBidPackage, useUpdateBidPackage } from '@/hooks/useBidManager';
import { BidDetailsTab } from './tabs/BidDetailsTab';
import { BidItemsTab } from './tabs/BidItemsTab';
import { BidTermsTab } from './tabs/BidTermsTab';
import { BidFilesTab } from './tabs/BidFilesTab';
import { BidBiddersTab } from './tabs/BidBiddersTab';
import { BidSubmissionTab } from './tabs/BidSubmissionTab';
import { toast } from 'sonner';

interface BidPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidPackageId?: string;
}

export function BidPackageDialog({ open, onOpenChange, bidPackageId: initialBidPackageId }: BidPackageDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [currentBidPackageId, setCurrentBidPackageId] = useState<string | undefined>(initialBidPackageId);
  
  const { data: bidPackage, isLoading } = useBidPackage(currentBidPackageId);
  const createMutation = useCreateBidPackage();
  const updateMutation = useUpdateBidPackage();

  const [formData, setFormData] = useState({
    title: '',
    estimate_id: '',
    bidding_deadline: '',
    deadline_time: '',
    status: 'draft',
    bid_manager_id: '',
    reminder_days: 3,
    scope_of_work: '',
    terms: '',
    inclusions: '',
    exclusions: '',
    clarification: '',
  });

  // Reset state when dialog opens/closes or initialBidPackageId changes
  useEffect(() => {
    if (open) {
      setCurrentBidPackageId(initialBidPackageId);
      setActiveTab('details');
    }
  }, [open, initialBidPackageId]);

  useEffect(() => {
    if (bidPackage) {
      setFormData({
        title: bidPackage.title || '',
        estimate_id: bidPackage.estimate_id || '',
        bidding_deadline: bidPackage.bidding_deadline || '',
        deadline_time: bidPackage.deadline_time || '',
        status: bidPackage.status || 'draft',
        bid_manager_id: bidPackage.bid_manager_id || '',
        reminder_days: bidPackage.reminder_days || 3,
        scope_of_work: bidPackage.scope_of_work || '',
        terms: bidPackage.terms || '',
        inclusions: bidPackage.inclusions || '',
        exclusions: bidPackage.exclusions || '',
        clarification: bidPackage.clarification || '',
      });
    } else if (!currentBidPackageId) {
      setFormData({
        title: '',
        estimate_id: '',
        bidding_deadline: '',
        deadline_time: '',
        status: 'draft',
        bid_manager_id: '',
        reminder_days: 3,
        scope_of_work: '',
        terms: '',
        inclusions: '',
        exclusions: '',
        clarification: '',
      });
    }
  }, [bidPackage, currentBidPackageId]);

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      estimate_id: formData.estimate_id === 'none' ? null : formData.estimate_id || null,
      bid_manager_id: formData.bid_manager_id || null,
      bidding_deadline: formData.bidding_deadline || null,
      deadline_time: formData.deadline_time || null,
    };

    if (currentBidPackageId) {
      await updateMutation.mutateAsync({ id: currentBidPackageId, ...dataToSave });
      toast.success('Bid package updated');
    } else {
      const result = await createMutation.mutateAsync(dataToSave);
      if (result?.id) {
        setCurrentBidPackageId(result.id);
        toast.success('Bid package created');
      }
    }
  };

  // Auto-save when switching to tabs that require a bid package ID
  const handleTabChange = async (newTab: string) => {
    const requiresId = ['items', 'files', 'bidders', 'submission'].includes(newTab);
    
    if (requiresId && !currentBidPackageId) {
      if (!formData.title.trim()) {
        toast.error('Please enter a title before accessing this tab');
        return;
      }
      
      // Auto-save the bid package first
      const dataToSave = {
        ...formData,
        estimate_id: formData.estimate_id === 'none' ? null : formData.estimate_id || null,
        bid_manager_id: formData.bid_manager_id || null,
        bidding_deadline: formData.bidding_deadline || null,
        deadline_time: formData.deadline_time || null,
      };

      try {
        const result = await createMutation.mutateAsync(dataToSave);
        if (result?.id) {
          setCurrentBidPackageId(result.id);
          toast.success('Bid package auto-saved');
          setActiveTab(newTab);
        }
      } catch (error) {
        toast.error('Failed to save bid package');
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const isEditing = !!currentBidPackageId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Bid Package' : 'New Bid Package'}
            {bidPackage?.bid_number && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({bidPackage.bid_number})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && currentBidPackageId ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="bidders">Bidders</TabsTrigger>
              <TabsTrigger value="submission">Submission</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <BidDetailsTab
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                isEditing={isEditing}
                isSaving={createMutation.isPending || updateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <BidItemsTab bidPackageId={currentBidPackageId} />
            </TabsContent>

            <TabsContent value="terms" className="mt-4">
              <BidTermsTab
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <BidFilesTab bidPackageId={currentBidPackageId} />
            </TabsContent>

            <TabsContent value="bidders" className="mt-4">
              <BidBiddersTab bidPackageId={currentBidPackageId} />
            </TabsContent>

            <TabsContent value="submission" className="mt-4">
              <BidSubmissionTab bidPackageId={currentBidPackageId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
