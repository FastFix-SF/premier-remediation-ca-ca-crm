import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, Loader2, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRoofCorrections } from '@/hooks/useRoofCorrections';

interface VisionAnalysisTesterProps {
  quoteId: string;
  latitude?: number;
  longitude?: number;
}

export function VisionAnalysisTester({ quoteId, latitude, longitude }: VisionAnalysisTesterProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { saveCorrection, isSaving } = useRoofCorrections();

  // Fetch aerial images for this quote
  const { data: aerialImages, isLoading: imagesLoading } = useQuery({
    queryKey: ['aerial-images', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aerial_images')
        .select('*')
        .eq('quote_request_id', quoteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent corrections count for learning status
  const { data: correctionsData } = useQuery({
    queryKey: ['roof-corrections-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('roof_corrections')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count;
    }
  });

  const runVisionAnalysis = async () => {
    if (!aerialImages || aerialImages.length === 0) {
      toast.error('No aerial imagery available for this quote');
      return;
    }

    if (!latitude || !longitude) {
      toast.error('Location data (latitude/longitude) is required for vision analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const imageUrl = aerialImages[0].image_url;
      
      toast.info('Starting Gemini 2.5 Pro vision analysis...');

      const { data, error } = await supabase.functions.invoke('vision-roof-analysis', {
        body: {
          imageUrl,
          latitude,
          longitude,
          quoteId
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success('Vision analysis completed!');
    } catch (error: any) {
      console.error('Vision analysis error:', error);
      toast.error(error.message || 'Failed to run vision analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (imagesLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading aerial imagery...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Test Vision Analysis (Gemini 2.5 Pro)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Test how well Gemini 2.5 Pro analyzes your roof without any fine-tuning
            </p>
          </div>
        </div>

        {/* Learning Status */}
        <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-purple-900 dark:text-purple-100">AI Learning Status</p>
              <p className="text-purple-700 dark:text-purple-300 mt-1">
                {correctionsData && correctionsData > 0 ? (
                  <>Learning from <strong>{correctionsData}</strong> manual corrections. Each correction you save improves future predictions!</>
                ) : (
                  <>No corrections yet. After running analysis, manually adjust vertices and save corrections to teach the AI.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Workflow */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">Recommended Workflow</p>
              <ol className="text-green-700 dark:text-green-300 mt-2 space-y-1 list-decimal list-inside">
                <li>First, get <strong>Solar API</strong> data (Aerial tab) for precise roof boundary</li>
                <li>Then run <strong>Vision AI</strong> to detect edges within that boundary</li>
                <li>Manually adjust any incorrect vertices in Draw tab</li>
                <li>Corrections are automatically saved to improve future predictions</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">About This Test</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Gemini 2.5 Pro uses Solar API roof boundaries as ground truth, then detects edges within them. 
                With {correctionsData || 0} correction examples, accuracy improves over time.
              </p>
            </div>
          </div>
        </div>

        {/* Aerial Images Status */}
        {aerialImages && aerialImages.length > 0 ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-600">
              {aerialImages.length} aerial image{aerialImages.length > 1 ? 's' : ''} available
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                  No Aerial Imagery Available
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                  You need to acquire aerial imagery first before testing vision analysis. 
                  Go to the "Aerial" tab to get started.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm">
          {latitude && longitude ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-600">
                Location data available ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600">No location data available</span>
            </>
          )}
        </div>

        {/* Test Button */}
        <Button
          onClick={runVisionAnalysis}
          disabled={isAnalyzing || !aerialImages || aerialImages.length === 0 || !latitude || !longitude}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with Gemini 2.5 Pro...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Test Vision Analysis
            </>
          )}
        </Button>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Analysis Results:</h4>
              
              {analysisResult.analysis && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    💡 After adjusting vertices in Draw tab, they'll automatically be saved as corrections for AI learning
                  </p>
                </div>
              )}
            </div>
            
            {analysisResult.roofType && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Detected Roof Type:</p>
                <p className="text-lg">{analysisResult.roofType}</p>
              </div>
            )}

            {analysisResult.edges && analysisResult.edges.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Detected Edges ({analysisResult.edges.length}):</p>
                <div className="space-y-2">
                  {analysisResult.edges.slice(0, 5).map((edge: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{edge.type || 'Unknown'}</span>
                      <span className="text-muted-foreground">
                        {edge.length ? `${edge.length.toFixed(2)} ft` : 'N/A'}
                      </span>
                    </div>
                  ))}
                  {analysisResult.edges.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {analysisResult.edges.length - 5} more edges
                    </p>
                  )}
                </div>
              </div>
            )}

            {analysisResult.planes && analysisResult.planes.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Detected Roof Planes:</p>
                <p className="text-lg">{analysisResult.planes.length} planes detected</p>
              </div>
            )}

            {analysisResult.features && analysisResult.features.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Detected Features:</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.features.map((feature: any, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {feature.type || feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON for debugging */}
            <details className="bg-muted rounded-lg p-4">
              <summary className="text-sm font-medium cursor-pointer">View Raw JSON</summary>
              <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </Card>
  );
}
