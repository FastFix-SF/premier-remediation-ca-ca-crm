import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';

interface AIQuoteBuilderProps {
  quoteId: string;
  onQuoteGenerated: () => void;
}

interface MeasurementData {
  totalArea: number;
  squares: number;
  edges: {
    eave: number;
    rake: number;
    ridge: number;
    valley: number;
    hip: number;
  };
  pins: Record<string, number>;
  source: 'solar' | 'plan_viewer' | 'mixed';
  projectType: string;
  propertyType: string;
}

export const AIQuoteBuilder: React.FC<AIQuoteBuilderProps> = ({ quoteId, onQuoteGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null);
  const [loadingMeasurements, setLoadingMeasurements] = useState(true);

  useEffect(() => {
    loadMeasurements();
  }, [quoteId]);

  const loadMeasurements = async () => {
    try {
      setLoadingMeasurements(true);

      // Fetch quote data for edges and pins
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_requests')
        .select('edges, pins, facets, project_type, property_type')
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError) throw quoteError;

      // Fetch solar analysis data for total area - cast to any to avoid deep type inference
      // @ts-ignore - Type instantiation is excessively deep
      const solarResult: any = await supabase
        .from('solar_analyses')
        .select('total_area_sqft, total_area_squares')
        .eq('quote_request_id', quoteId)
        .maybeSingle();
      
      const solarData = solarResult?.data;

      // Calculate edges from plan viewer
      const edges = (quoteData?.edges as any[]) || [];
      const edgeStats = {
        eave: edges.filter((e: any) => e.edgeLabel === 'EAVE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
        rake: edges.filter((e: any) => e.edgeLabel === 'RAKE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
        ridge: edges.filter((e: any) => e.edgeLabel === 'RIDGE').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
        valley: edges.filter((e: any) => e.edgeLabel === 'VALLEY').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
        hip: edges.filter((e: any) => e.edgeLabel === 'HIP').reduce((sum: number, e: any) => sum + (e.length || 0), 0),
      };

      // Get pins
      const pins = (quoteData?.pins as any[]) || [];
      const pinCounts = pins.reduce((acc: any, pin: any) => {
        acc[pin.type] = (acc[pin.type] || 0) + 1;
        return acc;
      }, {});

      // Get total area - prefer solar API, fallback to facets
      let totalArea = 0;
      let source: 'solar' | 'plan_viewer' | 'mixed' = 'plan_viewer';
      
      if (solarData?.total_area_sqft) {
        totalArea = Number(solarData.total_area_sqft);
        source = 'solar';
      } else {
        const facets = (quoteData?.facets as any) || {};
        const calculatedArea = Object.values(facets).reduce((sum: number, facet: any) => {
          return sum + (Number(facet?.area) || 0);
        }, 0 as number);
        totalArea = Number(calculatedArea);
      }

      setMeasurements({
        totalArea,
        squares: totalArea / 100,
        edges: edgeStats,
        pins: pinCounts,
        source,
        projectType: quoteData?.project_type || 'Not specified',
        propertyType: quoteData?.property_type || 'Not specified'
      });
    } catch (error) {
      console.error('Error loading measurements:', error);
      toast.error('Failed to load measurements');
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const generateQuote = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('ai-quote-builder', {
        body: { quoteId }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data.success) {
        setEstimate(data.estimate);
        toast.success('AI quote generated successfully!');
      } else {
        console.error('AI quote generation failed:', data.error);
        throw new Error(data.error || 'Failed to generate quote');
      }
    } catch (error) {
      console.error('Error generating AI quote:', error);
      toast.error(error.message || 'Failed to generate AI quote');
    } finally {
      setLoading(false);
    }
  };

  const applyQuote = async () => {
    if (!estimate) return;

    try {
      setLoading(true);

      // Generate unique IDs for each item
      const timestampShingles = Date.now();
      const timestampServices = Date.now() + 1000;
      const timestampRF = Date.now() + 2000;

      const shinglesWithIds = estimate.shingles_items?.map((item: any, index: number) => ({
        ...item,
        id: `shingles-${timestampShingles}-${index}`,
        showInApp: true,
        showOnEstimate: true,
        showOnMaterialOrder: true,
        showOnContract: true,
        showOnLaborReport: true,
        factor: item.factor || 1.00,
        total: (item.labor || 0) + (item.material || 0)
      })) || [];

      const servicesWithIds = estimate.services_items?.map((item: any, index: number) => ({
        ...item,
        id: `services-${timestampServices}-${index}`,
        showInApp: true,
        showOnEstimate: true,
        showOnMaterialOrder: true,
        showOnContract: true,
        showOnLaborReport: true,
        coverage: 1,
        factor: item.factor || 1.00,
        total: (item.labor || 0) + (item.material || 0)
      })) || [];

      const rfWithIds = estimate.rf_items?.map((item: any, index: number) => ({
        ...item,
        id: `rf-${timestampRF}-${index}`,
        showInApp: true,
        showOnEstimate: true,
        showOnMaterialOrder: true,
        showOnContract: true,
        showOnLaborReport: true,
        factor: item.factor || 1.00,
        total: (item.labor || 0) + (item.material || 0)
      })) || [];

      const { error } = await supabase
        .from('quote_requests')
        .update({
          shingles_items: shinglesWithIds,
          services_items: servicesWithIds,
          rf_items: rfWithIds
        })
        .eq('id', quoteId);

      if (error) throw error;

      toast.success('Quote applied successfully! Check the Materials tab.');
      onQuoteGenerated();
      setEstimate(null); // Clear the preview after applying
    } catch (error) {
      console.error('Error applying quote:', error);
      toast.error('Failed to apply quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardDescription>
            Review measurements below and generate a comprehensive quote based on your data
          </CardDescription>
        </div>
        <Button
          onClick={generateQuote}
          disabled={loading || loadingMeasurements || !measurements}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Quote
            </>
          )}
        </Button>
      </div>

      {loadingMeasurements ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading measurements...</span>
        </div>
      ) : measurements && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Pre-Generation Variables</h3>
            </div>
            
            <div className="space-y-4">
              {/* Project Details */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="text-xs font-medium text-muted-foreground mb-3">Project Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Roof Type</div>
                    <div className="text-sm font-semibold">Shingles</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Desired Roof Type</div>
                    <div className="text-sm font-semibold">Metal</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Project Type</div>
                      <div className="text-sm capitalize">{measurements.projectType.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Property Type</div>
                      <div className="text-sm capitalize">{measurements.propertyType}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Area from Solar API */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">Total Roof Area</div>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {measurements.source === 'solar' ? 'Solar API' : 'Plan Viewer Calculation'}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {measurements.totalArea.toFixed(2)} sq ft
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ({measurements.squares.toFixed(2)} squares)
                </div>
              </div>

              {/* Edge Measurements from Plan Viewer */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-muted-foreground">Edge Measurements</div>
                  <Badge variant="outline" className="text-xs">
                    From Plan Viewer
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Eave</div>
                    <div className="text-lg font-semibold">{measurements.edges.eave.toFixed(0)} lf</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Rake</div>
                    <div className="text-lg font-semibold">{measurements.edges.rake.toFixed(0)} lf</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Ridge</div>
                    <div className="text-lg font-semibold">{measurements.edges.ridge.toFixed(0)} lf</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Valley</div>
                    <div className="text-lg font-semibold">{measurements.edges.valley.toFixed(0)} lf</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Hip</div>
                    <div className="text-lg font-semibold">{measurements.edges.hip.toFixed(0)} lf</div>
                  </div>
                </div>
              </div>

              {/* Pins/Special Features */}
              {Object.keys(measurements.pins).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-3">Special Features</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(measurements.pins).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="px-3 py-1">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  These measurements will be used by AI to generate accurate material quantities and labor estimates for converting from {measurements.projectType} to Metal roof.
                </p>
              </div>
            </div>
          </div>
      )}

      {estimate && (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm font-medium mb-2">Estimated Total</div>
                <div className="text-3xl font-bold text-primary">
                  ${estimate.summary?.grand_total?.toLocaleString() || '0'}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Materials: ${estimate.summary?.total_materials?.toLocaleString() || '0'} | 
                  Labor: ${estimate.summary?.total_labor?.toLocaleString() || '0'}
                </div>
              </div>

              {/* Key Considerations */}
              {estimate.summary?.key_considerations && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Considerations:</div>
                  <ul className="space-y-1">
                    {estimate.summary.key_considerations.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Items Breakdown */}
              <div className="space-y-4">
                {estimate.shingles_items?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      Main Roofing Materials
                      <Badge variant="secondary">{estimate.shingles_items.length} items</Badge>
                    </div>
                    <div className="space-y-2">
                      {estimate.shingles_items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground">
                            {item.justification}
                          </div>
                        </div>
                      ))}
                      {estimate.shingles_items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{estimate.shingles_items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {estimate.services_items?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      Services
                      <Badge variant="secondary">{estimate.services_items.length} items</Badge>
                    </div>
                    <div className="space-y-2">
                      {estimate.services_items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground">
                            {item.justification}
                          </div>
                        </div>
                      ))}
                      {estimate.services_items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{estimate.services_items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={applyQuote} className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply This Quote
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
      )}
    </div>
  );
};
