import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Star, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RatingTabProps {
  projectId: string;
  project: any;
  profitData: any;
}

export const RatingTab: React.FC<RatingTabProps> = ({
  projectId,
  project,
  profitData
}) => {
  const [rating, setRating] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRating();
    generateAiSuggestion();
  }, [projectId, profitData]);

  const fetchRating = async () => {
    try {
      const { data, error } = await supabase
        .from('project_rating')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setRating(data);
        setSelectedRating(data.rating);
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const generateAiSuggestion = async () => {
    try {
      setLoading(true);
      
      console.log('Requesting AI analysis for project:', projectId);
      
      const { data, error } = await supabase.functions.invoke('analyze-project', {
        body: { projectId }
      });

      if (error) {
        console.error('Error calling analyze-project:', error);
        // Fall back to simple suggestion
        generateSimpleSuggestion();
        return;
      }

      if (data?.success && data.analysis) {
        setAiSuggestion({
          rating: data.analysis.rating,
          score: data.analysis.score,
          reason: data.analysis.summary,
          strengths: data.analysis.strengths,
          improvements: data.analysis.improvements,
          financial_health: data.analysis.financial_health,
          recommendations: data.analysis.recommendations,
          confidence: 90
        });
      }
    } catch (err) {
      console.error('Failed to get AI analysis:', err);
      generateSimpleSuggestion();
    } finally {
      setLoading(false);
    }
  };

  const generateSimpleSuggestion = () => {
    // Fallback: simple AI logic for suggesting project rating
    const gp = profitData?.gp_percentage || 0;
    const targetGp = project?.target_gp_percentage || 20;
    
    let suggestedRating = 'acceptable';
    let reason = '';

    if (gp >= targetGp + 10) {
      suggestedRating = 'excellent';
      reason = `Gross profit (${gp.toFixed(1)}%) significantly exceeds target (${targetGp}%)`;
    } else if (gp >= targetGp) {
      suggestedRating = 'acceptable';
      reason = `Gross profit (${gp.toFixed(1)}%) meets target (${targetGp}%)`;
    } else if (gp >= targetGp - 10) {
      suggestedRating = 'mediocre';
      reason = `Gross profit (${gp.toFixed(1)}%) slightly below target (${targetGp}%)`;
    } else {
      suggestedRating = 'poor';
      reason = `Gross profit (${gp.toFixed(1)}%) significantly below target (${targetGp}%)`;
    }

    // Additional factors
    const factors = [];
    if (gp < 0) factors.push('Project showing losses');
    if (profitData?.total_labor_cost > (project?.budget_labor || 0) * 1.1) {
      factors.push('Labor costs over budget');
    }
    if (profitData?.total_materials_cost > (project?.budget_materials || 0) * 1.1) {
      factors.push('Material costs over budget');
    }

    if (factors.length > 0) {
      reason += '. ' + factors.join(', ');
      if (suggestedRating === 'excellent') suggestedRating = 'acceptable';
      if (suggestedRating === 'acceptable') suggestedRating = 'mediocre';
    }

    setAiSuggestion({
      rating: suggestedRating,
      reason: reason,
      confidence: 75
    });
  };

  const saveRating = async () => {
    if (!selectedRating) {
      toast({
        title: "Validation Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('project_rating')
        .upsert({
          project_id: projectId,
          rating: selectedRating,
          notes: notes,
          ai_suggested_rating: aiSuggestion?.rating,
          ai_suggestion_reason: aiSuggestion?.reason,
          updated_by: null // Would be the current user ID
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project rating saved successfully",
      });

      fetchRating();
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Error",
        description: "Failed to save project rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (ratingValue: string) => {
    switch (ratingValue) {
      case 'excellent':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'acceptable':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'mediocre':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'poor':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getRatingIcon = (ratingValue: string) => {
    switch (ratingValue) {
      case 'excellent':
        return <Star className="h-5 w-5 text-green-600 fill-current" />;
      case 'acceptable':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'mediocre':
        return <TrendingDown className="h-5 w-5 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  const ratingOptions = [
    { value: 'excellent', label: 'Excellent', description: 'Outstanding performance, exceeded expectations' },
    { value: 'acceptable', label: 'Acceptable', description: 'Met expectations, solid performance' },
    { value: 'mediocre', label: 'Mediocre', description: 'Below expectations, room for improvement' },
    { value: 'poor', label: 'Poor', description: 'Significant issues, major improvements needed' }
  ];

  return (
    <div className="space-y-6">
      {/* Current Rating Display */}
      {rating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Project Rating</span>
              <Badge className={getRatingColor(rating.rating)}>
                {rating.rating.charAt(0).toUpperCase() + rating.rating.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {getRatingIcon(rating.rating)}
              <div>
                <h3 className="font-medium">
                  {rating.rating.charAt(0).toUpperCase() + rating.rating.slice(1)} Performance
                </h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(rating.updated_at).toLocaleDateString()}
                </p>
                {rating.notes && (
                  <p className="text-sm mt-2">{rating.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {loading && !aiSuggestion && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <Sparkles className="h-12 w-12 text-purple-600 animate-pulse" />
              <p className="text-muted-foreground">Analyzing project data with AI...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {aiSuggestion && (
        <>
          {/* AI Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>AI Analysis</span>
                <Badge variant="outline">{aiSuggestion.confidence}% confidence</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rating and Score */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center space-x-4">
                    {getRatingIcon(aiSuggestion.rating)}
                    <div>
                      <h4 className="font-semibold text-lg">
                        {aiSuggestion.rating.charAt(0).toUpperCase() + aiSuggestion.rating.slice(1)}
                      </h4>
                      <p className="text-sm text-muted-foreground">Overall Rating</p>
                    </div>
                  </div>
                  {aiSuggestion.score && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{aiSuggestion.score}</div>
                      <p className="text-sm text-muted-foreground">Score</p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm leading-relaxed">{aiSuggestion.reason}</p>
                </div>

                {/* Use AI Suggestion Button */}
                {selectedRating !== aiSuggestion.rating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRating(aiSuggestion.rating)}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use AI Suggested Rating
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {aiSuggestion.strengths && aiSuggestion.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Key Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiSuggestion.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {aiSuggestion.improvements && aiSuggestion.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiSuggestion.improvements.map((improvement: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {aiSuggestion.recommendations && aiSuggestion.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                  <TrendingUp className="h-5 w-5" />
                  <span>Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiSuggestion.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Financial Health */}
          {aiSuggestion.financial_health && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{aiSuggestion.financial_health}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rating Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Rate This Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Options */}
          <div className="space-y-3">
            <Label>How did we do on this project?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ratingOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRating === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedRating(option.value)}
                >
                  <div className="flex items-center space-x-3">
                    {getRatingIcon(option.value)}
                    <div>
                      <h4 className="font-medium">{option.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="rating-notes">Why? (Optional)</Label>
            <Textarea
              id="rating-notes"
              placeholder="Share your thoughts on what went well or could be improved..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveRating}
              disabled={!selectedRating || loading}
            >
              {loading ? 'Saving...' : 'Save Rating'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {profitData?.gp_percentage >= (project?.target_gp_percentage || 20) ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="text-2xl font-bold">
                45%
              </div>
              <p className="text-sm text-muted-foreground">
                Gross Profit (Target: {project?.target_gp_percentage || 20}%)
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {profitData?.total_labor_cost <= (project?.budget_labor || Infinity) ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {project?.budget_labor > 0 
                  ? ((profitData?.total_labor_cost / project.budget_labor) * 100).toFixed(0)
                  : 'N/A'
                }%
              </div>
              <p className="text-sm text-muted-foreground">
                Labor Budget Usage
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {profitData?.total_materials_cost <= (project?.budget_materials || Infinity) ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {project?.budget_materials > 0 
                  ? ((profitData?.total_materials_cost / project.budget_materials) * 100).toFixed(0)
                  : 'N/A'
                }%
              </div>
              <p className="text-sm text-muted-foreground">
                Materials Budget Usage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};