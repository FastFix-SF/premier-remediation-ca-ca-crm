import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Loader2, Target, FileText, Paperclip, StickyNote, MapPin, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  project_type: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  estimated_value: number | null;
  created_at: string | null;
  company: string | null;
  first_name: string | null;
  last_name: string | null;
}

const OPPORTUNITY_COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-gray-400' },
  { key: 'new', label: 'Received', color: 'bg-blue-500' },
  { key: 'qualifying', label: 'Quoted', color: 'bg-yellow-500' },
  { key: 'quoted', label: 'Qualifying', color: 'bg-purple-500' },
  { key: 'approved', label: 'Qualified', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export const OpportunitiesManager = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  const createOpportunity = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: 'New Opportunity',
          email: '',
          status: 'contacted',
          source: 'manual',
        }])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setSelectedOpportunity(data as Opportunity);
      setDialogOpen(true);
      toast.success('Opportunity created');
    },
  });

  const updateOpportunity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Opportunity> & { id: string }) => {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const deleteOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setDialogOpen(false);
      toast.success('Opportunity deleted');
    },
  });

  const filteredOpportunities = useMemo(() => {
    if (!searchQuery) return opportunities;
    const query = searchQuery.toLowerCase();
    return opportunities.filter((opp) =>
      opp.name?.toLowerCase().includes(query) ||
      opp.address?.toLowerCase().includes(query) ||
      opp.email?.toLowerCase().includes(query)
    );
  }, [opportunities, searchQuery]);

  const getOpportunitiesByStatus = (status: string) => {
    return filteredOpportunities.filter((opp) => opp.status === status);
  };

  const handleCardClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDialogOpen(true);
  };

  const handleFieldChange = (field: keyof Opportunity, value: any) => {
    if (!selectedOpportunity) return;
    setSelectedOpportunity({ ...selectedOpportunity, [field]: value });
    updateOpportunity.mutate({ id: selectedOpportunity.id, [field]: value });
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Opportunities
          </h2>
          <p className="text-muted-foreground text-sm">
            {opportunities.length} total opportunities
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for Opportunities"
              className="pl-9"
            />
          </div>
          <Button onClick={() => createOpportunity.mutate()} disabled={createOpportunity.isPending}>
            {createOpportunity.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Opportunity
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 h-full">
          {OPPORTUNITY_COLUMNS.map((column) => {
            const columnOpps = getOpportunitiesByStatus(column.key);
            return (
              <div key={column.key} className="flex flex-col bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 p-3 border-b">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-medium text-sm">{column.label}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnOpps.length}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {columnOpps.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => handleCardClick(opp)}
                        className="bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <p className="font-medium text-sm truncate">{opp.name}</p>
                        {opp.address && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {opp.address}
                          </p>
                        )}
                        {opp.estimated_value && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Est: {formatCurrency(opp.estimated_value)}
                          </p>
                        )}
                      </div>
                    ))}
                    {columnOpps.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        No opportunities
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOpportunity && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Badge className={
                    selectedOpportunity.status === 'approved' ? 'bg-green-100 text-green-700' :
                    selectedOpportunity.status === 'lost' ? 'bg-red-100 text-red-700' :
                    selectedOpportunity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }>
                    {OPPORTUNITY_COLUMNS.find(c => c.key === selectedOpportunity.status)?.label || selectedOpportunity.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Opp. #{selectedOpportunity.id.slice(0, 8)}</span>
                </div>
                <DialogTitle className="text-xl flex items-center justify-between">
                  <span>{selectedOpportunity.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteOpportunity.mutate(selectedOpportunity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    <Paperclip className="h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-6">
                  {/* Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2 text-red-600">
                        📋 Details
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Project Type</Label>
                          <Input
                            value={selectedOpportunity.project_type || ''}
                            onChange={(e) => handleFieldChange('project_type', e.target.value)}
                            placeholder="Service needed"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Contact Name</Label>
                          <Input
                            value={selectedOpportunity.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Contact name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <Input
                            type="email"
                            value={selectedOpportunity.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            placeholder="Email"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Phone</Label>
                          <Input
                            value={selectedOpportunity.phone || ''}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            placeholder="Phone"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Referral Source</Label>
                          <Input
                            value={selectedOpportunity.source || ''}
                            onChange={(e) => handleFieldChange('source', e.target.value)}
                            placeholder="Source"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2 text-blue-600">
                        💰 Sales Details
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Estimated Value</Label>
                          <Input
                            type="number"
                            value={selectedOpportunity.estimated_value || ''}
                            onChange={(e) => handleFieldChange('estimated_value', parseFloat(e.target.value) || null)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Status</Label>
                          <select
                            value={selectedOpportunity.status}
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="w-full border rounded-md p-2 text-sm"
                          >
                            {OPPORTUNITY_COLUMNS.map((col) => (
                              <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2 text-green-600">
                      <MapPin className="w-4 h-4" /> Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Address</Label>
                        <Input
                          value={selectedOpportunity.address || ''}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-3">
                          <Label className="text-muted-foreground text-xs">Company</Label>
                          <Input
                            value={selectedOpportunity.company || ''}
                            onChange={(e) => handleFieldChange('company', e.target.value)}
                            placeholder="Company"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Project Description</Label>
                    <Textarea
                      value={selectedOpportunity.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Project notes and description..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                    <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No files attached</p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add File
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                    <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No Records Available</p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
