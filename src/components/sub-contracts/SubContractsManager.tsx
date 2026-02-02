import { useState } from "react";
import { useSubContracts, useCreateSubContract, useDeleteSubContract, SubContract } from "@/hooks/useSubContracts";
import { SubContractDialog } from "./SubContractDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreVertical, Trash2, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function SubContractsManager() {
  const { data: subContracts = [], isLoading } = useSubContracts();
  const createSubContract = useCreateSubContract();
  const deleteSubContract = useDeleteSubContract();
  
  const [selectedSubContract, setSelectedSubContract] = useState<SubContract | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleCreate = async () => {
    const result = await createSubContract.mutateAsync({ subject: 'New Sub-contract' });
    const newContract = subContracts.find(sc => sc.id === result.id) || { ...result, project: null, subcontractor: null } as SubContract;
    setSelectedSubContract(newContract);
    setDialogOpen(true);
  };

  const handleRowClick = (subContract: SubContract) => {
    setSelectedSubContract(subContract);
    setDialogOpen(true);
  };

  const filteredContracts = subContracts.filter(sc => 
    sc.subject.toLowerCase().includes(search.toLowerCase()) ||
    sc.agreement_number?.toLowerCase().includes(search.toLowerCase()) ||
    sc.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    sc.subcontractor?.company?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    committed: 'bg-blue-100 text-blue-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    closed: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for Sub-Contracts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={handleCreate} disabled={createSubContract.isPending} className="gap-2">
          <Plus className="w-4 h-4" />
          Sub-Contract
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sub-contracts found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Agreement #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Subcontractor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((sc) => (
                <TableRow
                  key={sc.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(sc)}
                >
                  <TableCell className="font-medium">{sc.agreement_number || '-'}</TableCell>
                  <TableCell>{sc.subject}</TableCell>
                  <TableCell>{sc.project?.name || '-'}</TableCell>
                  <TableCell>{sc.subcontractor?.company || sc.subcontractor?.contact_name || '-'}</TableCell>
                  <TableCell>
                    {sc.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(sc.date), 'MM/dd/yyyy')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sc.total)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sc.paid)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sc.balance)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[sc.status || 'draft']}>
                      {sc.status?.charAt(0).toUpperCase() + (sc.status?.slice(1) || '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubContract.mutate(sc.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SubContractDialog
        subContract={selectedSubContract}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
