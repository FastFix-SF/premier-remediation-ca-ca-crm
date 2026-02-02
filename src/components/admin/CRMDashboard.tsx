
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, DollarSign, Plus, Search, Filter, Edit, Trash2, CheckCircle, Clock, AlertCircle, Eye, EyeOff, MoreHorizontal, Phone, Calculator, Workflow } from 'lucide-react';
import { CrmWorkflowDashboard } from '../crm/CrmWorkflowDashboard';
import { CrmAutomationProvider } from '../crm/CrmAutomationProvider';
import CallLogsTable from './CallLogsTable';
import QuoteRequests from './QuoteRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  status: string;
  source?: string;
  project_type?: string;
  timeline?: string;
  budget_range?: string;
  created_at: string;
  notes?: string;
}

interface LeadStats {
  total: number;
  newThisWeek: number;
  qualified: number;
  conversionRate: number;
}

const CRMDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total: 0, newThisWeek: 0, qualified: 0, conversionRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'new',
    source: '',
    project_type: '',
    timeline: '',
    budget_range: '',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow');
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [sortBy, sortOrder]);

  // Validate contact form field mapping
  useEffect(() => {
    const validateContactFormMapping = () => {
      const requiredContactFormFields = [
        'name',      // Full Name
        'email',     // Email Address  
        'phone',     // Phone Number
        'project_type', // Service Needed (mapped from contact form 'service')
        'source',    // How Did You Find Us? (mapped from contact form 'referralSource') 
        'notes'      // Project Details (mapped from contact form 'message')
        // Note: company_name is optional, so not included in required fields
      ];

      // Check if any lead is missing expected fields
      const leadsWithMissingFields = leads.filter(lead => {
        return requiredContactFormFields.some(field => {
          const value = lead[field as keyof Lead];
          return value === null || value === undefined || value === '';
        });
      });

      if (leadsWithMissingFields.length > 0) {
        console.warn('⚠️ CONTACT FORM MAPPING ISSUE: Some leads are missing expected fields from contact form:');
        leadsWithMissingFields.forEach(lead => {
          const missingFields = requiredContactFormFields.filter(field => {
            const value = lead[field as keyof Lead];
            return value === null || value === undefined || value === '';
          });
          console.warn(`Lead ${lead.id} (${lead.name}) missing:`, missingFields);
        });
        
        toast({
          title: "Developer Alert",
          description: `${leadsWithMissingFields.length} leads missing contact form fields. Check console for details.`,
          variant: "destructive",
        });
      } else if (leads.length > 0) {
        console.log('✅ CONTACT FORM MAPPING: All leads have required contact form fields');
      }
    };

    if (leads.length > 0) {
      validateContactFormMapping();
    }
  }, [leads, toast]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Get total leads
      const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Get new leads this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newThisWeek } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get qualified leads
      const { count: qualified } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qualified');

      // Get closed won leads for conversion rate
      const { count: closedWon } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed_won');

      const conversionRate = total ? ((closedWon || 0) / total * 100) : 0;

      setStats({
        total: total || 0,
        newThisWeek: newThisWeek || 0,
        qualified: qualified || 0,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-3 h-3" />;
      case 'qualified': return <CheckCircle className="w-3 h-3" />;
      case 'closed_won': return <CheckCircle className="w-3 h-3" />;
      case 'closed_lost': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'estimate_scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proposal_sent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed_won': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed_lost': return 'bg-red-100 text-red-800 border-red-200';
      case 'nurturing': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatServiceName = (service: string) => {
    const serviceMap: Record<string, string> = {
      'residential-installation': 'Residential Installation',
      'commercial-roofing': 'Commercial Roofing',
      'roof-repair': 'Roof Repair',
      'roof-inspection': 'Roof Inspection',
      'storm-damage': 'Storm Damage Repair',
      'maintenance': 'Maintenance',
      'consultation': 'Consultation Only'
    };
    return serviceMap[service] || service;
  };

  const formatSourceName = (source: string) => {
    const sourceMap: Record<string, string> = {
      'google-search': 'Google Search',
      'referral-friend': 'Referral from Friend',
      'social-media': 'Social Media',
      'online-directory': 'Online Directory',
      'previous-customer': 'Previous Customer',
      'advertisement': 'Advertisement',
      'other': 'Other'
    };
    return sourceMap[source] || source;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeads(
      selectedLeads.length === filteredLeads.length 
        ? [] 
        : filteredLeads.map(lead => lead.id)
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .in('id', selectedLeads);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedLeads.length} leads to ${formatStatus(newStatus)}`,
      });

      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error('Error updating leads:', error);
      toast({
        title: "Error",
        description: "Failed to update leads",
        variant: "destructive",
      });
    }
  };

  const handleEditLead = async (lead: Lead) => {
    try {
      // Validate required fields
      if (!lead.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Full Name is required",
          variant: "destructive",
        });
        return;
      }

      if (!lead.email?.trim()) {
        toast({
          title: "Validation Error", 
          description: "Email Address is required",
          variant: "destructive",
        });
        return;
      }

      if (!lead.phone?.trim()) {
        toast({
          title: "Validation Error",
          description: "Phone Number is required", 
          variant: "destructive",
        });
        return;
      }

      console.log('Updating lead with data:', {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        project_type: lead.project_type,
        source: lead.source,
        notes: lead.notes,
        status: lead.status,
        company_name: lead.company_name
      });

      const { error } = await supabase
        .from('leads')
        .update({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company_name: lead.company_name,
          status: lead.status,
          source: lead.source,
          project_type: lead.project_type,
          timeline: lead.timeline,
          budget_range: lead.budget_range,
          notes: lead.notes
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });

      setShowEditDialog(false);
      setEditingLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    const leadId = leadToDelete.id;
    try {
      // First attempt: delete the lead directly
      let { error } = await supabase.from('leads').delete().eq('id', leadId);

      if (error) {
        // Handle FK constraint: dependent records exist
        if ((error as any)?.code === '23503') {
          console.warn('FK constraint when deleting lead. Removing dependent aerial_images for lead:', leadId);
          const { error: depErr } = await supabase
            .from('aerial_images')
            .delete()
            .eq('lead_id', leadId);

          if (depErr) throw depErr;

          // Retry deleting the lead after cleaning dependencies
          const retry = await supabase.from('leads').delete().eq('id', leadId);
          if (retry.error) throw retry.error;

          toast({
            title: 'Lead deleted',
            description: `${leadToDelete.name} and related aerial imagery were removed.`,
          });
        } else {
          // Unknown error
          throw error;
        }
      } else {
        toast({ title: 'Lead deleted', description: `${leadToDelete.name} was removed.` });
      }

      setShowDeleteDialog(false);
      setLeadToDelete(null);
      await fetchLeads();
      await fetchStats();
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete lead',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteLead = () => {
    setShowDeleteDialog(false);
    setLeadToDelete(null);
  };

  const handleCreateLead = async () => {
    if (!newLead.name?.trim() || !newLead.email?.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Name and email are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsCreating(true);
      const payload = {
        name: newLead.name!.trim(),
        email: newLead.email!.trim(),
        phone: newLead.phone || null,
        company_name: newLead.company_name || null,
        status: newLead.status || 'new',
        source: newLead.source || null,
        project_type: newLead.project_type || null,
        timeline: newLead.timeline || null,
        budget_range: newLead.budget_range || null,
        notes: newLead.notes || null,
      };
      const { error } = await supabase.from('leads').insert([payload]);
      if (error) throw error;
      toast({ title: 'Lead created', description: `${payload.name} was added.` });
      setShowCreateDialog(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        status: 'new',
        source: '',
        project_type: '',
        timeline: '',
        budget_range: '',
        notes: '',
      });
      await fetchLeads();
      await fetchStats();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({ title: 'Error', description: 'Failed to create lead', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CrmAutomationProvider>
      <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/50 rounded-xl border shadow-sm p-2 inline-flex mb-4">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="workflow" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflow Dashboard
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="call-logs" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Logs
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="quote-requests" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Quote Requests
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Workflow Dashboard Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <CrmWorkflowDashboard />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time leads</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.newThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Past 7 days</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((stats.newThisWeek / stats.total) * 100, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to proceed</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((stats.qualified / stats.total) * 100, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Closed won rate</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${stats.conversionRate}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Lead Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Lead Management</CardTitle>
              <CardDescription>Manage and track all your roofing leads</CardDescription>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => { setNewLead({ name: '', email: '', phone: '', company_name: '', status: 'new', source: '', project_type: '', timeline: '', budget_range: '', notes: '' }); setShowCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Filters and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leads by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="estimate_scheduled">Estimate Scheduled</SelectItem>
                <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedLeads.length} selected</span>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualified">Mark as Qualified</SelectItem>
                  <SelectItem value="contacted">Mark as Contacted</SelectItem>
                  <SelectItem value="closed_won">Mark as Won</SelectItem>
                  <SelectItem value="closed_lost">Mark as Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Enhanced Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('company_name')}
                  >
                    Company {sortBy === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                   <TableHead>Service Needed</TableHead>
                   <TableHead>How Found Us</TableHead>
                   <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectLead(lead.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                    </TableCell>
                     <TableCell className="text-foreground">{lead.company_name || '-'}</TableCell>
                     <TableCell className="text-foreground">
                       {lead.project_type ? formatServiceName(lead.project_type) : '-'}
                     </TableCell>
                     <TableCell className="text-foreground">
                       {lead.source ? formatSourceName(lead.source) : '-'}
                     </TableCell>
                     <TableCell>
                       <Badge className={`${getStatusColor(lead.status)} border inline-flex items-center gap-1`}>
                         {getStatusIcon(lead.status)}
                         {formatStatus(lead.status)}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setEditingLead(lead);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => openDeleteDialog(lead)}>
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
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information and status
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-6">
              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={editingLead.name}
                      onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editingLead.phone || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                      placeholder="(415) 697-1849"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingLead.email}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Project Information Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Project Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service">Service Needed</Label>
                    <Select value={editingLead.project_type || ''} onValueChange={(value) => setEditingLead({ ...editingLead, project_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential-installation">Residential Installation</SelectItem>
                        <SelectItem value="commercial-roofing">Commercial Roofing</SelectItem>
                        <SelectItem value="roof-repair">Roof Repair</SelectItem>
                        <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                        <SelectItem value="storm-damage">Storm Damage Repair</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="consultation">Consultation Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">How did you find us?</Label>
                    <Select value={editingLead.source || ''} onValueChange={(value) => setEditingLead({ ...editingLead, source: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google-search">Google Search</SelectItem>
                        <SelectItem value="referral-friend">Referral from Friend</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="online-directory">Online Directory</SelectItem>
                        <SelectItem value="previous-customer">Previous Customer</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="project_details">Project Details</Label>
                    <Textarea
                      id="project_details"
                      value={editingLead.notes || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                      rows={4}
                      placeholder="Tell us about your project, timeline, and any specific requirements..."
                    />
                  </div>
                </div>
              </div>

              {/* Lead Management Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Lead Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editingLead.status} onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="estimate_scheduled">Estimate Scheduled</SelectItem>
                        <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      value={editingLead.company_name || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, company_name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleEditLead(editingLead)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Lead Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Create a new lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_name">Full Name *</Label>
                  <Input
                    id="new_name"
                    value={newLead.name || ''}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="new_phone">Phone Number *</Label>
                  <Input
                    id="new_phone"
                    type="tel"
                    value={newLead.phone || ''}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(415) 697-1849"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="new_email">Email Address *</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newLead.email || ''}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Project Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_service">Service Needed</Label>
                  <Select value={newLead.project_type || ''} onValueChange={(value) => setNewLead({ ...newLead, project_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential-installation">Residential Installation</SelectItem>
                      <SelectItem value="commercial-roofing">Commercial Roofing</SelectItem>
                      <SelectItem value="roof-repair">Roof Repair</SelectItem>
                      <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                      <SelectItem value="storm-damage">Storm Damage Repair</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="consultation">Consultation Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_source">How did you find us?</Label>
                  <Select value={newLead.source || ''} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-search">Google Search</SelectItem>
                      <SelectItem value="referral-friend">Referral from Friend</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="online-directory">Online Directory</SelectItem>
                      <SelectItem value="previous-customer">Previous Customer</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="new_details">Project Details</Label>
                  <Textarea
                    id="new_details"
                    value={newLead.notes || ''}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    rows={4}
                    placeholder="Tell us about your project, timeline, and any specific requirements..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Lead Management</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_status">Status</Label>
                  <Select value={newLead.status || 'new'} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="estimate_scheduled">Estimate Scheduled</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_company">Company (Optional)</Label>
                  <Input
                    id="new_company"
                    value={newLead.company_name || ''}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateLead} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {leadToDelete?.name || 'this lead'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLead} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </TabsContent>

          <TabsContent value="call-logs">
            <CallLogsTable />
          </TabsContent>

          <TabsContent value="quote-requests">
            <QuoteRequests />
          </TabsContent>
      </Tabs>
      </div>
    </CrmAutomationProvider>
  );
};

export default CRMDashboard;
