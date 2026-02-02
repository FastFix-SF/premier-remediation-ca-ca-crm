import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ContractPaymentSchedule } from './ContractPaymentSchedule';
import { calculatePaymentSchedule, generateAgreementNumber, validateMilestones, type PaymentSchedule, type MilestonePayment } from '@/utils/contractHelpers';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_INFO } from '@/content/contractBoilerplate';
import { toast } from '@/hooks/use-toast';
import { stripMaterialsFromScope } from '@/utils/proposalHelpers';
import { useContractPdf } from '@/hooks/useContractPdf';
import { SignatureEnvelopeModal } from '@/components/signature/SignatureEnvelopeModal';

interface ContractBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
}

export interface ContractFormData {
  agreementNumber: string;
  projectName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  jobsiteAddress: string;
  preparedBy: string;
  preparedOn: string;
  startDate?: string;
  contractPrice: number;
  paymentSchedule: PaymentSchedule;
  scopeOfWork: string;
  projectPhotoUrl?: string;
}

export const ContractBuilderModal: React.FC<ContractBuilderModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  const { generateContractPdf } = useContractPdf();
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectPhoto, setProjectPhoto] = useState<File | null>(null);
  const [projectPhotoPreview, setProjectPhotoPreview] = useState<string>('');
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [contractUrl, setContractUrl] = useState<string>('');

  const [formData, setFormData] = useState<ContractFormData>({
    agreementNumber: generateAgreementNumber(proposal?.id || ''),
    projectName: proposal?.property_address || '',
    customerName: proposal?.client_name || '',
    customerPhone: proposal?.client_phone || '',
    customerEmail: proposal?.client_email || '',
    jobsiteAddress: proposal?.property_address || '',
    preparedBy: COMPANY_INFO.defaultPreparedBy,
    preparedOn: format(new Date(), 'yyyy-MM-dd'),
    startDate: '',
    contractPrice: 0,
    paymentSchedule: calculatePaymentSchedule(0, 30, 0),
    scopeOfWork: proposal?.scope_of_work || '',
  });

  // Calculate initial contract price from proposal pricing
  useEffect(() => {
    const fetchProposalData = async () => {
      if (proposal && isOpen) {
        // Fetch pricing items to calculate total
        const { data: pricingItems } = await supabase
          .from('proposal_pricing')
          .select('total_price')
          .eq('proposal_id', proposal.id);
        
        const totalPrice = pricingItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
        
        // Strip materials from scope of work
        const scopeOfWork = stripMaterialsFromScope(proposal.scope_of_work || '');
        
        // Fetch satellite imagery from quote if linked
        let imageUrl = '';
        if (proposal.quote_request_id) {
          console.log('[Contract Builder] Fetching quote imagery for:', proposal.quote_request_id);
          const { data: quote, error: quoteError } = await supabase
            .from('quote_requests')
            .select('roi_image_url, selected_imagery')
            .eq('id', proposal.quote_request_id)
            .maybeSingle();
          
          if (quoteError) {
            console.error('[Contract Builder] Error fetching quote:', quoteError);
          }
          
          if (quote) {
            console.log('[Contract Builder] Quote data:', { 
              has_roi_image: !!quote.roi_image_url, 
              has_selected_imagery: !!quote.selected_imagery 
            });
            
            // Try roi_image_url first, then selected_imagery
            if (quote.roi_image_url) {
              imageUrl = quote.roi_image_url;
            } else if (quote.selected_imagery && typeof quote.selected_imagery === 'object' && 'url' in quote.selected_imagery) {
              imageUrl = (quote.selected_imagery as { url: string }).url;
            }
            
            if (imageUrl) {
              console.log('[Contract Builder] Setting project photo preview:', imageUrl);
              setProjectPhotoPreview(imageUrl);
            }
          }
        } else {
          console.log('[Contract Builder] No quote_request_id linked to proposal');
        }
        
        setFormData(prev => ({
          ...prev,
          agreementNumber: generateAgreementNumber(proposal.id),
          projectName: proposal.property_address || '',
          customerName: proposal.client_name || '',
          customerPhone: proposal.client_phone || '',
          customerEmail: proposal.client_email || '',
          jobsiteAddress: proposal.property_address || '',
          scopeOfWork,
          contractPrice: totalPrice,
          paymentSchedule: calculatePaymentSchedule(totalPrice, 30, 0),
          projectPhotoUrl: imageUrl || undefined,
        }));
      }
    };
    
    fetchProposalData();
  }, [proposal, isOpen]);

  const handleInputChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (price: number) => {
    const newSchedule = calculatePaymentSchedule(
      price,
      formData.paymentSchedule.material_percent,
      formData.paymentSchedule.progress_percent
    );
    setFormData(prev => ({
      ...prev,
      contractPrice: price,
      paymentSchedule: newSchedule,
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }
      setProjectPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateContract = async () => {
    // Validation
    if (!formData.scopeOfWork || formData.scopeOfWork.trim() === '') {
      toast({
        title: 'Scope of Work Required',
        description: 'Please provide a description of the work to be performed.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.contractPrice || formData.contractPrice <= 0) {
      toast({
        title: 'Contract Price Required',
        description: 'Please enter a valid contract price.',
        variant: 'destructive',
      });
      return;
    }

    // Validate milestones
    const validation = validateMilestones(formData.paymentSchedule.milestones, formData.contractPrice);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Payment Schedule',
        description: validation.errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use project photo from quote or uploaded photo
      let photoUrl = '';
      if (projectPhoto) {
        // Upload to Supabase storage for records
        const photoPath = `${proposal.id}/${projectPhoto.name}`;
        await supabase.storage
          .from('contracts')
          .upload(photoPath, projectPhoto, { upsert: true });
        
        // Use the base64 preview for PDF rendering (more reliable with @react-pdf/renderer)
        photoUrl = projectPhotoPreview;
      } else if (projectPhotoPreview) {
        // Use the image from the quote (already loaded in preview)
        photoUrl = projectPhotoPreview;
      }

      // Prepare contract data for PDF generation
      const contractData = {
        agreementNumber: formData.agreementNumber,
        contractDate: formData.preparedOn,
        projectPhoto: (photoUrl && photoUrl.trim() !== '') ? photoUrl : undefined,
        customer: {
          name: formData.customerName,
          address: formData.jobsiteAddress,
          phone: formData.customerPhone,
          email: formData.customerEmail,
        },
        jobsiteAddress: formData.jobsiteAddress,
        preparedBy: formData.preparedBy,
        contractPrice: formData.contractPrice,
        payments: {
          deposit: formData.paymentSchedule.deposit_amount,
          materialPayment: formData.paymentSchedule.material_amount,
          progressPayment: formData.paymentSchedule.progress_amount > 0 ? formData.paymentSchedule.progress_amount : undefined,
          finalPayment: formData.paymentSchedule.final_amount,
        },
        scopeOfWork: formData.scopeOfWork,
      };

      console.log('[Contract Builder] Generating with photoUrl:', photoUrl ? 'provided' : 'not provided');

      // Generate PDF using @react-pdf/renderer
      const generatedUrl = await generateContractPdf({
        contractData,
        proposalId: proposal.id,
      });

      // Update the proposal with contract details
      const { error: updateError } = await supabase
        .from('project_proposals')
        .update({
          status: 'accepted',
          contract_url: generatedUrl,
          agreement_number: formData.agreementNumber,
          contract_created_at: new Date().toISOString(),
          contract_price: formData.contractPrice,
          payment_schedule: formData.paymentSchedule as any,
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      toast({
        title: 'Contract Generated',
        description: 'Contract PDF has been created successfully',
      });

      // Store URL and open signature modal
      console.log('[Contract Builder] Contract generated, URL:', generatedUrl);
      setContractUrl(generatedUrl);
      setSignatureModalOpen(true);
      // Don't close the contract modal yet - let user see both
      // onClose();
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate contract PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Contract
          </DialogTitle>
          <DialogDescription>
            Generate a professional contract document from this proposal
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Project Photo */}
            {projectPhotoPreview && (
              <div className="space-y-2">
                <Label>Project Photo (From Quote)</Label>
                <div className="flex items-center gap-4">
                  <img
                    src={projectPhotoPreview}
                    alt="Project preview"
                    className="h-32 w-auto max-w-md object-contain rounded border"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Agreement Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agreement-number">Agreement Number</Label>
                <Input
                  id="agreement-number"
                  value={formData.agreementNumber}
                  onChange={(e) => handleInputChange('agreementNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prepared-on">Prepared On</Label>
                <Input
                  id="prepared-on"
                  type="date"
                  value={formData.preparedOn}
                  onChange={(e) => handleInputChange('preparedOn', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-name">Project</Label>
              <Input
                id="project-name"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
              />
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobsite-address">Jobsite Address</Label>
              <Input
                id="jobsite-address"
                value={formData.jobsiteAddress}
                onChange={(e) => handleInputChange('jobsiteAddress', e.target.value)}
              />
            </div>

            <Separator />

            {/* Prepared By & Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepared-by">Prepared By</Label>
                <Input
                  id="prepared-by"
                  value={formData.preparedBy}
                  onChange={(e) => handleInputChange('preparedBy', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (Optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Contract Price */}
            <div className="space-y-2">
              <Label htmlFor="contract-price">Contract Price ($)</Label>
              <Input
                id="contract-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.contractPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
              />
            </div>

            {/* Payment Schedule */}
            <ContractPaymentSchedule
              contractPrice={formData.contractPrice}
              milestones={formData.paymentSchedule.milestones}
              onMilestonesChange={(milestones) => {
                setFormData(prev => ({
                  ...prev,
                  paymentSchedule: { ...prev.paymentSchedule, milestones }
                }));
              }}
            />

            <Separator />

            {/* Scope of Work */}
            <div className="space-y-2">
              <Label htmlFor="scope-of-work">Scope of Work *</Label>
              <Textarea
                id="scope-of-work"
                value={formData.scopeOfWork}
                onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
                rows={10}
                placeholder="Describe the work to be performed..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerateContract} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Contract PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <SignatureEnvelopeModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        contractUrl={contractUrl}
        proposalId={proposal?.id}
        clientEmail={formData.customerEmail}
        clientName={formData.customerName}
      />
    </Dialog>
  );
};
