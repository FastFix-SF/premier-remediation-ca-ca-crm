import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Trash2, Maximize, Minimize } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { OverviewTab } from '../components/quote-detail/OverviewTab';
import { DrawTab } from '../components/quote-detail/DrawTab';
import { EstimatorTab } from '../components/quote-detail/EstimatorTab';
import { MaterialsTab } from '../components/quote-detail/MaterialsTab';
import { ReportsTab } from '../components/quote-detail/ReportsTab';
import { SolarApiTab } from '../components/quote-detail/SolarApiTab';
import { TemplatesTab } from '../components/quote-detail/TemplatesTab';
import { TrainingTab } from '../components/quote-detail/TrainingTab';
import { OwnerApprovalModal } from '../components/quote-detail/OwnerApprovalModal';
import { CheckCircle2 } from 'lucide-react';
import { useProposalManagement } from '../hooks/useProposalManagement';
import { FeedbackButton } from '../components/admin/FeedbackButton';
interface Quote {
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
  selected_imagery?: any;
  latitude?: number;
  longitude?: number;
  company_name?: string | null;
  source?: string | null;
}
export default function QuoteDetail() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const {
    createProposal
  } = useProposalManagement();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  // Callback ref for adding materials from DrawTab to EstimatorTab
  const addMaterialsToEstimatorRef = useRef<((materials: any[]) => void) | null>(null);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);
  useEffect(() => {
    if (id) {
      fetchQuoteDetails();
    }
  }, [id]);
  const fetchQuoteDetails = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('quote_requests').select('*').eq('id', id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setQuote(data as Quote);
      } else {
        toast.error('Quote not found');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMap = async () => {
    if (!quote?.property_address) {
      toast.error('No property address available');
      return;
    }

    try {
      toast.loading('Loading map data...', { id: 'load-map' });
      
      // Call geocode-address edge function
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: {
          quote_request_id: quote.id,
          address: quote.property_address
        }
      });

      if (error) throw error;

      toast.success('Map loaded successfully', { id: 'load-map' });
      
      // Refetch quote to get updated coordinates
      await fetchQuoteDetails();
      
      // Switch to draw tab to show the map
      setActiveTab('draw');
    } catch (error: any) {
      console.error('Error loading map:', error);
      toast.error(error.message || 'Failed to load map', { id: 'load-map' });
    }
  };
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from('quote_requests').delete().eq('id', id);
      if (error) throw error;
      toast.success('Quote deleted successfully');
      navigate('/admin?tab=quotes');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = fullscreenContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut for fullscreen (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.key === 'f' || e.key === 'F') && (activeTab === 'draw' || activeTab === 'solar-api')) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, activeTab]);
  const handleOwnerApproval = async (signatureDataUrl: string) => {
    try {
      const {
        error
      } = await supabase.from('quote_requests').update({
        status: 'ready_to_send',
        notes: (quote?.notes || '') + `\n\n[Owner Approved on ${new Date().toLocaleString()}]`
      }).eq('id', id);
      if (error) throw error;
      toast.success('Quote approved and marked as ready to send!');

      // Create proposal from quote data
      if (quote) {
        await createProposal.mutateAsync({
          property_address: quote.property_address || 'Address not provided',
          project_type: quote.project_type || 'residential',
          client_name: quote.name,
          client_email: quote.email,
          client_phone: quote.phone || undefined,
          scope_of_work: quote.notes || undefined,
          notes_disclaimers: 'Auto-generated from quote request',
          quote_request_id: quote.id
        });
        toast.success('Proposal created successfully!');
      }
      fetchQuoteDetails();
    } catch (error) {
      console.error('Error approving quote:', error);
      throw error;
    }
  };
  const getImageUrl = () => {
    if (quote?.selected_imagery) {
      const imagery = quote.selected_imagery;
      if (imagery.provider === 'nearmap' && imagery.survey_id && imagery.bbox) {
        const coords = quote?.latitude && quote?.longitude ? `&lat=${quote.latitude}&lng=${quote.longitude}` : '';
        const bboxString = typeof imagery.bbox === 'object' && imagery.bbox ? `${imagery.bbox.minLng},${imagery.bbox.minLat},${imagery.bbox.maxLng},${imagery.bbox.maxLat}` : imagery.bbox;
        const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
        return `${functionsUrl}/nearmap-image-proxy?survey=${imagery.survey_id}&bbox=${bboxString}&width=1024&height=1024&format=jpeg${coords}`;
      }
      if (imagery.url) {
        return imagery.url;
      }
    }
    return null;
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  if (!quote) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quote Not Found</h2>
          <Button onClick={() => navigate('/admin')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>;
  }
  const imageryUrl = getImageUrl();
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-8 min-w-0">
              <div className="flex items-center flex-shrink-0">
                <div className="text-base sm:text-xl font-bold">ROOFSNAP</div>
                <div className="text-xs ml-1 sm:ml-2 opacity-75 hidden sm:block">by FastFix AI</div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <input type="text" placeholder="Find Project" className="bg-white text-gray-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md w-40 xl:w-80 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 text-xs sm:text-sm px-2 sm:px-3" onClick={handleDelete}>
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">DELETE</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-3">
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">HELP</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <button onClick={() => navigate('/admin?tab=quotes')} className="text-blue-600 hover:text-blue-800">
              QUOTES
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 truncate max-w-[200px] sm:max-w-none">{quote.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="w-full px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        {quote?.status === 'ready_to_send' && <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Quote Approved</p>
              <p className="text-sm text-muted-foreground">This quote has been approved by the owner and is ready to send as a proposal.</p>
            </div>
          </div>}

        <div ref={fullscreenContainerRef} className={`relative ${isFullscreen ? 'fixed inset-0 z-[1000] bg-background w-screen h-screen flex flex-col' : ''}`}>
          {/* Fullscreen Button */}
          {(activeTab === 'draw' || activeTab === 'solar-api') && <button onClick={toggleFullscreen} className="fixed sm:absolute right-2 sm:right-4 top-2 sm:top-4 z-[1001] h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-slate-900/80 text-white grid place-items-center shadow-lg hover:bg-slate-800 transition-colors" style={{
          pointerEvents: 'auto'
        }} title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}>
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>}

          <Tabs value={activeTab} onValueChange={setActiveTab} className={isFullscreen ? "flex-1 flex flex-col min-h-0" : "space-y-6"}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="w-full sm:w-auto overflow-x-auto">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex w-full sm:w-auto">
                  <TabsList variant="segmented" className="w-full sm:w-auto">
                    <TabsTrigger variant="segmented" value="overview" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
                    <TabsTrigger variant="segmented" value="draw" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Plan Viewer</TabsTrigger>
                    <TabsTrigger variant="segmented" value="estimate" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Estimator</TabsTrigger>
                    <TabsTrigger variant="segmented" value="materials" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Materials</TabsTrigger>
                    <TabsTrigger variant="segmented" value="reports" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Reports</TabsTrigger>
                    <TabsTrigger variant="segmented" value="solar-api" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Solar API</TabsTrigger>
                    <TabsTrigger variant="segmented" value="templates" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Templates</TabsTrigger>
                    <TabsTrigger variant="segmented" value="training" className="px-3 sm:px-6 text-xs sm:text-sm whitespace-nowrap">Training</TabsTrigger>
                  </TabsList>
                </div>
              </div>
            
            {/* Owner Approval Button - Only shown in Materials tab */}
            {activeTab === 'materials' && quote?.status !== 'ready_to_send' && quote?.status !== 'sent' && (
              <Button onClick={() => setShowApprovalModal(true)} className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Approve & Ready to Send
              </Button>
            )}
            </div>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab quote={quote} onUpdate={fetchQuoteDetails} />
          </TabsContent>

          <TabsContent value="draw" className={isFullscreen ? "flex-1 mt-0 min-h-0 flex flex-col" : "mt-6"}>
            {quote.latitude && quote.longitude ? <DrawTab 
              quoteId={quote.id} 
              imageryUrl={imageryUrl} 
              latitude={quote.latitude} 
              longitude={quote.longitude} 
              isFullscreen={isFullscreen}
              onAddMaterialsToEstimator={(materials) => {
                if (addMaterialsToEstimatorRef.current) {
                  addMaterialsToEstimatorRef.current(materials);
                }
              }}
            /> : <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-muted-foreground mb-4">No location data available for this property</p>
                <Button onClick={handleLoadMap} disabled={!quote?.property_address}>
                  Load Map
                </Button>
                {!quote?.property_address && (
                  <p className="text-xs text-muted-foreground mt-2">Add an address in the Overview tab first</p>
                )}
              </div>}
          </TabsContent>

          <TabsContent value="estimate" className="mt-6">
            <EstimatorTab 
              quoteId={quote.id}
              onPinMaterialsCallback={(callback) => {
                addMaterialsToEstimatorRef.current = callback;
              }}
            />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <MaterialsTab quoteId={quote.id} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsTab quoteId={quote.id} customerName={quote.name} propertyAddress={quote.property_address || 'Property Address'} />
          </TabsContent>

          <TabsContent value="solar-api" className={isFullscreen ? "flex-1 mt-0" : "mt-6"}>
            <SolarApiTab quoteId={quote.id} quote={quote} isFullscreen={isFullscreen} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplatesTab quoteId={quote.id} />
          </TabsContent>

          <TabsContent value="training" className="mt-6">
            <TrainingTab quoteId={quote.id} latitude={quote.latitude} longitude={quote.longitude} />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Owner Approval Modal */}
      <OwnerApprovalModal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} onApprove={handleOwnerApproval} quoteName={quote?.name || 'Quote'} />

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>;
}