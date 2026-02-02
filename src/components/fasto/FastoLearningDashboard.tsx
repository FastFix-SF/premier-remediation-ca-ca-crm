import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, AlertCircle, CheckCircle2, Clock, RefreshCw, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay } from 'date-fns';

interface FailedRequest {
  id: string;
  user_id: string | null;
  request_text: string;
  agent_response: string | null;
  failure_reason: string | null;
  tool_attempted: string | null;
  category: string | null;
  created_at: string;
}

interface CategorySummary {
  category: string;
  count: number;
  examples: string[];
  latest: string;
}

export const FastoLearningDashboard: React.FC = () => {
  const { toast } = useToast();
  const [failedRequests, setFailedRequests] = useState<FailedRequest[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    fetchFailedRequests();
  }, [timeRange]);

  const fetchFailedRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('fasto_failed_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : 30;
        const fromDate = startOfDay(subDays(new Date(), days)).toISOString();
        query = query.gte('created_at', fromDate);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      setFailedRequests(data || []);
      processCategorySummaries(data || []);
    } catch (error) {
      console.error('Error fetching failed requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Fasto learning data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processCategorySummaries = (requests: FailedRequest[]) => {
    const categoryMap = new Map<string, { count: number; examples: string[]; latest: string }>();

    requests.forEach(req => {
      const category = req.category || 'uncategorized';
      const existing = categoryMap.get(category);
      
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3 && !existing.examples.includes(req.request_text)) {
          existing.examples.push(req.request_text);
        }
        if (new Date(req.created_at) > new Date(existing.latest)) {
          existing.latest = req.created_at;
        }
      } else {
        categoryMap.set(category, {
          count: 1,
          examples: [req.request_text],
          latest: req.created_at
        });
      }
    });

    const summaries = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.count - a.count);

    setCategorySummaries(summaries);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      navigation: <TrendingUp className="h-4 w-4" />,
      purchasing: <AlertCircle className="h-4 w-4" />,
      scheduling: <Clock className="h-4 w-4" />,
      communications: <CheckCircle2 className="h-4 w-4" />,
      documents: <Brain className="h-4 w-4" />,
      uncategorized: <Lightbulb className="h-4 w-4" />
    };
    return icons[category] || <Lightbulb className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      navigation: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      purchasing: 'bg-green-500/10 text-green-500 border-green-500/20',
      scheduling: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      communications: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      documents: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      uncategorized: 'bg-muted text-muted-foreground border-border'
    };
    return colors[category] || colors.uncategorized;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Fasto Learning Center
          </h1>
          <p className="text-muted-foreground">
            Track and prioritize features Fasto needs to learn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={fetchFailedRequests}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{failedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">{categorySummaries.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Request</CardDescription>
            <CardTitle className="text-lg truncate">
              {categorySummaries[0]?.category || 'None'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest</CardDescription>
            <CardTitle className="text-lg">
              {failedRequests[0] 
                ? format(new Date(failedRequests[0].created_at), 'MMM d, h:mm a')
                : 'No data'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Requests by Category</CardTitle>
          <CardDescription>
            Prioritize development based on what users need most
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categorySummaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No failed requests yet - Fasto is handling everything!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categorySummaries.map((summary) => (
                <div 
                  key={summary.category}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(summary.category)}>
                        {getCategoryIcon(summary.category)}
                        <span className="ml-1 capitalize">{summary.category}</span>
                      </Badge>
                      <Badge variant="secondary">{summary.count} requests</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Latest: {format(new Date(summary.latest), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Example requests:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {summary.examples.map((example, idx) => (
                        <li key={idx} className="truncate">
                          "{example}"
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Requests</CardTitle>
          <CardDescription>
            Detailed log of requests Fasto couldn't handle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : failedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>All clear! No failed requests in this time period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Time</th>
                    <th className="text-left py-2 px-2">Request</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-left py-2 px-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {failedRequests.slice(0, 20).map((req) => (
                    <tr key={req.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 whitespace-nowrap">
                        {format(new Date(req.created_at), 'MMM d, h:mm a')}
                      </td>
                      <td className="py-2 px-2 max-w-xs truncate">
                        {req.request_text}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className={getCategoryColor(req.category || 'uncategorized')}>
                          {req.category || 'uncategorized'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 max-w-xs truncate text-muted-foreground">
                        {req.failure_reason || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
