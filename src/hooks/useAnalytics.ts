import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getAggregate,
  getTimeseries,
  getBreakdown,
  getRealtime,
  type AnalyticsSummary,
  type TimeseriesData,
  type BreakdownData,
  type RealtimeData,
} from "@/lib/analytics/client";

export const useAnalyticsSummary = (period: string = '7d'): UseQueryResult<AnalyticsSummary> => {
  return useQuery({
    queryKey: ['analytics', 'summary', period],
    queryFn: () => getAggregate(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
};

export const useAnalyticsTimeseries = (period: string = '7d'): UseQueryResult<TimeseriesData[]> => {
  return useQuery({
    queryKey: ['analytics', 'timeseries', period],
    queryFn: () => getTimeseries(period),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useAnalyticsBreakdown = (
  property: 'source' | 'page' | 'country' | 'device',
  period: string = '7d',
  limit: number = 10
): UseQueryResult<BreakdownData[]> => {
  return useQuery({
    queryKey: ['analytics', 'breakdown', property, period, limit],
    queryFn: () => getBreakdown(property, period, limit),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useAnalyticsRealtime = (): UseQueryResult<RealtimeData> => {
  return useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: getRealtime,
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    staleTime: 5 * 1000, // 5 seconds
    retry: 2,
  });
};