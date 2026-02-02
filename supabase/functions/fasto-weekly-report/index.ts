import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategorySummary {
  category: string;
  count: number;
  examples: string[];
  latest: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { days = 7 } = await req.json().catch(() => ({ days: 7 }));

    // Calculate date range
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Fetch failed requests from the last N days
    const { data: failedRequests, error } = await supabase
      .from('fasto_failed_requests')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching failed requests:', error);
      throw error;
    }

    // Process category summaries
    const categoryMap = new Map<string, { count: number; examples: string[]; latest: string }>();

    (failedRequests || []).forEach((req: any) => {
      const category = req.category || 'uncategorized';
      const existing = categoryMap.get(category);
      
      if (existing) {
        existing.count++;
        if (existing.examples.length < 5 && !existing.examples.includes(req.request_text)) {
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

    const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.count - a.count);

    // Generate report
    const report = {
      period: {
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
        days
      },
      summary: {
        total_failed_requests: failedRequests?.length || 0,
        unique_categories: categorySummaries.length,
        top_category: categorySummaries[0]?.category || 'none',
        top_category_count: categorySummaries[0]?.count || 0
      },
      categories: categorySummaries,
      insights: generateInsights(categorySummaries, failedRequests?.length || 0),
      recommendations: generateRecommendations(categorySummaries)
    };

    console.log('[fasto-weekly-report] Generated report:', JSON.stringify(report.summary));

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[fasto-weekly-report] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateInsights(categories: CategorySummary[], totalRequests: number): string[] {
  const insights: string[] = [];

  if (totalRequests === 0) {
    insights.push("🎉 Excellent! No failed requests this period - Fasto is handling everything well.");
    return insights;
  }

  if (categories.length > 0) {
    const topCategory = categories[0];
    const percentage = Math.round((topCategory.count / totalRequests) * 100);
    insights.push(`📊 ${percentage}% of failed requests are in the "${topCategory.category}" category.`);
  }

  if (categories.length > 1) {
    const topTwo = categories.slice(0, 2).map(c => c.category).join(' and ');
    insights.push(`🎯 Focus areas: ${topTwo} account for the most user friction.`);
  }

  if (totalRequests > 50) {
    insights.push(`⚠️ High volume: ${totalRequests} failed requests - consider prioritizing improvements.`);
  } else if (totalRequests > 20) {
    insights.push(`📈 Moderate volume: ${totalRequests} failed requests - opportunities for enhancement.`);
  } else {
    insights.push(`✅ Low volume: Only ${totalRequests} failed requests - Fasto is performing well.`);
  }

  return insights;
}

function generateRecommendations(categories: CategorySummary[]): string[] {
  const recommendations: string[] = [];

  const categoryRecommendations: Record<string, string> = {
    navigation: "Implement deep navigation to specific items (projects, leads, invoices by name or ID).",
    purchasing: "Add purchase order creation and supplier management capabilities.",
    scheduling: "Enable calendar integration and shift management via voice.",
    communications: "Integrate email/SMS sending capabilities through Fasto.",
    documents: "Add document generation and file management features.",
    finance: "Expand invoice creation and payment processing capabilities.",
    hr: "Add employee onboarding and payroll query features.",
    safety: "Implement safety checklist and incident reporting via voice."
  };

  categories.slice(0, 3).forEach(cat => {
    const rec = categoryRecommendations[cat.category];
    if (rec) {
      recommendations.push(`🔧 ${cat.category}: ${rec}`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push("📋 Review the specific failed requests to identify patterns and improvement opportunities.");
  }

  return recommendations;
}
