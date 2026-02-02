import React, { useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Estimate, useEstimateBidPackages, useCreateBidPackage, useDeleteBidPackage } from '@/hooks/useEstimates';
import { format } from 'date-fns';

interface EstimateBiddingTabProps {
  estimate: Estimate;
}

export function EstimateBiddingTab({ estimate }: EstimateBiddingTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({
    package_name: '',
    description: '',
  });

  const { data: bidPackages = [], isLoading } = useEstimateBidPackages(estimate.id);
  const createBidPackage = useCreateBidPackage();
  const deleteBidPackage = useDeleteBidPackage();

  const handleAddPackage = async () => {
    await createBidPackage.mutateAsync({
      estimate_id: estimate.id,
      ...newPackage,
    });
    setIsAddDialogOpen(false);
    setNewPackage({ package_name: '', description: '' });
  };

  const handleDeletePackage = async (packageId: string) => {
    await deleteBidPackage.mutateAsync({ id: packageId, estimateId: estimate.id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Bid Packages</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Organize your estimate into bid packages for subcontractor bidding
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Bid Package
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading bid packages...</p>
          ) : bidPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Bid Packages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create bid packages to organize work for subcontractor bidding.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Bid Package
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bidPackages.map((pkg) => (
                <Card key={pkg.id} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold">{pkg.package_name}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeletePackage(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {pkg.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(pkg.created_at), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bid Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name *</Label>
              <Input
                value={newPackage.package_name}
                onChange={(e) => setNewPackage({ ...newPackage, package_name: e.target.value })}
                placeholder="e.g., Roofing Materials, Sheet Metal Work"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newPackage.description}
                onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                placeholder="Describe what's included in this bid package..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPackage} 
              disabled={!newPackage.package_name || createBidPackage.isPending}
            >
              Create Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
