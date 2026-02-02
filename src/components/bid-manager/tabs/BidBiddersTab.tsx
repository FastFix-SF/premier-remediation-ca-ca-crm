import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Mail } from 'lucide-react';
import {
  useBidPackageBidders,
  useAddBidder,
  useUpdateBidder,
  useDeleteBidder,
} from '@/hooks/useBidManager';
import { format } from 'date-fns';

interface BidBiddersTabProps {
  bidPackageId?: string;
}

export function BidBiddersTab({ bidPackageId }: BidBiddersTabProps) {
  const { data: bidders = [], isLoading } = useBidPackageBidders(bidPackageId);
  const addMutation = useAddBidder();
  const updateMutation = useUpdateBidder();
  const deleteMutation = useDeleteBidder();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBidder, setNewBidder] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
  });

  const handleAddBidder = async () => {
    if (!bidPackageId || !newBidder.company_name) return;

    await addMutation.mutateAsync({
      bid_package_id: bidPackageId,
      ...newBidder,
    });

    setNewBidder({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
    });
    setDialogOpen(false);
  };

  const handleInvite = async (bidderId: string) => {
    if (!bidPackageId) return;
    await updateMutation.mutateAsync({
      id: bidderId,
      bid_package_id: bidPackageId,
      status: 'invited',
      invited_at: new Date().toISOString(),
      date_sent: new Date().toISOString(),
    });
  };

  const handleWillSubmitChange = async (bidderId: string, willSubmit: boolean) => {
    if (!bidPackageId) return;
    await updateMutation.mutateAsync({
      id: bidderId,
      bid_package_id: bidPackageId,
      will_submit: willSubmit,
    });
  };

  const handleDeleteBidder = async (bidderId: string) => {
    if (!bidPackageId) return;
    await deleteMutation.mutateAsync({ id: bidderId, bid_package_id: bidPackageId });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-500/10 text-gray-600',
      invited: 'bg-blue-500/10 text-blue-600',
      submitted: 'bg-green-500/10 text-green-600',
      awarded: 'bg-amber-500/10 text-amber-600',
      declined: 'bg-red-500/10 text-red-600',
    };
    return (
      <Badge variant="outline" className={colors[status] || ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!bidPackageId) {
    return <div className="text-center py-8 text-muted-foreground">Save the bid package first to add bidders.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Bidder Button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bidder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bidder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={newBidder.company_name}
                  onChange={(e) => setNewBidder({ ...newBidder, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={newBidder.contact_name}
                  onChange={(e) => setNewBidder({ ...newBidder, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBidder.email}
                  onChange={(e) => setNewBidder({ ...newBidder, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newBidder.phone}
                  onChange={(e) => setNewBidder({ ...newBidder, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBidder} disabled={!newBidder.company_name || addMutation.isPending}>
                  Add Bidder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bidders Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : bidders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No bidders yet. Add bidders to invite them to submit bids.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Will Submit</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bid Amount</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bidders.map((bidder) => (
              <TableRow key={bidder.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{bidder.company_name}</p>
                    {bidder.email && (
                      <p className="text-sm text-muted-foreground">{bidder.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{bidder.contact_name || '-'}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={bidder.will_submit}
                    onCheckedChange={(checked) => handleWillSubmitChange(bidder.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  {bidder.invited_at ? format(new Date(bidder.invited_at), 'MMM d') : '-'}
                </TableCell>
                <TableCell>
                  {bidder.submitted_at ? format(new Date(bidder.submitted_at), 'MMM d') : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(bidder.status)}</TableCell>
                <TableCell>
                  {bidder.bid_amount ? `$${bidder.bid_amount.toLocaleString()}` : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {bidder.status === 'pending' && bidder.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInvite(bidder.id)}
                        title="Send Invite"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteBidder(bidder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
