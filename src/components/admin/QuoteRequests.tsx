import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Search, Filter, Eye, Edit, Phone, Mail, MapPin, Clock, TrendingUp, Users, CheckCircle, Satellite, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import QuoteRequestSummaryDrawer from './QuoteRequestSummaryDrawer';
import { CreateQuoteDialog } from './CreateQuoteDialog';
import QuoteCard from './QuoteCard';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  project_type: string | null;
  property_type: string | null;
  timeline: string | null;
  notes: string | null;
  property_address: string | null;
  created_at: string;
  measurements?: any | null;
  converted_to_project_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roof_roi?: any | null;
  roi_image_url?: string | null;
  ai_measurements?: any | null;
  ai_measurements_status?: string | null;
  ai_measurements_updated_at?: string | null;
  selected_imagery?: any | null;
  pitch_schema?: any | null;
}

interface QuoteStats {
  total: number;
  newThisWeek: number;
  inProgress: number;
  completed: number;
}

const QuoteRequests = () => {
  const navigate = useNavigate();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [stats, setStats] = useState<QuoteStats>({ total: 0, newThisWeek: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [runningMeasure, setRunningMeasure] = useState(false);

  const [converting, setConverting] = useState(false);
  const [imageryOpen, setImageryOpen] = useState(false);

  useEffect(() => {
    fetchQuoteRequests();
    fetchStats();
  }, []);

  const fetchQuoteRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuoteRequests(data || []);
    } catch (error) {
      console.error('Error fetching quote requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('status, created_at');

      if (error) throw error;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const total = data?.length || 0;
      const newThisWeek = data?.filter(item => new Date(item.created_at) >= oneWeekAgo).length || 0;
      const inProgress = data?.filter(item => ['new', 'qualified', 'contacted'].includes(item.status)).length || 0;
      const completed = data?.filter(item => ['converted', 'closed'].includes(item.status)).length || 0;

      setStats({ total, newThisWeek, inProgress, completed });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConvertToProject = async (request: QuoteRequest) => {
    try {
      setConverting(true);
      const { data, error } = await supabase.functions.invoke('convert-quote-request', {
        body: { quoteRequestId: request.id }
      });
      if (error) throw error;
      toast.success('Converted to Project and measured');
      await fetchQuoteRequests();
      const { data: updated } = await (supabase as any)
        .from('quote_requests')
        .select('*')
        .eq('id', request.id)
        .maybeSingle();
      if (updated) setSelectedRequest(updated);
    } catch (err) {
      console.error('Conversion failed:', err);
      toast.error('Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const handleRunMeasurements = async (request: QuoteRequest, rerun = false) => {
    try {
      if (!request.roof_roi) {
        toast.error('Outline the roof first (Auto-Outline Roof) or draw manually.');
        return;
      }
      setRunningMeasure(true);

      // Geocode if missing coords but we have address
      const notesData = parseNotesData(request.notes);
      const addr = request.property_address || notesData.address;
      if ((request.latitude == null || request.longitude == null) && addr) {
        const { data: geoData, error: geoErr } = await supabase.functions.invoke('geocode-address', {
          body: { quote_request_id: request.id, address: addr },
        });
        if (geoErr) {
          console.error('geocode-address failed', geoErr);
          toast.error(`Developer Alert: Edge Function geocode-address failed: ${geoErr.status || ''} ${geoErr.message || ''}`);
          return;
        }
      }

      // 1) Generate ROI image
      const gen = await supabase.functions.invoke('generate-roi-image', {
        body: { quote_request_id: request.id, paddingRatio: rerun ? 0.2 : 0.1 },
      });
      if (gen.error) {
        console.error('generate-roi-image failed', gen.error);
        toast.error(`Developer Alert: Edge Function generate-roi-image failed: ${gen.error.status || ''} ${gen.error.message || ''}`);
        return;
      }

      // 2) Measure with assistant
      const meas = await supabase.functions.invoke('measure-roof-with-assistant', {
        body: { quote_request_id: request.id, rerun },
      });
      if (meas.error) {
        console.error('measure-roof-with-assistant failed', meas.error);
        toast.error(`Developer Alert: Edge Function measure-roof-with-assistant failed: ${meas.error.status || ''} ${meas.error.message || ''}`);
        return;
      }

      // 3) Poll until ready | error
      const start = Date.now();
      const timeoutMs = 90_000;
      let done = false;
      while (!done && Date.now() - start < timeoutMs) {
        const { data: updated, error } = await (supabase as any)
          .from('quote_requests')
          .select('*')
          .eq('id', request.id)
          .maybeSingle();
        if (error) {
          console.error('poll failed', error);
          toast.error(`Developer Alert: Polling failed: ${error.message || ''}`);
          return;
        }
        if (updated?.ai_measurements_status === 'ready') {
          setSelectedRequest(updated);
          toast.success('Measurements ready');
          done = true;
          break;
        }
        if (updated?.ai_measurements_status === 'error') {
          setSelectedRequest(updated);
          toast.error(`Developer Alert: Analysis error: ${updated?.ai_measurements?.error || 'Unknown error'}`);
          done = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!done) {
        toast.error('Developer Alert: Measurement timed out');
      }
    } catch (err: any) {
      console.error('Run measurements failed:', err);
      toast.error(`Developer Alert: ${err?.message || 'Failed to run measurements'}`);
    } finally {
      setRunningMeasure(false);
      // Refresh list
      await fetchQuoteRequests();
    }
  };


  const downloadJSON = (data: any, id: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_measurements_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Project': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const parseNotesData = (notes: string | null) => {
    if (!notes) return { address: '', urgency: '', additionalInfo: '' };
    
    try {
      // Parse the structured notes data
      const addressMatch = notes.match(/Property Address: ([^\n]+)/);
      const urgencyMatch = notes.match(/Project Urgency: ([^\n]+)/);
      const infoMatch = notes.match(/Additional Information: ([^\n]+)/);
      
      return {
        address: addressMatch ? addressMatch[1] : '',
        urgency: urgencyMatch ? urgencyMatch[1] : '',
        additionalInfo: infoMatch ? infoMatch[1] : ''
      };
    } catch {
      return { address: '', urgency: '', additionalInfo: '' };
    }
  };

const filteredRequests = quoteRequests.filter(request => {
  const address = (request.property_address || parseNotesData(request.notes).address || '').toLowerCase();
  const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       address.includes(searchTerm.toLowerCase());
  const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
  return matchesSearch && matchesStatus;
});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading quote requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-component="QuoteRequests" data-file="src/components/admin/QuoteRequests.tsx">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Total Quotes</CardTitle>
            <Calculator className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">All time</p>
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
            <CardTitle className="text-xs font-medium md:text-sm">In Progress</CardTitle>
            <Clock className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.inProgress}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">Active quotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">Completed</CardTitle>
            <CheckCircle className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-lg font-bold md:text-2xl">{stats.completed}</div>
            <p className="text-[10px] text-muted-foreground md:text-xs">Converted/Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quote Management</h2>
          <p className="text-muted-foreground">Create and manage roofing quotes with integrated imagery selection</p>
        </div>
        <CreateQuoteDialog onQuoteCreated={fetchQuoteRequests} />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Cards Grid */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No quotes found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first quote to get started'
                  }
                </p>
              </div>
              {(!searchTerm && statusFilter === 'all') && (
                <CreateQuoteDialog onQuoteCreated={fetchQuoteRequests} />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <QuoteCard
              key={request.id}
              quote={request}
              onOpenRoofQuoter={(quote) => {
                // Navigate to quote detail page
                navigate(`/quote/${quote.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuoteRequests;
