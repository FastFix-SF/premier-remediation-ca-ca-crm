import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search, RefreshCw, Users, CheckCircle, Clock,
  MoreHorizontal, Trash2, Phone, Mail, ListChecks, Loader2, Link2,
  DollarSign, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhoneDisplay } from '@/lib/phoneUtils';

// Tab Components
import { ClientOverviewTab } from '../components/ClientOverviewTab';
import { ClientFinancialsTab } from '../components/ClientFinancialsTab';
import { ClientDocumentsTab } from '../components/ClientDocumentsTab';
import { ClientCommunicationTab } from '../components/ClientCommunicationTab';
import { ClientPhotosTab } from '../components/ClientPhotosTab';
import { ClientTimelineTab } from '../components/ClientTimelineTab';

interface Client {
  id: string;
  name: string;
  client_name: string | null;
  client_phone: string | null;
  customer_email: string | null;
  address: string | null;
  status: string;
  project_type: string | null;
  created_at: string;
}

interface CCClientsViewProps {
  memberId: string | null;
}

export const CCClientsView: React.FC<CCClientsViewProps> = ({ memberId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [clientTasks, setClientTasks] = useState<any[]>([]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_name, client_phone, customer_email, address, status, project_type, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedClients: Client[] = (data || []).map(p => ({
        id: p.id,
        name: p.client_name || p.name,
        client_name: p.client_name,
        client_phone: p.client_phone,
        customer_email: p.customer_email,
        address: p.address,
        status: p.status,
        project_type: p.project_type,
        created_at: p.created_at,
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openClientDetail = async (client: Client) => {
    setSelectedClient(client);
    setDetailSheetOpen(true);
    setActiveTab('overview');

    // Fetch tasks for the tasks tab
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', client.id)
      .order('created_at', { ascending: false });
    setClientTasks(tasks || []);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', clientId);
      if (error) throw error;
      toast.success('Project deleted');
      fetchClients();
      setDetailSheetOpen(false);
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const generatePortalLink = async (client: Client) => {
    try {
      const { data: existing } = await supabase
        .from('client_portal_access')
        .select('id, url_slug')
        .eq('project_id', client.id)
        .eq('is_active', true)
        .maybeSingle();

      let portalSlug = existing?.url_slug;

      if (!existing) {
        const { data: newAccess, error } = await supabase
          .from('client_portal_access')
          .insert({ project_id: client.id, is_active: true })
          .select('url_slug')
          .maybeSingle();

        if (error) throw error;
        portalSlug = newAccess.url_slug;
      }

      const portalUrl = `https://roofingfriend.com/client-portal/${portalSlug}`;
      await navigator.clipboard.writeText(portalUrl);
      toast.success('Portal link copied!', { description: portalUrl });
    } catch (error) {
      console.error('Error generating portal link:', error);
      toast.error('Failed to generate portal link');
    }
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client_phone?.includes(searchQuery)
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const totalProjects = clients.length;
  const activeProjects = clients.filter(c => c.status === 'active' || c.status === 'in_progress').length;
  const completedProjects = clients.filter(c => c.status === 'completed').length;
  const onHoldProjects = clients.filter(c => c.status === 'on_hold').length;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'on_hold':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Client Command Center</h2>
          <p className="text-white/60 text-sm">Complete view of all clients, financials, and communications</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchClients} className="border-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><Users className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-2xl font-bold text-white">{totalProjects}</p><p className="text-xs text-white/60">Total Clients</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
              <div><p className="text-2xl font-bold text-white">{activeProjects}</p><p className="text-xs text-white/60">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><ListChecks className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-2xl font-bold text-white">{completedProjects}</p><p className="text-xs text-white/60">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20"><Clock className="w-5 h-5 text-amber-400" /></div>
              <div><p className="text-2xl font-bold text-white">{onHoldProjects}</p><p className="text-xs text-white/60">On Hold</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by name, address, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No clients found</p>
        </div>
      ) : (
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Client</TableHead>
                <TableHead className="text-white/60">Address</TableHead>
                <TableHead className="text-white/60">Contact</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="border-white/10 hover:bg-white/5 cursor-pointer" onClick={() => openClientDetail(client)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-300">{getInitials(client.name || 'NA')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{client.client_name || client.name}</p>
                        <p className="text-xs text-white/60">{client.project_type || 'Project'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><p className="text-sm text-white/80 max-w-[200px] truncate">{client.address || 'No address'}</p></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.client_phone && <p className="text-xs text-white/80 flex items-center gap-1"><Phone className="w-3 h-3" />{formatPhoneDisplay(client.client_phone)}</p>}
                      {client.customer_email && <p className="text-xs text-white/60 flex items-center gap-1"><Mail className="w-3 h-3" />{client.customer_email}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge className={getStatusBadgeColor(client.status)}>{client.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-indigo-400" onClick={(e) => { e.stopPropagation(); generatePortalLink(client); }}><Link2 className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-red-400" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10" onClick={() => openClientDetail(client)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12"><AvatarFallback className="bg-indigo-500/20 text-indigo-300">{getInitials(client.name || 'NA')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{client.client_name || client.name}</p>
                  <p className="text-xs text-white/60 truncate">{client.address || 'No address'}</p>
                  <Badge className={getStatusBadgeColor(client.status)} variant="secondary">{client.status}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="w-10 h-10 text-indigo-400" onClick={(e) => { e.stopPropagation(); generatePortalLink(client); }}><Link2 className="w-5 h-5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Sheet with 8 Tabs */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl bg-[#0f0f23] border-white/10 text-white overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14"><AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-xl">{getInitials(selectedClient.name || 'NA')}</AvatarFallback></Avatar>
                  <div>
                    <SheetTitle className="text-white text-xl">{selectedClient.client_name || selectedClient.name}</SheetTitle>
                    <Badge className={getStatusBadgeColor(selectedClient.status)}>{selectedClient.status}</Badge>
                  </div>
                </div>
                <Button variant="outline" className="mt-3 border-indigo-500/30 text-indigo-400" onClick={() => generatePortalLink(selectedClient)}>
                  <Link2 className="w-4 h-4 mr-2" />Copy Portal Link
                </Button>
              </SheetHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="scrollable" className="grid grid-cols-4 lg:grid-cols-8 bg-white/5 mb-4">
                  <TabsTrigger value="overview" variant="scrollable" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="financials" variant="scrollable" className="text-xs">Financials</TabsTrigger>
                  <TabsTrigger value="documents" variant="scrollable" className="text-xs">Docs</TabsTrigger>
                  <TabsTrigger value="tasks" variant="scrollable" className="text-xs">Tasks</TabsTrigger>
                  <TabsTrigger value="communication" variant="scrollable" className="text-xs">Comms</TabsTrigger>
                  <TabsTrigger value="photos" variant="scrollable" className="text-xs">Photos</TabsTrigger>
                  <TabsTrigger value="timeline" variant="scrollable" className="text-xs">Timeline</TabsTrigger>
                  <TabsTrigger value="info" variant="scrollable" className="text-xs">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <ClientOverviewTab projectId={selectedClient.id} clientName={selectedClient.client_name} clientPhone={selectedClient.client_phone} clientEmail={selectedClient.customer_email} address={selectedClient.address} status={selectedClient.status} />
                </TabsContent>

                <TabsContent value="financials">
                  <ClientFinancialsTab 
                    projectId={selectedClient.id}
                    projectName={selectedClient.name}
                    clientName={selectedClient.client_name || undefined}
                    clientEmail={selectedClient.customer_email || undefined}
                    address={selectedClient.address || undefined}
                  />
                </TabsContent>

                <TabsContent value="documents">
                  <ClientDocumentsTab projectId={selectedClient.id} />
                </TabsContent>

                <TabsContent value="tasks">
                  {clientTasks.length === 0 ? (
                    <div className="text-center py-8 text-white/60"><ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No tasks</p></div>
                  ) : (
                    <div className="space-y-2">
                      {clientTasks.map((task) => (
                        <Card key={task.id} className="bg-white/5 border-white/10">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div><p className="font-medium text-white">{task.title}</p>{task.description && <p className="text-xs text-white/60 mt-1">{task.description}</p>}</div>
                              <Badge className={task.is_completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>{task.is_completed ? 'Done' : 'Pending'}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="communication">
                  <ClientCommunicationTab projectId={selectedClient.id} clientPhone={selectedClient.client_phone} />
                </TabsContent>

                <TabsContent value="photos">
                  <ClientPhotosTab projectId={selectedClient.id} />
                </TabsContent>

                <TabsContent value="timeline">
                  <ClientTimelineTab projectId={selectedClient.id} />
                </TabsContent>

                <TabsContent value="info">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium text-white">Project Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-white/40">Type</p><p className="text-white">{selectedClient.project_type || 'Not specified'}</p></div>
                        <div><p className="text-white/40">Status</p><p className="text-white capitalize">{selectedClient.status}</p></div>
                        <div className="col-span-2"><p className="text-white/40">Created</p><p className="text-white">{format(new Date(selectedClient.created_at), 'MMM d, yyyy')}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
