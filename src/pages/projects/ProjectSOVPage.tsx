import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileSpreadsheet, Download, DollarSign, Percent, Calculator, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SOVLineItem {
  id: string;
  project_id: string;
  line_number: number;
  description: string;
  scheduled_value: number;
  previous_billed: number;
  current_billed: number;
  percent_complete: number;
  retainage: number;
  created_at: string;
  updated_at: string;
}

export const ProjectSOVPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    description: '',
    scheduled_value: '',
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [sovItems, setSovItems] = useState<SOVLineItem[]>([]);
  const [sovLoading, setSovLoading] = useState(false);

  // SOV functionality - table will be created in future migration
  // For now, use local state
  
  const addItemMutation = useMutation({
    mutationFn: async (item: { description: string; scheduled_value: number }) => {
      const maxLineNumber = Math.max(0, ...sovItems.map(i => i.line_number));
      const newItem: SOVLineItem = {
        id: crypto.randomUUID(),
        project_id: id!,
        line_number: maxLineNumber + 1,
        description: item.description,
        scheduled_value: item.scheduled_value,
        previous_billed: 0,
        current_billed: 0,
        percent_complete: 0,
        retainage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSovItems(prev => [...prev, newItem]);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Line item added successfully' });
      setIsAddDialogOpen(false);
      setNewItem({ description: '', scheduled_value: '' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add line item', variant: 'destructive' });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, field, value }: { itemId: string; field: string; value: number }) => {
      setSovItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      ));
    },
    onSuccess: () => {
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      setSovItems(prev => prev.filter(item => item.id !== itemId));
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Line item deleted' });
    },
  });

  const handleAddItem = () => {
    if (!newItem.description || !newItem.scheduled_value) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    addItemMutation.mutate({
      description: newItem.description,
      scheduled_value: parseFloat(newItem.scheduled_value),
    });
  };

  const handleFieldChange = (itemId: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateItemMutation.mutate({ itemId, field, value: numValue });
  };

  // Calculate totals
  const totals = sovItems.reduce((acc, item) => ({
    scheduledValue: acc.scheduledValue + (item.scheduled_value || 0),
    previousBilled: acc.previousBilled + (item.previous_billed || 0),
    currentBilled: acc.currentBilled + (item.current_billed || 0),
    retainage: acc.retainage + (item.retainage || 0),
  }), { scheduledValue: 0, previousBilled: 0, currentBilled: 0, retainage: 0 });

  const totalBilled = totals.previousBilled + totals.currentBilled;
  const totalRemaining = totals.scheduledValue - totalBilled;
  const overallPercentComplete = totals.scheduledValue > 0 
    ? (totalBilled / totals.scheduledValue) * 100 
    : 0;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  if (projectLoading || sovLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} - Schedule of Values</h1>
            <p className="text-muted-foreground">{project?.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Line Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Mobilization, Tear-off, Shingle Installation..."
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledValue">Scheduled Value ($)</Label>
                    <Input
                      id="scheduledValue"
                      type="number"
                      placeholder="0.00"
                      value={newItem.scheduled_value}
                      onChange={(e) => setNewItem({ ...newItem, scheduled_value: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full" disabled={addItemMutation.isPending}>
                    {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.scheduledValue)}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Billed</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">% Complete</p>
                  <p className="text-2xl font-bold">{overallPercentComplete.toFixed(1)}%</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SOV Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sovItems.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Line Items Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first line item to track billing progress</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Scheduled Value</TableHead>
                      <TableHead className="text-right">Previous Billed</TableHead>
                      <TableHead className="text-right">Current Billed</TableHead>
                      <TableHead className="text-right">% Complete</TableHead>
                      <TableHead className="text-right">Retainage</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sovItems.map((item) => {
                      const itemTotal = (item.previous_billed || 0) + (item.current_billed || 0);
                      const itemPercent = item.scheduled_value > 0 
                        ? (itemTotal / item.scheduled_value) * 100 
                        : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.line_number}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.scheduled_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              className="w-28 text-right"
                              defaultValue={item.previous_billed}
                              onBlur={(e) => handleFieldChange(item.id, 'previous_billed', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              className="w-28 text-right"
                              defaultValue={item.current_billed}
                              onBlur={(e) => handleFieldChange(item.id, 'current_billed', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={itemPercent >= 100 ? 'default' : 'secondary'}>
                              {itemPercent.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              className="w-24 text-right"
                              defaultValue={item.retainage}
                              onBlur={(e) => handleFieldChange(item.id, 'retainage', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell></TableCell>
                      <TableCell>TOTALS</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.scheduledValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.previousBilled)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.currentBilled)}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{overallPercentComplete.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.retainage)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectSOVPage;
