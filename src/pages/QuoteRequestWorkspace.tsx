import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, MoreHorizontal, Eye, Download, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RoiSelector from '@/components/admin/RoiSelector';
import EnhancedMeasurementPanels from '@/components/admin/EnhancedMeasurementPanels';
import EnhancedROIPreview from '@/components/admin/EnhancedROIPreview';
import ActivityLogPanel from '@/components/admin/ActivityLogPanel';
import AerialImageryViewer from '@/components/admin/AerialImageryViewer';
import { QuoteEstimatorPanel } from '@/components/roof-quoter/QuoteEstimatorPanel';
import { useActivityLog } from '@/hooks/useActivityLog';

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
  crop_meta?: any | null;
}

const QuoteRequestWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [runningMeasure, setRunningMeasure] = useState(false);
  
  const { activities, loading: activitiesLoading, logMeasurementsRun, logROISaved, logImagerySelected, logConvertedToProject, logError } = useActivityLog(request?.id);

  const activeTab = searchParams.get('tab') || 'roof';

  useEffect(() => {
    if (id) {
      fetchQuoteRequest();
    }
  }, [id]);

  const fetchQuoteRequest = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Quote request not found');
        navigate('/admin');
        return;
      }

      setRequest(data);
    } catch (error) {
      console.error('Error fetching quote request:', error);
      toast.error('Failed to load quote request');
    } finally {
      setLoading(false);
    }
  };

  const parseNotesData = (notes: string | null) => {
    if (!notes) return { address: '', urgency: '', additionalInfo: '' };
    
    try {
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

  const handleConvertToProject = async () => {
    if (!request) return;
    
    try {
      setConverting(true);
      const { data, error } = await supabase.functions.invoke('convert-quote-request', {
        body: { quoteRequestId: request.id }
      });
      if (error) throw error;
      toast.success('Converted to Project and measured');
      await fetchQuoteRequest();
    } catch (err) {
      console.error('Conversion failed:', err);
      toast.error('Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const handleRunMeasurements = async (rerun = false) => {
    if (!request) return;

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
          setRequest(updated);
          toast.success('Measurements ready');
          done = true;
          break;
        }
        if (updated?.ai_measurements_status === 'error') {
          setRequest(updated);
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
      await fetchQuoteRequest();
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

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading quote request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Quote request not found</p>
      </div>
    );
  }

  const notesData = parseNotesData(request.notes);
  const propertyAddress = request.property_address || notesData.address;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              aria-label="Back to CRM"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold truncate">Quote Request</h1>
              {propertyAddress && (
                <p className="text-sm text-muted-foreground truncate max-w-[300px] sm:max-w-[500px]">
                  {propertyAddress}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleConvertToProject}
              disabled={converting}
              variant="default"
            >
              {converting ? 'Converting...' : 'Convert to Project'}
            </Button>
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabbed Content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex mb-4">
            <TabsList variant="segmented">
              <TabsTrigger variant="segmented" value="overview">Overview</TabsTrigger>
              <TabsTrigger variant="segmented" value="roof">Roof & Imagery</TabsTrigger>
              <TabsTrigger variant="segmented" value="measurements">AI Measurements</TabsTrigger>
              <TabsTrigger variant="segmented" value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    {request.phone && (
                      <p className="text-sm text-muted-foreground">{request.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p>{request.project_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Property:</span>
                      <p>{request.property_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Timeline:</span>
                      <p>{request.timeline || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Address */}
              {propertyAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle>Property Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{propertyAddress}</p>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced ROI Preview */}
              <EnhancedROIPreview
                roiImageUrl={request.roi_image_url}
                cropMeta={request.crop_meta}
                status={request.ai_measurements_status as 'idle' | 'processing' | 'ready' | 'error'}
                onRegenerateImage={() => {
                  // Implementation for regenerating ROI image
                  console.log('Regenerate ROI image');
                }}
                loading={runningMeasure}
              />
            </div>

            {/* Additional Information */}
            {(notesData.urgency || notesData.additionalInfo) && (
              <div className="space-y-4">
                {notesData.urgency && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Urgency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{notesData.urgency}</p>
                    </CardContent>
                  </Card>
                )}

                {notesData.additionalInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{notesData.additionalInfo}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Roof & Imagery Tab */}
          <TabsContent value="roof" className="mt-6">
            <div className="grid gap-6 xl:grid-cols-12 lg:grid-cols-12">
              {/* Left Column - ROI Map */}
              <div className="xl:col-span-7 lg:col-span-8 space-y-4">
                {/* Toolbar */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRunMeasurements(false)}
                        disabled={!request.roof_roi || runningMeasure}
                      >
                        {runningMeasure ? 'Running...' : 'Run Measurements'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Map Container */}
                <Card>
                  <CardContent className="p-0">
                    {typeof request.latitude === 'number' && typeof request.longitude === 'number' ? (
                      <RoiSelector
                        quoteRequestId={request.id}
                        latitude={request.latitude}
                        longitude={request.longitude}
                        existingROI={request.roof_roi}
                        propertyAddress={propertyAddress}
                        selectedImagery={request.selected_imagery}
                        height="min(78vh, 900px) lg:h-[70vh] md:h-[60vh]"
                        onSaved={fetchQuoteRequest}
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-muted-foreground">
                        Location coordinates missing. Acquire imagery to enable ROI selection.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Controls & Info */}
              <div className="xl:col-span-5 lg:col-span-4 space-y-4">
                {/* Imagery Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Imagery Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {request.selected_imagery ? (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          Google Maps · zoom≈{request.selected_imagery.zoom_estimate || 20}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Using Google Maps satellite imagery
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Imagery will be automatically acquired from Google Maps
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Quote Estimator */}
                <QuoteEstimatorPanel
                  maskPolygon={request.roof_roi?.coordinates}
                  imageUrl={request.roi_image_url || undefined}
                  quoteId={request.id}
                  onQuoteGenerated={(data) => {
                    console.log('Quote generated:', data);
                    fetchQuoteRequest();
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* AI Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6 mt-6">
            {request.ai_measurements && request.ai_measurements_status === 'ready' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">AI Measurements Results</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View JSON
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>AI Measurements JSON</DialogTitle>
                        <DialogDescription>
                          Raw measurement data in JSON format
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-96 w-full">
                        <pre className="text-xs font-mono overflow-auto p-4 bg-muted rounded-lg">
                          {JSON.stringify(request.ai_measurements, null, 2)}
                        </pre>
                      </ScrollArea>
                      <Button
                        onClick={() => downloadJSON(request.ai_measurements, request.id)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                <EnhancedMeasurementPanels
                  data={request.ai_measurements}
                  roiImageUrl={request.roi_image_url}
                  status={request.ai_measurements_status || undefined}
                  updatedAt={request.ai_measurements_updated_at || undefined}
                  onDownloadJson={() => downloadJSON(request.ai_measurements, request.id)}
                  onRerun={() => handleRunMeasurements(true)}
                  running={runningMeasure}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Measurements Yet</p>
                    <p className="mb-4">
                      {request.ai_measurements_status === 'processing'
                        ? 'Analysis in progress...'
                        : 'Select the roof area and run measurements to see AI analysis results.'}
                    </p>
                    <Button onClick={() => handleTabChange('roof')}>
                      Go to Roof & Imagery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <ActivityLogPanel
              activities={activities}
              loading={activitiesLoading}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default QuoteRequestWorkspace;