import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Award, Trophy, DollarSign } from 'lucide-react';
import {
  useBidPackageBidders,
  useBidSubmissions,
  useAwardBid,
  useBidPackage,
} from '@/hooks/useBidManager';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BidSubmissionTabProps {
  bidPackageId?: string;
}

export function BidSubmissionTab({ bidPackageId }: BidSubmissionTabProps) {
  const { data: bidPackage } = useBidPackage(bidPackageId);
  const { data: bidders = [], isLoading: biddersLoading } = useBidPackageBidders(bidPackageId);
  const { data: submissions = [], isLoading: submissionsLoading } = useBidSubmissions(bidPackageId);
  const awardMutation = useAwardBid();

  const submittedBidders = bidders.filter(b => b.status === 'submitted' || b.bid_amount);
  const awardedBidder = bidders.find(b => b.status === 'awarded');
  const isAlreadyAwarded = bidPackage?.status === 'awarded';

  const handleAward = async (bidderId: string) => {
    if (!bidPackageId) return;
    await awardMutation.mutateAsync({ bidderId, bidPackageId });
  };

  if (!bidPackageId) {
    return <div className="text-center py-8 text-muted-foreground">Save the bid package first to view submissions.</div>;
  }

  const isLoading = biddersLoading || submissionsLoading;

  return (
    <div className="space-y-6">
      {/* Award Status */}
      {isAlreadyAwarded && awardedBidder && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">Bid Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{awardedBidder.company_name}</p>
                <p className="text-muted-foreground">{awardedBidder.contact_name}</p>
              </div>
              {awardedBidder.bid_amount && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${awardedBidder.bid_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Awarded Amount</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lowest Bid</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {submittedBidders.length > 0 && submittedBidders.some(b => b.bid_amount)
                ? `$${Math.min(...submittedBidders.filter(b => b.bid_amount).map(b => b.bid_amount!)).toLocaleString()}`
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Highest Bid</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {submittedBidders.length > 0 && submittedBidders.some(b => b.bid_amount)
                ? `$${Math.max(...submittedBidders.filter(b => b.bid_amount).map(b => b.bid_amount!)).toLocaleString()}`
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Average Bid</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {submittedBidders.length > 0 && submittedBidders.some(b => b.bid_amount)
                ? `$${Math.round(submittedBidders.filter(b => b.bid_amount).reduce((acc, b) => acc + b.bid_amount!, 0) / submittedBidders.filter(b => b.bid_amount).length).toLocaleString()}`
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bid Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : submittedBidders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bids submitted yet. Bidders will appear here once they submit their bids.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedBidders.map((bidder) => (
                  <TableRow key={bidder.id}>
                    <TableCell className="font-medium">{bidder.company_name}</TableCell>
                    <TableCell>{bidder.contact_name || '-'}</TableCell>
                    <TableCell>
                      {bidder.submitted_at
                        ? format(new Date(bidder.submitted_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {bidder.bid_amount
                        ? `$${bidder.bid_amount.toLocaleString()}`
                        : 'Pending'}
                    </TableCell>
                    <TableCell>
                      {bidder.status === 'awarded' ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Award className="h-3 w-3 mr-1" />
                          Awarded
                        </Badge>
                      ) : (
                        <Badge variant="outline">Submitted</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isAlreadyAwarded && bidder.bid_amount && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Award className="h-4 w-4 mr-1" />
                              Award
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Award Bid</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to award this bid to {bidder.company_name} for ${bidder.bid_amount.toLocaleString()}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAward(bidder.id)}>
                                Award Bid
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
