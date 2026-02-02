import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsSummary {
  visitors: number;
  pageviews: number;
  views_per_visit: number;
  visit_duration: number;
  bounce_rate: number;
}

export interface TimeseriesData {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface BreakdownData {
  name: string;
  visitors: number;
  pageviews?: number;
}

export interface RealtimeData {
  visitors: number;
}

export interface AnalyticsResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: string;
}

const callAnalyticsProxy = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('analytics-proxy', {
    body: { endpoint, params }
  });

  if (error) {
    throw new Error(`Analytics proxy error: ${error.message}`);
  }

  const response = data as AnalyticsResponse<T>;
  
  if (!response.ok) {
    throw new Error(response.error || 'Unknown analytics error');
  }

  return response.data!;
};

export const getAggregate = async (period: string = '7d'): Promise<AnalyticsSummary> => {
  return callAnalyticsProxy<AnalyticsSummary>('/summary', { period });
};

export const getTimeseries = async (period: string = '7d'): Promise<TimeseriesData[]> => {
  return callAnalyticsProxy<TimeseriesData[]>('/timeseries', { period });
};

export const getBreakdown = async (
  property: 'source' | 'page' | 'country' | 'device',
  period: string = '7d',
  limit: number = 25
): Promise<BreakdownData[]> => {
  return callAnalyticsProxy<BreakdownData[]>(`/breakdown/${property}`, {
    period,
    limit: limit.toString(),
  });
};

export const getRealtime = async (): Promise<RealtimeData> => {
  return callAnalyticsProxy<RealtimeData>('/realtime');
};