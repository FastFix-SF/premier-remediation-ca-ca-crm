import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { 
  Users, 
  Eye, 
  Clock, 
  Activity, 
  Globe, 
  Monitor, 
  Smartphone, 
  ExternalLink,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Settings
} from 'lucide-react';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  useAnalyticsSummary, 
  useAnalyticsTimeseries, 
  useAnalyticsBreakdown, 
  useAnalyticsRealtime 
} from '@/hooks/useAnalytics';
import { formatNumber, formatPercent, formatDuration, formatViews } from '@/lib/analytics/format';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const COUNTRY_FLAGS: { [key: string]: string } = {
  'US': '🇺🇸',
  'GB': '🇬🇧', 
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'NL': '🇳🇱',
  'SE': '🇸🇪',
  'Unknown': '🌍'
};

const Analytics = () => {
  const [period, setPeriod] = useState('7d');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Data hooks
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useAnalyticsSummary(period);
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeseries(period);
  const { data: sources } = useAnalyticsBreakdown('source', period, 10);
  const { data: pages } = useAnalyticsBreakdown('page', period, 10);
  const { data: countries } = useAnalyticsBreakdown('country', period, 10);
  const { data: devices } = useAnalyticsBreakdown('device', period, 10);
  const { data: realtime } = useAnalyticsRealtime();

  // Handle configuration error
  useEffect(() => {
    if (summaryError && summaryError.message.includes('Analytics not configured')) {
      // Analytics not configured - don't show error toast for this
      return;
    }
    
    if (summaryError) {
      toast({
        title: "Analytics Error",
        description: summaryError.message,
        variant: "destructive",
      });
    }
  }, [summaryError, toast]);

  // Show empty state if analytics not configured or no real tracking data
  if (summaryError && summaryError.message.includes('Analytics not configured')) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Real-time website analytics powered by Lovable Analytics</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Not Configured</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              To view analytics data, you need to configure your Lovable Analytics shared link in the integration settings.
            </p>
            <Button asChild>
              <a href="/admin?tab=settings">
                <Settings className="w-4 h-4 mr-2" />
                Configure Analytics
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no real tracking data is available
  if (summary && (summary as any)?.setup_required) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Real-time website analytics powered by Lovable Analytics</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Setup Required</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {(summary as any)?.setup_message || 'Real visitor tracking not yet configured. No analytics data is currently being collected.'}
            </p>
            <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
              <p className="text-sm font-medium">Status: Ready for Implementation</p>
              <p className="text-sm text-muted-foreground mt-1">
                The analytics system is configured but needs visitor tracking to collect real data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state for zero data (no events tracked)
  if (summary && (summary as any)?.no_data && summary.visitors === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Real-time website analytics powered by Lovable Analytics</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              No visitor data has been collected yet. Once visitors interact with your site, their data will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodLabels: { [key: string]: string } = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days', 
    '90d': 'Last 90 days',
    '6mo': 'Last 6 months',
    '12mo': 'Last 12 months'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time website analytics powered by Lovable Analytics</p>
        </div>
        
        <div className="flex items-center gap-4">
          {realtime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {formatNumber(realtime.visitors)} current visitors
            </div>
          )}
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary ? formatNumber(summary.visitors) : '0'}</div>
            )}
          </CardContent>
        </Card>

        {/* Pageviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary ? formatNumber(summary.pageviews) : '0'}</div>
            )}
          </CardContent>
        </Card>

        {/* Views per Visit */}
        {!isMobile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Views/Visit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary ? formatViews(summary.views_per_visit) : '0.00'}</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visit Duration */}
        {!isMobile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visit Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{summary ? formatDuration(summary.visit_duration) : '0s'}</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bounce Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary ? formatPercent(summary.bounce_rate) : '0%'}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeseries Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>Visitors and pageviews over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {timeseriesLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [formatNumber(value), name === 'visitors' ? 'Visitors' : 'Pageviews']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pageviews" 
                    stackId="2"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources & Pages */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sources?.slice(0, 5).map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{source.name || 'Direct'}</span>
                    <Badge variant="secondary">{formatNumber(source.visitors)}</Badge>
                  </div>
                )) || (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pages?.slice(0, 5).map((page, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate flex-1">{page.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{formatNumber(page.visitors)}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-6 w-6 p-0"
                      >
                        <a 
                          href={page.name.startsWith('/') ? `${window.location.origin}${page.name}` : page.name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Countries & Devices */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Countries</CardTitle>
              <CardDescription>Visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countries?.slice(0, 5).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{COUNTRY_FLAGS[country.name] || '🌍'}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(country.visitors)}</Badge>
                  </div>
                )) || (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Visitor device breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices?.slice(0, 4).map((device, index) => {
                  const getDeviceIcon = (deviceName: string) => {
                    if (deviceName.toLowerCase().includes('desktop')) return <Monitor className="h-4 w-4" />;
                    if (deviceName.toLowerCase().includes('mobile')) return <Smartphone className="h-4 w-4" />;
                    return <Globe className="h-4 w-4" />;
                  };

                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.name)}
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                      <Badge variant="secondary">{formatNumber(device.visitors)}</Badge>
                    </div>
                  );
                }) || (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;