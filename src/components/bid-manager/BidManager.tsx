import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileText, 
  Users, 
  Award, 
  Clock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { useBidPackages, useBidStats, useDeleteBidPackage } from '@/hooks/useBidManager';
import { BidPackageDialog } from './BidPackageDialog';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function BidManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [expandedEstimates, setExpandedEstimates] = useState<Record<string, boolean>>({});

  const { data: packages = [], isLoading } = useBidPackages();
  const { data: stats } = useBidStats();
  const deleteMutation = useDeleteBidPackage();

  const filteredPackages = packages.filter(pkg => 
    pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.bid_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group packages by estimate
  const packagesByEstimate = filteredPackages.reduce((acc, pkg) => {
    const estimateId = pkg.estimate_id || 'no-estimate';
    if (!acc[estimateId]) {
      acc[estimateId] = {
        estimate: pkg.project_estimates,
        packages: [],
      };
    }
    acc[estimateId].packages.push(pkg);
    return acc;
  }, {} as Record<string, { estimate: typeof packages[0]['project_estimates']; packages: typeof packages }>);

  const toggleEstimate = (estimateId: string) => {
    setExpandedEstimates(prev => ({
      ...prev,
      [estimateId]: !prev[estimateId],
    }));
  };

  const handleEdit = (id: string) => {
    setSelectedPackageId(id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPackageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (packageToDelete) {
      deleteMutation.mutate(packageToDelete);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      submitted: 'default',
      awarded: 'default',
      closed: 'outline',
    };
    const colors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      submitted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      awarded: 'bg-green-500/10 text-green-600 border-green-500/20',
      closed: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bid Packages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPackages || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.draftCount || 0} draft, {stats?.submittedCount || 0} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bidders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBidders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingBidders || 0} pending, {stats?.submittedBidders || 0} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awarded Bids</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.awardedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.closedCount || 0} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bidding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.submittedCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out for bid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bid packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => {
          setSelectedPackageId(undefined);
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Bid Package
        </Button>
      </div>

      {/* Bid Packages List */}
      <Card>
        <CardHeader>
          <CardTitle>Bid Packages by Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : Object.keys(packagesByEstimate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bid packages found. Create your first bid package to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(packagesByEstimate).map(([estimateId, { estimate, packages: pkgs }]) => (
                <Collapsible
                  key={estimateId}
                  open={expandedEstimates[estimateId] !== false}
                  onOpenChange={() => toggleEstimate(estimateId)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      {expandedEstimates[estimateId] !== false ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex-1 text-left">
                        <span className="font-medium">
                          {estimate?.estimate_number || 'No Estimate'}
                        </span>
                        {estimate?.customer_name && (
                          <span className="text-muted-foreground ml-2">
                            - {estimate.customer_name}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline">{pkgs.length} bid package{pkgs.length !== 1 ? 's' : ''}</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-2">
                      {pkgs.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pkg.title}</span>
                              {getStatusBadge(pkg.status)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {pkg.bid_number}
                              {pkg.bidding_deadline && (
                                <span className="ml-2">
                                  • Due: {format(new Date(pkg.bidding_deadline), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(pkg.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(pkg.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BidPackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bidPackageId={selectedPackageId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bid Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bid package? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
