import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Database, CheckCircle, ExternalLink, Trash2, Play, Square } from 'lucide-react';
import { useLearningMetrics } from '@/hooks/useLearningMetrics';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LearningProgressBadgeProps {
  isTracking?: boolean;
  onStartLearning?: () => void;
  onStopLearning?: () => void;
  stats?: {
    totalActions: number;
    totalLines: number;
    totalFacets: number;
    sessionDuration: number;
  };
}

export const LearningProgressBadge: React.FC<LearningProgressBadgeProps> = ({ 
  isTracking = false,
  onStartLearning,
  onStopLearning,
  stats = { totalActions: 0, totalLines: 0, totalFacets: 0, sessionDuration: 0 }
}) => {
  const { totalSamples, samplesByType, readiness } = useLearningMetrics();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate autonomous operation readiness
  const targetSamplesForAutonomy = 100;
  const autonomyProgress = Math.min((totalSamples / targetSamplesForAutonomy) * 100, 100);
  const sessionQuality = calculateSessionQuality(stats);

  const { data: samples = [] } = useQuery({
    queryKey: ['training-samples-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_training_sessions')
        .select(`
          *,
          quote_requests!quote_training_sessions_quote_id_fkey(property_address)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleDeleteSample = async (sessionId: string) => {
    try {
      // Delete the quote training session (cascade will delete associated edges)
      const { error } = await supabase
        .from('quote_training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['training-samples-preview'] });
      queryClient.invalidateQueries({ queryKey: ['learning-metrics'] });
      
      toast({
        title: "Quote sample deleted",
        description: "All training data for this quote removed",
      });
    } catch (error) {
      console.error('Error deleting sample:', error);
      toast({
        title: "Error",
        description: "Failed to delete quote sample",
        variant: "destructive",
      });
    }
  };

  const getIcon = () => {
    switch (readiness.level) {
      case 'collecting': return <Database className="h-3 w-3" />;
      case 'ready': return <Brain className="h-3 w-3" />;
      case 'learning': return <TrendingUp className="h-3 w-3" />;
      case 'confident': return <CheckCircle className="h-3 w-3" />;
      default: return <Database className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (readiness.level) {
      case 'collecting': return 'secondary';
      case 'ready': return 'default';
      case 'learning': return 'default';
      case 'confident': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Start/Stop Learning Button */}
      {isTracking ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={onStopLearning}
          className="gap-2"
        >
          <Square className="h-3 w-3 fill-current" />
          Stop Training
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={onStartLearning}
          className="gap-2"
        >
          <Play className="h-3 w-3 fill-current" />
          Start Training
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <div>
            <Badge 
              variant={getVariant()}
              className="cursor-pointer gap-1.5 animate-pulse"
            >
              {getIcon()}
              <span className="text-xs">{totalSamples} {totalSamples === 1 ? 'quote' : 'quotes'}</span>
            </Badge>
          </div>
        </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          {/* Autonomous Operation Readiness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Autonomous Operation Readiness
              </h4>
              <Badge variant={autonomyProgress >= 100 ? 'default' : 'secondary'}>
                {Math.round(autonomyProgress)}%
              </Badge>
            </div>
            <Progress value={autonomyProgress} />
            <p className="text-xs text-muted-foreground">
              {autonomyProgress >= 100 
                ? '🎉 AI is ready for autonomous operation! It can now detect and classify edges without supervision.'
                : `${targetSamplesForAutonomy - totalSamples} more quotes needed for full autonomous operation`}
            </p>
          </div>

          {/* Current Session Stats (if tracking) */}
          {isTracking && (
            <div className="space-y-2 border-t pt-3">
              <h5 className="text-xs font-medium text-muted-foreground">
                Current Session
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="font-medium">Actions</span>
                  <span className="text-muted-foreground">{stats.totalActions}</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="font-medium">Edges</span>
                  <span className="text-muted-foreground">{stats.totalLines}</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="font-medium">Facets</span>
                  <span className="text-muted-foreground">{stats.totalFacets}</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="font-medium">Quality</span>
                  <span className="text-muted-foreground">{sessionQuality.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
          )}

          {/* Training Goal Explanation */}
          <div className="space-y-2 border-t pt-3">
            <h5 className="text-xs font-medium text-muted-foreground">
              Training Purpose
            </h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every edge you draw, facet you create, and correction you make teaches the AI. 
              The goal: train the AI to autonomously detect roof features, classify edges, and 
              generate quotes without human supervision.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">AI Learning Progress</h4>
              <span className="text-xs text-muted-foreground">
                {Math.round(readiness.percentage)}%
              </span>
            </div>
            <Progress value={readiness.percentage} />
            <p className="text-xs text-muted-foreground">
              {readiness.message}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground">
              Training Progress
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                <span className="font-medium">Total Quotes</span>
                <span className="text-muted-foreground">{totalSamples}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-medium text-muted-foreground">
                Recent Quote Samples
              </h5>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => navigate('/admin/learning-dashboard')}
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {samples.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No quote samples yet
                  </p>
                ) : (
                  samples.map((sample: any) => (
                    <div 
                      key={sample.id}
                      className="flex items-start justify-between gap-2 p-2 bg-muted rounded text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 truncate">
                          {sample.quote_requests?.property_address || 'Unknown Address'}
                        </div>
                        <div className="text-muted-foreground space-y-0.5">
                          <div>Actions: {sample.total_actions || 0}</div>
                          <div>Lines: {sample.total_lines_drawn || 0}</div>
                          <div className="text-xs">
                            {new Date(sample.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteSample(sample.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" />
              Every quote you work on helps train the AI
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </div>
  );
};

// Calculate session quality for current training session
function calculateSessionQuality(stats: { totalActions: number; totalLines: number; totalFacets: number }): number {
  let score = 0;
  
  // Reward diversity of actions
  if (stats.totalLines > 5) score += 1;
  if (stats.totalLines > 15) score += 1;
  if (stats.totalFacets > 3) score += 1;
  if (stats.totalActions > 20) score += 0.5;
  if (stats.totalActions > 50) score += 0.5;
  
  return Math.min(score, 5);
}