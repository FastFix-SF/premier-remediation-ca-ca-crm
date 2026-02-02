import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, Download, Link, Mail, ChevronDown, Calendar, MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { type ProjectProposal } from '../../hooks/useProposalManagement';
import { ContractBuilderModal } from './ContractBuilderModal';
import { SignatureEnvelopeModal } from '@/components/signature/SignatureEnvelopeModal';
import { useContractPdf } from '@/hooks/useContractPdf';
import { stripMaterialsFromScope } from '@/utils/proposalHelpers';

const ContractManager = () => {
  const [contracts, setContracts] = useState<ProjectProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ProjectProposal | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureContract, setSignatureContract] = useState<ProjectProposal | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { generateContractPdf } = useContractPdf();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      // Fetch only accepted proposals
      const { data, error } = await supabase
        .from('project_proposals')
        .select('*')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts((data || []) as ProjectProposal[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = (contract: ProjectProposal) => {
    setSelectedContract(contract);
    setShowContractBuilder(true);
  };

  const handleDownloadContract = async (contract: ProjectProposal) => {
    setIsDownloading(true);
    try {
      // Fetch current pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .from('proposal_pricing')
        .select('*')
        .eq('proposal_id', contract.id)
        .order('created_at', { ascending: true });

      if (pricingError) throw pricingError;

      // Calculate contract price from current pricing
      const contractPrice = (pricingData || []).reduce((sum, item) => sum + (item.total_price || 0), 0);

      // Calculate payment breakdown
      const depositAmount = contractPrice * 0.10;
      const materialAmount = contractPrice * 0.40;
      const finalAmount = contractPrice - depositAmount - materialAmount;

      // Prepare contract data with current proposal info
      const contractData = {
        agreementNumber: contract.agreement_number || `AGR-${Date.now()}`,
        contractDate: new Date().toISOString().split('T')[0],
        customer: {
          name: contract.client_name || '',
          address: contract.property_address || '',
          phone: contract.client_phone || '',
          email: contract.client_email || '',
        },
        jobsiteAddress: contract.property_address || '',
        preparedBy: 'Admin',
        companyInfo: {
          name: 'Kleen Slate Roofing',
          legalName: 'Kleen Slate Roofing LLC',
          licenseNumber: 'CA LICENSE #1108888',
          phone: '(510) 619-6839',
          email: 'info@kleenslateroofing.com',
        },
        contractPrice,
        payments: {
          deposit: depositAmount,
          materialPayment: materialAmount,
          finalPayment: finalAmount,
        },
        scopeOfWork: stripMaterialsFromScope(contract.scope_of_work || ''),
      };

      // Regenerate PDF with current data
      await generateContractPdf({
        contractData,
        proposalId: contract.id,
      });

      toast({
        title: "Success",
        description: "Contract regenerated and downloaded with current data",
      });
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download contract",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyContractLink = async (contractUrl: string) => {
    try {
      await navigator.clipboard.writeText(contractUrl);
      toast({
        title: "Link Copied",
        description: "Contract link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleOpenSignature = async (contract: ProjectProposal) => {
    setIsDownloading(true);
    try {
      // Fetch current pricing data
      const { data: pricingData, error: pricingError } = await supabase
        .from('proposal_pricing')
        .select('*')
        .eq('proposal_id', contract.id)
        .order('created_at', { ascending: true });

      if (pricingError) throw pricingError;

      // Calculate contract price from current pricing
      const contractPrice = (pricingData || []).reduce((sum, item) => sum + (item.total_price || 0), 0);

      // Calculate payment breakdown
      const depositAmount = contractPrice * 0.10;
      const materialAmount = contractPrice * 0.40;
      const finalAmount = contractPrice - depositAmount - materialAmount;

      // Prepare contract data with current proposal info
      const contractData = {
        agreementNumber: contract.agreement_number || `AGR-${Date.now()}`,
        contractDate: new Date().toISOString().split('T')[0],
        customer: {
          name: contract.client_name || '',
          address: contract.property_address || '',
          phone: contract.client_phone || '',
          email: contract.client_email || '',
        },
        jobsiteAddress: contract.property_address || '',
        preparedBy: 'Admin',
        companyInfo: {
          name: 'Kleen Slate Roofing',
          legalName: 'Kleen Slate Roofing LLC',
          licenseNumber: 'CA LICENSE #1108888',
          phone: '(510) 619-6839',
          email: 'info@kleenslateroofing.com',
        },
        contractPrice,
        payments: {
          deposit: depositAmount,
          materialPayment: materialAmount,
          finalPayment: finalAmount,
        },
        scopeOfWork: stripMaterialsFromScope(contract.scope_of_work || ''),
      };

      // Regenerate PDF with current data
      await generateContractPdf({
        contractData,
        proposalId: contract.id,
      });

      // Fetch the updated contract to get the new URL
      const { data: updatedContract } = await supabase
        .from('project_proposals')
        .select('*')
        .eq('id', contract.id)
        .maybeSingle();

      setSignatureContract((updatedContract as ProjectProposal) || contract);
      setShowSignatureModal(true);
    } catch (error: any) {
      console.error('Error preparing contract for signature:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare contract",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contract Management</h2>
          <p className="text-muted-foreground">Generate and manage contracts for accepted proposals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {contract.property_address}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {contract.client_name}
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" variant="outline">
                  Accepted
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Contract Status */}
              <div className="mb-4 pb-4 border-b">
                {contract.contract_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">Contract Generated</span>
                    </div>
                    {contract.agreement_number && (
                      <div className="text-sm text-muted-foreground">
                        Agreement #: {contract.agreement_number}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-muted-foreground">Contract Not Generated</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{contract.project_type.charAt(0).toUpperCase() + contract.project_type.slice(1)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {contract.property_address}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Accepted {format(new Date(contract.created_at), 'MMM d, yyyy')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!contract.contract_url ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleGenerateContract(contract)}
                    className="flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Generate Contract
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="default">
                        <FileText className="w-3 h-3 mr-1" />
                        Contract Actions
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenSignature(contract)}>
                        <Mail className="w-3 h-3 mr-2" />
                        Sign Contract
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadContract(contract)} disabled={isDownloading}>
                        <Download className="w-3 h-3 mr-2" />
                        {isDownloading ? 'Regenerating...' : 'Download PDF'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyContractLink(contract.contract_url!)}>
                        <Link className="w-3 h-3 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contracts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No contracts available</p>
            <p className="text-sm text-muted-foreground">
              Proposals must be marked as "Accepted" before contracts can be generated.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contract Builder Modal */}
      <ContractBuilderModal
        isOpen={showContractBuilder}
        onClose={() => {
          setShowContractBuilder(false);
          setSelectedContract(null);
          fetchContracts(); // Refresh to show updated contract
        }}
        proposal={selectedContract}
      />

      {/* Signature Modal */}
      {signatureContract && (
        <SignatureEnvelopeModal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setSignatureContract(null);
          }}
          contractUrl={signatureContract.contract_url || ''}
          proposalId={signatureContract.id}
          clientEmail={signatureContract.client_email || ''}
          clientName={signatureContract.client_name || ''}
        />
      )}
    </div>
  );
};

export default ContractManager;
