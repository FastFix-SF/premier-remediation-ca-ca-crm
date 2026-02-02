import { SubContract, useSubContractDocuments, useSubContractBills } from "@/hooks/useSubContracts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface SubContractDocumentsTabProps {
  subContract: SubContract;
}

export function SubContractDocumentsTab({ subContract }: SubContractDocumentsTabProps) {
  const { data: documents = [] } = useSubContractDocuments(subContract.id);
  const { data: bills = [] } = useSubContractBills(subContract.id);

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* Insurance Certificates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Insurance Certificates
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">Active</Badge>
            <Badge variant="secondary" className="text-xs">Cancelled</Badge>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Policy Type</TableHead>
                <TableHead>Policy #</TableHead>
                <TableHead className="text-right">Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="w-12 h-12 opacity-30" />
                      <p>No Records Available</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.policy_type || '-'}</TableCell>
                    <TableCell>{doc.policy_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      {doc.expires_at ? format(new Date(doc.expires_at), 'MM/dd/yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Associated Bills */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Associated Bills
        </h3>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill #</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Bill Date
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </div>
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No bills associated
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {bill.bill_number || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bill.bill_date ? format(new Date(bill.bill_date), 'MM/dd/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {bill.due_date ? format(new Date(bill.due_date), 'MM/dd/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.paid)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
