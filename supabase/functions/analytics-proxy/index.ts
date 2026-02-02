import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to get date range based on period
function getDateRange(period: string) {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '6mo':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '12mo':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  
  return { startDate, endDate };
}

// Calculate analytics summary from events
async function calculateSummary(period: string = '7d') {
  const { startDate, endDate } = getDateRange(period);
  
  // Check if analytics setup is required
  const { data: setupCheck, error: setupError } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'analytics_setup_required')
    .single();

  // If no real tracking is set up, return zeros with setup message
  if (setupCheck && !setupError) {
    const setupData = setupCheck.value as any;
    if (setupData?.status === 'pending') {
      return {
        visitors: 0,
        pageviews: 0,
        views_per_visit: 0,
        visit_duration: 0,
        bounce_rate: 0,
        setup_required: true,
        setup_message: setupData.message || 'Real visitor tracking not yet configured'
      };
    }
  }
  
  // Get total events in period
  const { data: events, error: eventsError } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    throw eventsError;
  }

  // If no events found, return zeros
  if (!events || events.length === 0) {
    return {
      visitors: 0,
      pageviews: 0,
      views_per_visit: 0,
      visit_duration: 0,
      bounce_rate: 0,
      no_data: true
    };
  }
  
  // Calculate metrics
  const pageViews = events?.filter(e => e.event_type === 'page_view').length || 0;
  const uniqueVisitors = new Set(events?.map(e => e.visitor_id).filter(Boolean)).size || 0;
  const sessions = new Set(events?.map(e => e.session_id).filter(Boolean)).size || 0;
  
  return {
    visitors: uniqueVisitors,
    pageviews: pageViews,
    views_per_visit: uniqueVisitors > 0 ? Number((pageViews / uniqueVisitors).toFixed(2)) : 0,
    visit_duration: 180, // Default duration in seconds
    bounce_rate: 0.3, // Default bounce rate
  };
}

// Get timeseries data
async function getTimeseries(period: string = '7d') {
  const { startDate, endDate } = getDateRange(period);
  
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('created_at, event_type, visitor_id, session_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('event_type', 'page_view')
    .order('created_at');
  
  if (error) {
    console.error('Error fetching timeseries:', error);
    return [];
  }

  // If no events, return empty array
  if (!events || events.length === 0) {
    return [];
  }
  
  // Group by day
  const dailyStats: Record<string, { visitors: Set<string>, pageviews: number }> = {};
  
  events?.forEach(event => {
    const date = event.created_at.split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { visitors: new Set(), pageviews: 0 };
    }
    if (event.visitor_id) {
      dailyStats[date].visitors.add(event.visitor_id);
    }
    dailyStats[date].pageviews++;
  });
  
  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    visitors: stats.visitors.size,
    pageviews: stats.pageviews,
  }));
}

// Get breakdown data by property
async function getBreakdown(property: string, period: string = '7d', limit: number = 25) {
  const { startDate, endDate } = getDateRange(period);
  
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('event_type', 'page_view');
  
  if (error) {
    console.error('Error fetching breakdown:', error);
    return [];
  }
  
  const breakdown: Record<string, { visitors: Set<string>, pageviews: number }> = {};
  
  events?.forEach(event => {
    let key = 'Unknown';
    
    switch (property) {
      case 'page':
        key = event.page_path || 'Unknown';
        break;
      case 'source':
        key = event.referrer || 'Direct';
        break;
      case 'country':
        key = 'United States'; // Default since we don't have geolocation
        break;
      case 'device':
        key = event.user_agent?.includes('Mobile') ? 'Mobile' : 'Desktop';
        break;
    }
    
    if (!breakdown[key]) {
      breakdown[key] = { visitors: new Set(), pageviews: 0 };
    }
    
    if (event.visitor_id) {
      breakdown[key].visitors.add(event.visitor_id);
    }
    breakdown[key].pageviews++;
  });
  
  return Object.entries(breakdown)
    .map(([name, stats]) => ({
      name,
      visitors: stats.visitors.size,
      pageviews: stats.pageviews,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params = {} } = await req.json();

    let data;
    const period = params.period || '7d';

    console.log(`Analytics request: ${endpoint}, period: ${period}`);

    switch (endpoint) {
      case '/summary': {
        data = await calculateSummary(period);
        break;
      }

      case '/timeseries': {
        data = await getTimeseries(period);
        break;
      }

      case '/realtime': {
        // Calculate active visitors in the last 5 minutes
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        const { data: recentEvents, error: realtimeError } = await supabase
          .from('analytics_events')
          .select('visitor_id')
          .gte('created_at', fiveMinutesAgo.toISOString());
        
        if (realtimeError) {
          console.error('Error fetching realtime data:', realtimeError);
          data = { visitors: 0 };
        } else {
          const activeVisitors = new Set(recentEvents?.map(e => e.visitor_id).filter(Boolean)).size || 0;
          data = { visitors: activeVisitors };
        }
        break;
      }

      default: {
        // Handle breakdown endpoints like /breakdown/source
        const match = endpoint.match(/^\/breakdown\/(.+)$/);
        if (!match) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Invalid endpoint' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const property = match[1];
        const validProperties = ['source', 'page', 'country', 'device'];
        
        if (!validProperties.includes(property)) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Invalid breakdown type' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const limit = parseInt(params.limit || '25');
        data = await getBreakdown(property, period, limit);
        break;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, data }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );

  } catch (error) {
    console.error('Analytics proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : String(error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMessage,
        details: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});