import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, Calendar, DollarSign, Plus, Search, Filter, Edit, Trash2, CheckCircle, Clock, AlertCircle, Eye, EyeOff, MoreHorizontal, Phone, Mail, FileText, Copy, Sparkles, Loader2, ClipboardList } from 'lucide-react';
import { useProposalManagement } from '@/hooks/useProposalManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { GooglePlacesAutocomplete } from '../ui/google-places-autocomplete';
import { useFastoLeadActions } from '@/components/fasto/useFastoActionHandler';
import { FastoContext } from '@/components/fasto/fastoActionApi';
interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company_name?: string;
  status: string;
  source?: string;
  project_type?: string;
  timeline?: string;
  budget_range?: string;
  created_at: string;
  notes?: string;
  quote_id?: string;
  has_generated_email?: boolean;
}
interface LeadStats {
  total: number;
  newThisWeek: number;
  qualified: number;
  conversionRate: number;
}
const LeadManagement = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    address: '',
    company_name: '',
    status: 'new',
    source: '',
    project_type: '',
    timeline: '',
    budget_range: '',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [sendingEmailLeadId, setSendingEmailLeadId] = useState<string | null>(null);
  const [showEmailPreviewDialog, setShowEmailPreviewDialog] = useState(false);
  const [emailPreviewContent, setEmailPreviewContent] = useState<{ subject: string; body: string } | null>(null);
  const [editedEmailBody, setEditedEmailBody] = useState<string>('');
  const [currentPreviewLeadId, setCurrentPreviewLeadId] = useState<string | null>(null);
  const [showAiEditInput, setShowAiEditInput] = useState(false);
  const [aiEditInstructions, setAiEditInstructions] = useState('');
  const [isEditingWithAi, setIsEditingWithAi] = useState(false);
  const {
    toast
  } = useToast();
  const { createProposal } = useProposalManagement();
  const [creatingProposalLeadId, setCreatingProposalLeadId] = useState<string | null>(null);
  
  // React Query for leads - enables automatic cache invalidation from Fasto
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order(sortBy, {
        ascending: sortOrder === 'asc'
      });
      if (error) throw error;
      return data || [];
    },
  });
  
  // React Query for stats
  const { data: stats = { total: 0, newThisWeek: 0, qualified: 0, conversionRate: 0 } } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const { count: total } = await supabase.from('leads').select('*', {
        count: 'exact',
        head: true
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: newThisWeek } = await supabase.from('leads').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', weekAgo.toISOString());

      const { count: qualified } = await supabase.from('leads').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'quoted');

      const { count: closedWon } = await supabase.from('leads').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'paid');
      
      const conversionRate = total ? (closedWon || 0) / total * 100 : 0;
      
      return {
        total: total || 0,
        newThisWeek: newThisWeek || 0,
        qualified: qualified || 0,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    },
  });
  
  // React Query for lead quotes
  const { data: leadsWithQuotes = {} } = useQuery({
    queryKey: ['lead-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('id, email');
      
      if (error) throw error;
      
      const quoteMap: Record<string, string> = {};
      data?.forEach(quote => {
        if (quote.email) {
          quoteMap[quote.email.toLowerCase()] = quote.id;
        }
      });
      
      return quoteMap;
    },
  });
  
  // Helper function to refetch leads (for mutations)
  const refetchLeads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
  }, [queryClient]);
  
  // Fasto Action API handlers for agentic actions
  const findLeadByName = useCallback((name: string): { id: string; name: string } | null => {
    const lowerName = name.toLowerCase();
    const found = leads.find(l => l.name?.toLowerCase().includes(lowerName));
    return found ? { id: found.id, name: found.name } : null;
  }, [leads]);
  
  const editLeadName = useCallback(async (leadId: string, newName: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');
    
    const { error } = await supabase.from('leads').update({ name: newName }).eq('id', leadId);
    if (error) throw error;
    
    toast({ title: "Success", description: `Lead renamed to "${newName}"` });
    refetchLeads();
  }, [leads, toast, refetchLeads]);
  
  const updateLeadStatus = useCallback(async (leadId: string, newStatus: string) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (error) throw error;
    
    toast({ title: "Success", description: `Lead status updated to "${newStatus}"` });
    refetchLeads();
  }, [toast, refetchLeads]);
  
  // Register Fasto action handlers
  useFastoLeadActions({
    editName: editLeadName,
    updateStatus: updateLeadStatus,
    findLeadByName,
  });
  // Old fetch functions removed - now using React Query above
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-3 h-3" />;
      case 'contacted':
        return <Phone className="w-3 h-3" />;
      case 'ready_to_quote':
        return <AlertCircle className="w-3 h-3" />;
      case 'quoted':
        return <DollarSign className="w-3 h-3" />;
      case 'proposal_sent':
        return <Calendar className="w-3 h-3" />;
      case 'contract_sent':
        return <Calendar className="w-3 h-3" />;
      case 'in_production':
        return <TrendingUp className="w-3 h-3" />;
      case 'inspected':
        return <CheckCircle className="w-3 h-3" />;
      case 'paid':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready_to_quote':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'quoted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proposal_sent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'contract_sent':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'in_production':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'inspected':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      'new': 'New',
      'contacted': 'Contacted',
      'ready_to_quote': 'Ready to Quote',
      'quoted': 'Quoted',
      'proposal_sent': 'Proposal Sent',
      'contract_sent': 'Contract Sent',
      'in_production': 'In Production',
      'inspected': 'Inspected',
      'paid': 'Paid'
    };
    return statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };
  const handleSelectAll = () => {
    setSelectedLeads(selectedLeads.length === filteredLeads.length ? [] : filteredLeads.map(lead => lead.id));
  };
  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('leads').update({
        status: newStatus
      }).in('id', selectedLeads);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Updated ${selectedLeads.length} leads to ${formatStatus(newStatus)}`
      });
      setSelectedLeads([]);
      refetchLeads();
    } catch (error) {
      console.error('Error updating leads:', error);
      toast({
        title: "Error",
        description: "Failed to update leads",
        variant: "destructive"
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
          variant: "destructive"
        });
        return;
      }
      if (!lead.email?.trim()) {
        toast({
          title: "Validation Error",
          description: "Email Address is required",
          variant: "destructive"
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        return;
      }

      // Validate status is one of the allowed values (must match database CHECK constraint)
      const allowedStatuses = ['new', 'contacted', 'ready_to_quote', 'quoted', 'proposal_sent', 'contract_sent', 'in_production', 'inspected', 'paid'];
      if (!allowedStatuses.includes(lead.status)) {
        toast({
          title: "Validation Error",
          description: "Invalid status value",
          variant: "destructive"
        });
        return;
      }
      console.log('Updating lead:', {
        leadId: lead.id,
        updateData: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
          company_name: lead.company_name || null,
          status: lead.status,
          source: lead.source || null,
          project_type: lead.project_type || null,
          timeline: lead.timeline || null,
          budget_range: lead.budget_range || null,
          notes: lead.notes || null
        }
      });
      const {
        error
      } = await supabase.from('leads').update({
        name: lead.name.trim(),
        email: lead.email.trim().toLowerCase(),
        phone: lead.phone?.trim() || null,
        address: lead.address?.trim() || null,
        company_name: lead.company_name?.trim() || null,
        status: lead.status,
        source: lead.source?.trim() || null,
        project_type: lead.project_type || null,
        timeline: lead.timeline || null,
        budget_range: lead.budget_range || null,
        notes: lead.notes?.trim() || null
      }).eq('id', lead.id);
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          leadId: lead.id
        });
        throw error;
      }
      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
      setShowEditDialog(false);
      setEditingLead(null);
      refetchLeads();
    } catch (error: any) {
      console.error('Error updating lead:', error);

      // More detailed error message based on error type
      let errorMessage = "Failed to update lead";
      if (error?.message) {
        errorMessage = error.message;
      }
      if (error?.code === '23505') {
        errorMessage = "A lead with this email already exists";
      }
      if (error?.code === '23514') {
        errorMessage = "Invalid data provided. Please check all fields and try again.";
      }
      toast({
        title: "Error",
        description: `${errorMessage} (Lead ID: ${lead.id})`,
        variant: "destructive"
      });
    }
  };
  const handleCreateProposal = async (lead: Lead) => {
    setCreatingProposalLeadId(lead.id);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const result = await createProposal.mutateAsync({
        property_address: lead.address || 'Address not provided',
        project_type: lead.project_type || 'residential',
        client_name: lead.name,
        client_email: lead.email,
        client_phone: lead.phone || '',
        expires_at: expiresAt.toISOString()
      });
      
      toast({
        title: "Proposal Created",
        description: `Proposal ${result.proposal_number} created for ${lead.name}`,
      });
      
      // Navigate to the proposal
      navigate(`/admin/proposals/${result.id}`);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create proposal",
        variant: "destructive"
      });
    } finally {
      setCreatingProposalLeadId(null);
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
      let {
        error
      } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) {
        // Handle FK constraint: dependent records exist
        if ((error as any)?.code === '23503') {
          console.warn('FK constraint when deleting lead. Removing dependent aerial_images for lead:', leadId);
          const {
            error: depErr
          } = await supabase.from('aerial_images').delete().eq('lead_id', leadId);
          if (depErr) throw depErr;

          // Retry deleting the lead after cleaning dependencies
          const retry = await supabase.from('leads').delete().eq('id', leadId);
          if (retry.error) throw retry.error;
          toast({
            title: 'Lead deleted',
            description: `${leadToDelete.name} and related aerial imagery were removed.`
          });
        } else {
          // Unknown error
          throw error;
        }
      } else {
        toast({
          title: 'Lead deleted',
          description: `${leadToDelete.name} was removed.`
        });
      }
      setShowDeleteDialog(false);
      setLeadToDelete(null);
      refetchLeads();
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete lead',
        variant: 'destructive'
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
        variant: 'destructive'
      });
      return;
    }
    try {
      setIsCreating(true);
      const payload = {
        name: newLead.name!.trim(),
        email: newLead.email!.trim(),
        phone: newLead.phone || null,
        address: newLead.address || null,
        company_name: newLead.company_name || null,
        status: newLead.status || 'new',
        source: newLead.source || null,
        project_type: newLead.project_type || null,
        timeline: newLead.timeline || null,
        budget_range: newLead.budget_range || null,
        notes: newLead.notes || null
      };
      const {
        error
      } = await supabase.from('leads').insert([payload]);
      if (error) throw error;
      toast({
        title: 'Lead created',
        description: `${payload.name} was added.`
      });
      setShowCreateDialog(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        address: '',
        company_name: '',
        status: 'new',
        source: '',
        project_type: '',
        timeline: '',
        budget_range: '',
        notes: ''
      });
      refetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  const handleSendFirstEmail = async (lead: Lead) => {
    setSendingEmailLeadId(lead.id);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-first-contact-email', {
        body: {
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          project_type: lead.project_type,
          property_type: lead.company_name,
          notes: lead.notes,
          timeline: lead.timeline,
          preview: true
        }
      });
      if (error) throw error;
      
      // Refetch leads to show any state changes
      refetchLeads();
      
      // Show email preview dialog
      setEmailPreviewContent({
        subject: data.subject || "Re: Your Roofing Inquiry",
        body: data.emailContent || ""
      });
      setEditedEmailBody(data.emailContent || "");
      setCurrentPreviewLeadId(lead.id);
      setShowEmailPreviewDialog(true);
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "Failed to generate email preview",
        variant: "destructive"
      });
    } finally {
      setSendingEmailLeadId(null);
    }
  };

  const handleViewEmail = (lead: Lead) => {
    handleSendFirstEmail(lead);
  };
  
  const copyEmailToClipboard = () => {
    if (!emailPreviewContent) return;
    
    const fullEmail = `Subject: ${emailPreviewContent.subject}\n\n${editedEmailBody}`;
    navigator.clipboard.writeText(fullEmail);
    toast({
      title: "Copied!",
      description: "Email content copied to clipboard"
    });
  };

  const handleEditWithAi = async () => {
    if (!aiEditInstructions.trim() || !currentPreviewLeadId) return;
    
    const lead = leads.find(l => l.id === currentPreviewLeadId);
    if (!lead) return;
    
    setIsEditingWithAi(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-first-contact-email', {
        body: {
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          project_type: lead.project_type,
          property_type: lead.company_name,
          notes: lead.notes,
          timeline: lead.timeline,
          preview: true,
          editInstructions: aiEditInstructions,
          currentEmail: editedEmailBody
        }
      });
      
      if (error) throw error;
      
      setEditedEmailBody(data.emailContent || "");
      setAiEditInstructions('');
      setShowAiEditInput(false);
      toast({
        title: "Email revised",
        description: "The AI has updated the email based on your instructions"
      });
    } catch (error) {
      console.error('Error editing email with AI:', error);
      toast({
        title: "Error",
        description: "Failed to edit email with AI",
        variant: "destructive"
      });
    } finally {
      setIsEditingWithAi(false);
    }
  };
  const handleSendToQuotes = async (lead: Lead) => {
    try {
      // Create quote_request with lead information
      const quoteRequestData = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        property_address: lead.address || null,
        project_type: lead.project_type || null,
        property_type: null,
        timeline: lead.timeline || null,
        notes: `Lead: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nAddress: ${lead.address || 'N/A'}\nCompany: ${lead.company_name || 'N/A'}\nProject Type: ${lead.project_type || 'N/A'}\nTimeline: ${lead.timeline || 'N/A'}\n\nOriginal Notes: ${lead.notes || 'None'}`,
        status: 'new'
      };

      const { data: quote, error: quoteError } = await supabase
        .from('quote_requests')
        .insert(quoteRequestData)
        .select()
        .maybeSingle();

      if (quoteError) throw quoteError;

      // Update lead status to 'ready_to_quote'
      await supabase
        .from('leads')
        .update({ status: 'ready_to_quote' })
        .eq('id', lead.id);

      // Geocode the address if available
      if (lead.address) {
        const { error: geocodeError } = await supabase.functions.invoke('geocode-address', {
          body: {
            quote_request_id: quote.id,
            address: lead.address
          }
        });

        if (geocodeError) {
          console.warn('Geocoding failed:', geocodeError);
        }
      }

      // Invalidate lead quotes query
      queryClient.invalidateQueries({ queryKey: ['lead-quotes'] });

      toast({
        title: "Quote Created",
        description: "Opening Solar API tab...",
      });

      refetchLeads();

      // Navigate to the quote detail page with Solar API tab
      navigate(`/quote/${quote.id}?tab=solar`);

    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewQuote = async (lead: Lead) => {
    const quoteId = leadsWithQuotes[lead.email.toLowerCase()];
    if (quoteId) {
      try {
        // Update quote with latest lead information
        const { error: updateError } = await supabase
          .from('quote_requests')
          .update({
            name: lead.name,
            email: lead.email,
            phone: lead.phone || null,
            property_address: lead.address || null,
            project_type: lead.project_type || null,
            timeline: lead.timeline || null,
            notes: `Lead: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nAddress: ${lead.address || 'N/A'}\nCompany: ${lead.company_name || 'N/A'}\nProject Type: ${lead.project_type || 'N/A'}\nTimeline: ${lead.timeline || 'N/A'}\n\nOriginal Notes: ${lead.notes || 'None'}`
          })
          .eq('id', quoteId);

        if (updateError) {
          console.error('Error updating quote:', updateError);
          toast({
            title: "Warning",
            description: "Could not sync latest lead info to quote",
            variant: "destructive"
          });
        }

        // Navigate to the quote
        navigate(`/quote/${quoteId}`);
      } catch (error) {
        console.error('Error updating quote:', error);
        navigate(`/quote/${quoteId}`);
      }
    }
  };
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6" data-fasto-page="admin-sales-leads">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Total Leads</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">All leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">New This Week</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.newThisWeek}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">Past 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Qualified</CardTitle>
            <CheckCircle className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.qualified}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">Ready to convert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Conversion Rate</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.conversionRate}%</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">Lead to close</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>Manage and track your sales leads</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Lead</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Lead</DialogTitle>
                  <DialogDescription>Add a new lead to your CRM system.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={newLead.name || ''} onChange={e => setNewLead({
                    ...newLead,
                    name: e.target.value
                  })} placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" value={newLead.email || ''} onChange={e => setNewLead({
                    ...newLead,
                    email: e.target.value
                  })} placeholder="Enter email address" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={newLead.phone || ''} onChange={e => setNewLead({
                    ...newLead,
                    phone: e.target.value
                  })} placeholder="Enter phone number" />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={newLead.address || ''} onChange={e => setNewLead({
                    ...newLead,
                    address: e.target.value
                  })} placeholder="Enter address" />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" value={newLead.company_name || ''} onChange={e => setNewLead({
                    ...newLead,
                    company_name: e.target.value
                  })} placeholder="Enter company name" />
                  </div>
                  <div>
                    <Label htmlFor="project_type">Project Type</Label>
                    <Select value={newLead.project_type || ''} onValueChange={value => setNewLead({
                    ...newLead,
                    project_type: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={newLead.notes || ''} onChange={e => setNewLead({
                    ...newLead,
                    notes: e.target.value
                  })} placeholder="Additional notes about this lead" rows={3} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateLead} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Lead'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="ready_to_quote">Ready to Quote</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="contract_sent">Contract Sent</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="inspected">Inspected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedLeads.length > 0 && <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={handleBulkStatusUpdate}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="ready_to_quote">Ready to Quote</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="contract_sent">Contract Sent</SelectItem>
                      <SelectItem value="in_production">In Production</SelectItem>
                      <SelectItem value="inspected">Inspected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setSelectedLeads([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>}
          </div>

          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads found. Try adjusting your search or filters.
                </div>
              ) : (
                filteredLeads.map(lead => (
                  <div key={lead.id} className="bg-card border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-medium truncate">{lead.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingLead(lead);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => (lead as any).has_generated_email ? handleViewEmail(lead) : handleSendFirstEmail(lead)} 
                            disabled={sendingEmailLeadId === lead.id}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            {sendingEmailLeadId === lead.id 
                              ? 'Generating...' 
                              : (lead as any).has_generated_email 
                                ? 'See 1st Email' 
                                : 'Create 1st Email'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const quoteId = leadsWithQuotes[lead.email.toLowerCase()];
                              if (quoteId) {
                                handleViewQuote(lead);
                              } else {
                                handleSendToQuotes(lead);
                              }
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {leadsWithQuotes[lead.email.toLowerCase()] ? 'See Quote' : 'Start Quote'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCreateProposal(lead)}
                            disabled={creatingProposalLeadId === lead.id}
                          >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            {creatingProposalLeadId === lead.id ? 'Creating...' : 'Create Proposal'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(lead)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getStatusColor(lead.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(lead.status)}
                          <span className="text-xs">{formatStatus(lead.status)}</span>
                        </div>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(lead.company_name || lead.project_type) && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t">
                        {lead.company_name && (
                          <span className="text-xs text-muted-foreground">{lead.company_name}</span>
                        )}
                        {lead.project_type && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{formatServiceName(lead.project_type)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      Name
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                      Contact
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Project Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                      Created
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No leads found. Try adjusting your search or filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map(lead => (
                      <TableRow key={lead.id} data-fasto-lead-id={lead.id} data-fasto-lead-name={lead.name}>
                        <TableCell>
                          <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={() => handleSelectLead(lead.id)} />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm" data-fasto-field="name">{lead.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{lead.email}</div>
                            {lead.phone && <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {lead.phone}
                              </div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{lead.company_name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatServiceName(lead.project_type || '')}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(lead.status)}
                              <span className="text-xs">{formatStatus(lead.status)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" data-fasto-action="lead-menu-trigger" data-fasto-lead-id={lead.id}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-fasto-menu="lead-actions">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEditingLead(lead);
                                  setShowEditDialog(true);
                                }}
                                data-fasto-action="edit-lead"
                                data-fasto-lead-id={lead.id}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => (lead as any).has_generated_email ? handleViewEmail(lead) : handleSendFirstEmail(lead)} 
                                disabled={sendingEmailLeadId === lead.id}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                {sendingEmailLeadId === lead.id 
                                  ? 'Generating...' 
                                  : (lead as any).has_generated_email 
                                    ? 'See 1st Email' 
                                    : 'Create 1st Email'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  const quoteId = leadsWithQuotes[lead.email.toLowerCase()];
                                  if (quoteId) {
                                    handleViewQuote(lead);
                                  } else {
                                    handleSendToQuotes(lead);
                                  }
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {leadsWithQuotes[lead.email.toLowerCase()] ? 'See Quote' : 'Start Quote'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCreateProposal(lead)}
                                disabled={creatingProposalLeadId === lead.id}
                              >
                                <ClipboardList className="mr-2 h-4 w-4" />
                                {creatingProposalLeadId === lead.id ? 'Creating...' : 'Create Proposal'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteDialog(lead)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent 
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking on Google Places autocomplete dropdown
            const target = e.target as Element;
            if (target.closest('.pac-container')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information.</DialogDescription>
          </DialogHeader>
          {editingLead && <div className="space-y-4" data-fasto-dialog="edit-lead" data-fasto-lead-id={editingLead.id}>
              <div>
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input id="edit-name" data-fasto-field="edit-name" value={editingLead.name || ''} onChange={e => setEditingLead({
              ...editingLead,
              name: e.target.value
            })} placeholder="Enter full name" />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input id="edit-email" type="email" value={editingLead.email || ''} onChange={e => setEditingLead({
              ...editingLead,
              email: e.target.value
            })} placeholder="Enter email address" />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input id="edit-phone" value={editingLead.phone || ''} onChange={e => setEditingLead({
              ...editingLead,
              phone: e.target.value
            })} placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <GooglePlacesAutocomplete
                  value={editingLead.address || ''}
                  onChange={(value) => setEditingLead({
                    ...editingLead,
                    address: value
                  })}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Company Name</Label>
                <Input id="edit-company" value={editingLead.company_name || ''} onChange={e => setEditingLead({
              ...editingLead,
              company_name: e.target.value
            })} placeholder="Enter company name" />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editingLead.status} onValueChange={value => setEditingLead({
              ...editingLead,
              status: value
            })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="ready_to_quote">Ready to Quote</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="contract_sent">Contract Sent</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="inspected">Inspected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-source">Source</Label>
                <Select value={editingLead.source || ''} onValueChange={value => setEditingLead({
              ...editingLead,
              source: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="google-search">Google Search</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="phone-call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-project_type">Project Type</Label>
                <Select value={editingLead.project_type || ''} onValueChange={value => setEditingLead({
              ...editingLead,
              project_type: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
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
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" value={editingLead.notes || ''} onChange={e => setEditingLead({
              ...editingLead,
              notes: e.target.value
            })} placeholder="Additional notes about this lead" rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleEditLead(editingLead)} data-fasto-action="save-lead">
                  Update Lead
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{leadToDelete?.name}"? This action cannot be undone and will also remove any related aerial imagery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteLead}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLead} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreviewDialog} onOpenChange={setShowEmailPreviewDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Email Preview</DialogTitle>
            <DialogDescription className="text-sm">
              Review the generated email content below
            </DialogDescription>
          </DialogHeader>
          {emailPreviewContent && (
            <div className="space-y-3 sm:space-y-4">
              <div className="border-b pb-2 sm:pb-3">
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Subject</Label>
                <p className="text-sm sm:text-base font-semibold mt-1">{emailPreviewContent.subject}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Email Body</Label>
                <Textarea 
                  className="mt-2 min-h-48 sm:min-h-96 text-sm"
                  value={editedEmailBody}
                  onChange={(e) => setEditedEmailBody(e.target.value)}
                />
              </div>
              {showAiEditInput ? (
                <div className="space-y-2 sm:space-y-3 border rounded-lg p-3 sm:p-4 bg-muted/50">
                  <Label className="text-xs sm:text-sm font-medium">What would you like to change?</Label>
                  <Textarea
                    placeholder="e.g., Make it more casual, add urgency, mention a discount..."
                    value={aiEditInstructions}
                    onChange={(e) => setAiEditInstructions(e.target.value)}
                    className="min-h-16 sm:min-h-20 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowAiEditInput(false);
                        setAiEditInstructions('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleEditWithAi}
                      disabled={!aiEditInstructions.trim() || isEditingWithAi}
                    >
                      {isEditingWithAi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Revising...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                  setShowEmailPreviewDialog(false);
                  setShowAiEditInput(false);
                  setAiEditInstructions('');
                }}>
                  Close
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowAiEditInput(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Edit with AI
                </Button>
                <Button className="w-full sm:w-auto" onClick={copyEmailToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>;
};
export default LeadManagement;