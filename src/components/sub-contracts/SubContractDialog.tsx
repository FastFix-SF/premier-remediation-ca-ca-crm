import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubContract, useUpdateSubContract } from "@/hooks/useSubContracts";
import { SubContractStatusStepper } from "./SubContractStatusStepper";
import { SubContractDetailsTab } from "./tabs/SubContractDetailsTab";
import { SubContractDocumentsTab } from "./tabs/SubContractDocumentsTab";
import { SubContractTermsTab } from "./tabs/SubContractTermsTab";
import { SubContractFilesTab } from "./tabs/SubContractFilesTab";
import { SubContractNotesTab } from "./tabs/SubContractNotesTab";
import { SubContractBillsTab } from "./tabs/SubContractBillsTab";
import { useDebouncedCallback } from "use-debounce";
import { FileText, FolderOpen, ScrollText, Files, MessageSquare, Receipt, ExternalLink } from "lucide-react";

interface SubContractDialogProps {
  subContract: SubContract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubContractDialog({ subContract, open, onOpenChange }: SubContractDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [localData, setLocalData] = useState<SubContract | null>(null);
  const updateSubContract = useUpdateSubContract();

  useEffect(() => {
    if (subContract) {
      setLocalData(subContract);
    }
  }, [subContract]);

  const debouncedUpdate = useDebouncedCallback((field: string, value: any) => {
    if (!localData) return;
    updateSubContract.mutate({ id: localData.id, [field]: value });
  }, 500);

  const handleChange = (field: string, value: any) => {
    if (!localData) return;
    setLocalData(prev => prev ? { ...prev, [field]: value } : null);
    debouncedUpdate(field, value);
  };

  const handleStatusChange = (status: string) => {
    if (!localData) return;
    setLocalData(prev => prev ? { ...prev, status } : null);
    updateSubContract.mutate({ id: localData.id, status });
  };

  if (!localData) return null;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    committed: 'bg-blue-500',
    submitted: 'bg-yellow-500',
    approved: 'bg-green-500',
    closed: 'bg-purple-500',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">
                  {localData.subject?.[0]?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  Sub-contract
                  {localData.project && (
                    <span className="text-muted-foreground font-normal flex items-center gap-1">
                      {localData.project.name}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[localData.status || 'draft']}>
                    {localData.status?.charAt(0).toUpperCase() + (localData.status?.slice(1) || '')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Agreement #{localData.agreement_number}
                  </span>
                </div>
              </div>
            </div>
            <SubContractStatusStepper
              status={localData.status || 'draft'}
              onStatusChange={handleStatusChange}
            />
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6">
            <TabsList className="h-auto p-0 bg-transparent border-0">
              <TabsTrigger value="details" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <FileText className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <FolderOpen className="w-4 h-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="terms" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <ScrollText className="w-4 h-4" />
                Terms
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Files className="w-4 h-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="bills" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Receipt className="w-4 h-4" />
                Bills
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <MessageSquare className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="details" className="mt-0">
              <SubContractDetailsTab subContract={localData} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="documents" className="mt-0">
              <SubContractDocumentsTab subContract={localData} />
            </TabsContent>
            <TabsContent value="terms" className="mt-0">
              <SubContractTermsTab subContract={localData} />
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <SubContractFilesTab subContract={localData} />
            </TabsContent>
            <TabsContent value="bills" className="mt-0">
              <SubContractBillsTab subContract={localData} />
            </TabsContent>
            <TabsContent value="notes" className="mt-0">
              <SubContractNotesTab subContract={localData} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-4">
            <span>Created: {new Date(localData.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
