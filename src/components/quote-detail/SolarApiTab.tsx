import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Sun, Loader2, MapPin, Calendar, Image, CheckCircle, AlertCircle, RefreshCw, Download, ArrowRight } from 'lucide-react';
import { useSolarAnalysis } from '@/hooks/useSolarAnalysis';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SolarRoofVisualization } from './SolarRoofVisualization';

interface SolarApiTabProps {
  quoteId: string;
  quote: any;
  isFullscreen?: boolean;
}

export function SolarApiTab({ quoteId, quote, isFullscreen = false }: SolarApiTabProps) {
  const { 
    solarAnalysis, 
    isLoading, 
    analyzeSolar, 
    applyToQuantities,
    applyToQuote 
  } = useSolarAnalysis(quoteId);
  
  const [mapsApiKey, setMapsApiKey] = useState<string>('');

  useEffect(() => {
    const fetchApiKey = async () => {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      if (data?.apiKey) {
        setMapsApiKey(data.apiKey);
      }
    };
    fetchApiKey();
  }, []);

  const handleAnalyze = () => {
    if (!quote?.latitude || !quote?.longitude) {
      toast.error('Property location not available. Please add coordinates to the quote.');
      return;
    }

    analyzeSolar.mutate({
      latitude: quote.latitude,
      longitude: quote.longitude,
    });
  };

  const handleApplyAll = async () => {
    try {
      await applyToQuote.mutateAsync();
      
      // Find the roof_quoter_projects record linked to this quote
      const projectResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/roof_quoter_projects?quote_request_id=eq.${quoteId}&select=project_id`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      if (projectResponse.ok) {
        const projects = await projectResponse.json();
        if (projects.length > 0) {
          await applyToQuantities.mutateAsync(projects[0].project_id);
          toast.success('All data applied successfully! Check the Estimator tab.');
        }
      }
    } catch (error) {
      console.error('Error applying data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'HIGH': return 'bg-success text-success-foreground';
      case 'MEDIUM': return 'bg-warning text-warning-foreground';
      case 'LOW': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading solar analysis...</p>
        </div>
      </div>
    );
  }

  // No analysis yet - show analyze button
  if (!solarAnalysis) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Google Solar API Analysis</h2>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Use Google's Solar API to automatically extract precise roof measurements from satellite imagery. 
            This will analyze roof segments, calculate areas, and estimate edge lengths for accurate quotes.
          </p>

          {quote?.property_address && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Property Address</h3>
                  <p className="text-sm">{quote.property_address}</p>
                  {quote.latitude && quote.longitude && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {quote.latitude.toFixed(6)}, {quote.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {quote?.latitude && quote?.longitude ? (
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzeSolar.isPending}
              size="lg"
              className="w-full"
            >
              {analyzeSolar.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Satellite Imagery...
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Analyze with Google Solar API
                </>
              )}
            </Button>
          ) : (
            <div className="bg-warning/10 border border-warning rounded-lg p-4 text-center">
              <AlertCircle className="w-5 h-5 text-warning mx-auto mb-2" />
              <p className="text-sm text-warning">
                Property coordinates not available. Please geocode the address first.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Show analysis results
  const parsedData = solarAnalysis.parsed_roof_data;
  const isComplete = solarAnalysis.status === 'complete';
  const hasError = solarAnalysis.status === 'error';

  return (
    <div className={`${isFullscreen ? 'h-full flex flex-col' : 'space-y-6'}`}>
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sun className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-semibold">Solar API Analysis</h2>
              <p className="text-sm text-muted-foreground">Google satellite imagery analysis</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzeSolar.isPending}
          >
            {analyzeSolar.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Re-analyze
          </Button>
        </div>

        {hasError && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive mb-1">Analysis Error</h3>
                <p className="text-sm text-destructive/90">
                  {solarAnalysis.error_message || 'Failed to analyze roof. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">
                  {parsedData.totalAreaSqFt.toLocaleString()} ft²
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Roof Area</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {parsedData.totalAreaSquares.toFixed(1)} squares
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {parsedData.segments.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Roof Segments</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Detected planes
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {parsedData.totalPerimeter.toLocaleString()} ft
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Perimeter</div>
                <div className="text-xs text-muted-foreground mt-1">
                  All edges
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getQualityColor(solarAnalysis.imagery_quality)}>
                    {solarAnalysis.imagery_quality}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">Imagery Quality</div>
                <div className="flex items-center gap-1 mt-2">
                  <Progress value={solarAnalysis.confidence_score * 100} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(solarAnalysis.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Imagery Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Imagery Date: {formatDate(solarAnalysis.imagery_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span>Source: Google Solar API</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Interactive Roof Visualization */}
            {mapsApiKey && parsedData.segments.length > 0 && (
              <div className={`mb-6 ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
                <SolarRoofVisualization
                  segments={parsedData.segments}
                  center={{ latitude: quote.latitude, longitude: quote.longitude }}
                  apiKey={mapsApiKey}
                  isFullscreen={isFullscreen}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleApplyAll}
                disabled={applyToQuote.isPending || applyToQuantities.isPending}
                size="lg"
                className="flex-1"
              >
                {(applyToQuote.isPending || applyToQuantities.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying Data...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply All to Quote & Quantities
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const dataStr = JSON.stringify(solarAnalysis, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `solar-analysis-${quoteId}.json`;
                  a.click();
                  toast.success('Analysis data downloaded');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Edge Estimates */}
      {isComplete && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estimated Linear Measurements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(parsedData.edgeEstimates).map(([key, value]) => (
              <div key={key} className="bg-muted/50 rounded-lg p-4">
                <div className="text-xl font-bold">{value} ft</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {key.replace('_lf', '').replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Edge measurements are estimated based on roof geometry. Manual verification recommended.
          </p>
        </Card>
      )}


      {/* Solar Potential Info */}
      {isComplete && parsedData.maxPanelsCount > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <Sun className="w-8 h-8 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Solar Potential</h3>
              <p className="text-muted-foreground mb-4">
                This roof could potentially accommodate up to <strong>{parsedData.maxPanelsCount} solar panels</strong> with 
                approximately <strong>{parsedData.maxSunshineHours.toLocaleString()} hours</strong> of sunshine per year.
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More About Solar Options
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
