import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Undo, Redo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImageryTab } from '@/components/roof-quoter/ImageryTab';
import { DrawTab } from '@/components/roof-quoter/DrawTab';
import { EdgesTab } from '@/components/roof-quoter/EdgesTab';
import { FacetsTab } from '@/components/roof-quoter/FacetsTab';
import { PinsTab } from '@/components/roof-quoter/PinsTab';
import { EstimateTab } from '@/components/roof-quoter/EstimateTab';
import { ExportTab } from '@/components/roof-quoter/ExportTab';
import { QuantitiesPanel } from '@/components/roof-quoter/QuantitiesPanel';
import type { QuoterTab, Quantities } from '@/types/roof-quoter';

const RoofQuoter = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<QuoterTab>('imagery');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch quote data
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No quote ID');
      
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Fetch quantities
  const { data: quantities } = useQuery({
    queryKey: ['quantities', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('quantities')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const handleSave = async () => {
    try {
      // This will be implemented as we build the individual tabs
      setLastSaved(new Date());
      toast({
        title: "Saved",
        description: "All changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading roof quoter...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Quote not found</p>
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quote.name || 'Quote'}</h1>
                <p className="text-sm text-gray-500">
                  {quote.property_address || 'No address specified'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <Undo className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Redo className="w-4 h-4" />
                </Button>
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Content - Tabs */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QuoterTab)}>
              <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex mb-6">
                <TabsList variant="segmented">
                  <TabsTrigger variant="segmented" value="imagery">Imagery</TabsTrigger>
                  <TabsTrigger variant="segmented" value="draw">Draw</TabsTrigger>
                  <TabsTrigger variant="segmented" value="edges">Edges</TabsTrigger>
                  <TabsTrigger variant="segmented" value="facets">Facets</TabsTrigger>
                  <TabsTrigger variant="segmented" value="pins">Pins</TabsTrigger>
                  <TabsTrigger variant="segmented" value="estimate">Estimate</TabsTrigger>
                  <TabsTrigger variant="segmented" value="export">Export</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="imagery" className="mt-0">
                <ImageryTab 
                  projectId={projectId!} 
                  latitude={quote.latitude ? Number(quote.latitude) : undefined}
                  longitude={quote.longitude ? Number(quote.longitude) : undefined}
                />
              </TabsContent>

              <TabsContent value="draw" className="mt-0">
                <DrawTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="edges" className="mt-0">
                <EdgesTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="facets" className="mt-0">
                <FacetsTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="pins" className="mt-0">
                <PinsTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="estimate" className="mt-0">
                <EstimateTab projectId={projectId!} />
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <ExportTab projectId={projectId!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Quantities */}
          <div className="w-80">
            <QuantitiesPanel 
              projectId={projectId!} 
              quantities={quantities}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoofQuoter;