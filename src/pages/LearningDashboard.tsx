import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp,
  Database,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BulkProjectImporter } from '@/components/quote-detail/BulkProjectImporter';

interface EdgeTrainingData {
  id: string;
  quote_id: string;
  edge_type: string;
  length_ft: number;
  line_geometry: any;
  created_at: string;
  session_id: string;
  angle_degrees: number;
  was_ai_suggestion: boolean;
  user_accepted: boolean | null;
}

interface ProjectTrainingDocument {
  id: string;
  quote_request_id: string | null;
  source_file_url: string;
  source_file_type: string;
  document_category: string;
  extracted_data: any;
  file_name: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export default function LearningDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('all');
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [tempQuoteId] = useState('training-dashboard'); // Temporary ID for general training uploads

  // Fetch edge training data (manual drawings)
  const { data: trainingData, isLoading } = useQuery({
    queryKey: ['training-data', selectedEdgeType],
    queryFn: async () => {
      let query = supabase
        .from('edge_training_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedEdgeType !== 'all') {
        query = query.eq('edge_type', selectedEdgeType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EdgeTrainingData[];
    }
  });

  // Fetch project training documents with property addresses
  const { data: projectDocuments, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['project-training-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_training_documents')
        .select(`
          *,
          quote_requests!project_training_documents_quote_request_id_fkey(
            property_address,
            project_type,
            property_type
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Group documents by property/quote
  const docsByProperty = projectDocuments?.reduce((acc, doc) => {
    // First try to get address from the extracted data (AI read it from the document)
    const extractedData = doc.extracted_data as any;
    const extractedAddress = extractedData?.property_address;
    // Fallback to quote request address if not extracted
    const quoteAddress = doc.quote_requests?.property_address;
    
    const address = extractedAddress || quoteAddress || 'Unknown Property';
    const quoteId = doc.quote_request_id || 'unknown';
    
    if (!acc[quoteId]) {
      acc[quoteId] = {
        address,
        projectType: doc.quote_requests?.project_type,
        propertyType: doc.quote_requests?.property_type,
        documents: []
      };
    }
    
    // Update address if we found a better one from extraction
    if (extractedAddress && !acc[quoteId].address.includes(extractedAddress)) {
      acc[quoteId].address = extractedAddress;
    }
    
    acc[quoteId].documents.push(doc);
    return acc;
  }, {} as Record<string, { 
    address: string; 
    projectType: string;
    propertyType: string;
    documents: any[] 
  }>);

  // Group by category for stats
  const docsByCategory = projectDocuments?.reduce((acc, doc) => {
    const category = doc.document_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  // Get samples by type for filter
  const { data: samplesByType } = useQuery({
    queryKey: ['samples-by-type'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_training_data')
        .select('edge_type');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        counts[row.edge_type] = (counts[row.edge_type] || 0) + 1;
      });
      
      return counts;
    }
  });

  // Delete samples mutation
  const deleteMutation = useMutation({
    mutationFn: async (sampleIds: string[]) => {
      const { error } = await supabase
        .from('edge_training_data')
        .delete()
        .in('id', sampleIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
      queryClient.invalidateQueries({ queryKey: ['samples-by-type'] });
      queryClient.invalidateQueries({ queryKey: ['learning-metrics'] });
      setSelectedSamples(new Set());
      toast.success('Training samples deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete samples');
    }
  });

  // Delete by quote mutation
  const deleteByQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('edge_training_data')
        .delete()
        .eq('quote_id', quoteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
      queryClient.invalidateQueries({ queryKey: ['samples-by-type'] });
      queryClient.invalidateQueries({ queryKey: ['learning-metrics'] });
      toast.success('All samples for quote deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete samples');
    }
  });

  const handleSelectSample = (id: string) => {
    const newSelected = new Set(selectedSamples);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSamples(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSamples.size === trainingData?.length) {
      setSelectedSamples(new Set());
    } else {
      setSelectedSamples(new Set(trainingData?.map(d => d.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedSamples.size === 0) return;
    deleteMutation.mutate(Array.from(selectedSamples));
  };

  const groupedByQuote = trainingData?.reduce((acc, sample) => {
    if (!acc[sample.quote_id]) {
      acc[sample.quote_id] = [];
    }
    acc[sample.quote_id].push(sample);
    return acc;
  }, {} as Record<string, EdgeTrainingData[]>);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Learning Dashboard</h1>
            <p className="text-muted-foreground">
              Review and manage all training data
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Upload className="h-4 w-4 mr-2" />
                Upload Samples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Training Samples</DialogTitle>
                <DialogDescription>
                  Add project screenshots to train the AI
                </DialogDescription>
              </DialogHeader>
              <BulkProjectImporter quoteId={tempQuoteId} />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/model-training')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Model Training
          </Button>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['training-data'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Edge Training Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{trainingData?.length || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Manual drawings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{projectDocuments?.length || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Uploaded screenshots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Document Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              <span className="text-3xl font-bold">
                {docsByCategory ? Object.keys(docsByCategory).length : 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Types of docs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-bold">
                {(trainingData?.length || 0) + (projectDocuments?.length || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total training items</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Training Samples</CardTitle>
              <CardDescription>
                Review individual samples and delete bad training data
              </CardDescription>
            </div>
            {selectedSamples.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedSamples.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Training Samples?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedSamples.size} training samples. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Edge Type Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedEdgeType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedEdgeType('all')}
            >
              All ({trainingData?.length || 0})
            </Button>
            {samplesByType && Object.entries(samplesByType).map(([type, count]) => (
              <Button
                key={type}
                variant={selectedEdgeType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEdgeType(type)}
              >
                {type} ({count})
              </Button>
            ))}
          </div>

          {/* Training Data Tabs */}
          <Tabs defaultValue="project-docs" className="w-full">
            <div className="bg-muted/50 rounded-xl p-1.5 inline-flex mb-4">
              <TabsList variant="segmented">
                <TabsTrigger variant="segmented" value="project-docs">📦 Project Documents</TabsTrigger>
                <TabsTrigger variant="segmented" value="by-quote">📐 Edge Training</TabsTrigger>
                <TabsTrigger variant="segmented" value="all-samples">All Edge Samples</TabsTrigger>
              </TabsList>
            </div>

            {/* Project Documents Tab - Grouped by Property */}
            <TabsContent value="project-docs" className="space-y-4">
              {isLoadingDocs ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !docsByProperty || Object.keys(docsByProperty).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium mb-1">No project documents uploaded yet</p>
                  <p className="text-sm">Go to Training Tab and upload screenshots of your projects!</p>
                </div>
              ) : (
                Object.entries(docsByProperty).map(([quoteId, project]) => (
                  <Collapsible
                    key={quoteId}
                    open={expandedProperties.has(quoteId)}
                    onOpenChange={(open) => {
                      const newExpanded = new Set(expandedProperties);
                      if (open) {
                        newExpanded.add(quoteId);
                      } else {
                        newExpanded.delete(quoteId);
                      }
                      setExpandedProperties(newExpanded);
                    }}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center gap-3">
                              {expandedProperties.has(quoteId) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  🏠 {project.address}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-3 mt-1">
                                  <span>{project.documents.length} document{project.documents.length !== 1 ? 's' : ''}</span>
                                  {project.projectType && <Badge variant="outline">{project.projectType}</Badge>}
                                  {project.propertyType && <Badge variant="outline">{project.propertyType}</Badge>}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                              {project.documents.length}
                            </Badge>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">AI Learning Summary:</span>
                          <span>Training data from {project.documents.length} sources for more accurate predictions</span>
                        </div>

                        <div className="space-y-3">
                          {project.documents.map(doc => (
                            <div key={doc.id} className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                  {/* Document Header */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getCategoryIcon(doc.document_category)}</span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{formatCategoryName(doc.document_category)}</span>
                                        <Badge variant={doc.processing_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                          {doc.processing_status}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                                    </div>
                                  </div>
                                  
                                  {/* AI Learned Data */}
                                  {doc.extracted_data && doc.processing_status === 'completed' && (
                                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Database className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-sm text-primary">📊 Extracted Data:</span>
                                      </div>
                                      <div className="text-sm space-y-2">
                                        {renderExpertInsights(doc.document_category, doc.extracted_data)}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>📅 Uploaded: {new Date(doc.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                                
                                {/* Thumbnail preview */}
                                {doc.source_file_url && (
                                  <div className="shrink-0">
                                    <img 
                                      src={doc.source_file_url} 
                                      alt={doc.file_name}
                                      className="w-32 h-32 object-cover rounded-lg border-2 shadow-sm"
                                    />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </TabsContent>

            <TabsContent value="by-quote" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !groupedByQuote || Object.keys(groupedByQuote).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No training data yet. Start drawing to collect samples!</p>
                </div>
              ) : (
                Object.entries(groupedByQuote).map(([quoteId, samples]) => (
                  <Card key={quoteId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Quote ID: {quoteId.slice(0, 8)}...
                          </CardTitle>
                          <CardDescription>
                            {samples.length} samples • {new Date(samples[0].created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete All
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete All Samples for This Quote?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all {samples.length} training samples from this quote.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteByQuoteMutation.mutate(quoteId)}>
                                Delete All
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {samples.map(sample => (
                          <Badge
                            key={sample.id}
                            variant={selectedSamples.has(sample.id) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleSelectSample(sample.id)}
                          >
                            {sample.edge_type} ({Math.round(sample.length_ft)}ft)
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="all-samples" className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedSamples.size === trainingData?.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !trainingData || trainingData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No training data yet. Start drawing to collect samples!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {trainingData.map(sample => (
                    <div
                      key={sample.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSamples.has(sample.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelectSample(sample.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge>{sample.edge_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(sample.length_ft)}ft • {Math.round(sample.angle_degrees)}°
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(sample.created_at).toLocaleString()}
                          </span>
                        </div>
                        {sample.was_ai_suggestion && (
                          <Badge variant="secondary" className="text-xs">
                            AI Suggestion
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    sketch_report: '📐',
    estimate: '💰',
    material_order: '📦',
    labor_report: '👷',
    contract: '📄',
    roof_photo: '📸',
    other: '📎'
  };
  return icons[category] || '📎';
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function renderExpertInsights(category: string, data: any): React.ReactNode {
  if (!data || typeof data !== 'object') {
    return <p className="text-sm opacity-70">No data extracted</p>;
  }

  const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>;
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-muted-foreground italic">[]</span>;
        return (
          <div className="ml-4 space-y-1 mt-1">
            {value.map((item, idx) => (
              <div key={idx} className="border-l-2 border-primary/30 pl-3">
                <span className="text-muted-foreground text-xs">#{idx + 1}:</span> {renderValue(item, depth + 1)}
              </div>
            ))}
          </div>
        );
      }
      
      const entries = Object.entries(value);
      if (entries.length === 0) return <span className="text-muted-foreground italic">{'{}'}</span>;
      
      return (
        <div className="ml-4 space-y-1 mt-1">
          {entries.map(([k, v]) => (
            <div key={k} className="border-l-2 border-primary/20 pl-3">
              <span className="font-medium text-primary">{k}:</span> {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'boolean') return <span className="text-blue-600 dark:text-blue-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-green-600 dark:text-green-400 font-mono">{value}</span>;
    if (typeof value === 'string') return <span className="text-foreground">{value}</span>;
    
    return <span>{String(value)}</span>;
  };

  const dataEntries = Object.entries(data);
  
  return (
    <div className="space-y-3 font-mono text-xs">
      {dataEntries.map(([key, value]) => (
        <div key={key} className="border-l-4 border-primary/40 pl-3 py-1">
          <div className="font-semibold text-primary text-sm mb-1">{key}:</div>
          {renderValue(value)}
        </div>
      ))}
    </div>
  );
}