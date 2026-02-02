import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    
    console.log("Analyzing project:", projectId);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch comprehensive project data
    const [
      { data: project },
      { data: materials },
      { data: labor },
      { data: revenue }
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('project_materials').select('*').eq('project_id', projectId),
      supabase.from('time_clock').select('*').eq('job_id', projectId).not('clock_out', 'is', null),
      supabase.from('project_revenue').select('*').eq('project_id', projectId)
    ]);

    // Get proposal data if project has an address
    let proposals = null;
    if (project?.address) {
      const { data } = await supabase.from('project_proposals')
        .select('contract_price, status, payment_schedule')
        .eq('property_address', project.address)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1);
      proposals = data;
    }

    // Calculate totals
    const totalMaterials = materials?.reduce((sum, m) => sum + (m.total_amount || 0), 0) || 0;
    const totalLaborHours = labor?.reduce((sum, l) => sum + (l.total_hours || 0), 0) || 0;
    const totalRevenue = revenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const contractPrice = proposals?.[0]?.contract_price || 0;

    // Prepare context for AI
    const projectContext = {
      name: project?.name,
      status: project?.status,
      projectType: project?.project_type,
      budgetLabor: project?.budget_labor || 0,
      budgetMaterials: project?.budget_materials || 0,
      targetGpPercentage: project?.target_gp_percentage || 20,
      actualMaterialsCost: totalMaterials,
      actualLaborHours: totalLaborHours,
      totalRevenue: totalRevenue,
      contractPrice: contractPrice,
      materialsCount: materials?.length || 0,
      laborEntriesCount: labor?.length || 0,
      revenueEntriesCount: revenue?.length || 0
    };

    const systemPrompt = `You are a construction project analyst specializing in profitability and performance evaluation. Analyze project data and provide:

1. Overall Rating (excellent/good/acceptable/mediocre/poor)
2. Score (0-100)
3. Key Strengths (3-5 specific points)
4. Areas for Improvement (3-5 actionable items)
5. Financial Health Assessment
6. Recommendations (3-5 specific actions)

Focus on:
- Budget adherence
- Profitability metrics
- Resource utilization
- Project completion status
- Cost control`;

    const userPrompt = `Analyze this construction project:

Project: ${projectContext.name}
Status: ${projectContext.status}
Type: ${projectContext.projectType}

FINANCIAL DATA:
- Contract Price: $${contractPrice.toFixed(2)}
- Total Revenue Received: $${totalRevenue.toFixed(2)}
- Budget - Labor: $${projectContext.budgetLabor.toFixed(2)}
- Budget - Materials: $${projectContext.budgetMaterials.toFixed(2)}
- Actual Materials Cost: $${totalMaterials.toFixed(2)}
- Target GP: ${projectContext.targetGpPercentage}%

OPERATIONAL DATA:
- Total Labor Hours: ${totalLaborHours.toFixed(1)}
- Material Line Items: ${projectContext.materialsCount}
- Labor Entries: ${projectContext.laborEntriesCount}
- Revenue Entries: ${projectContext.revenueEntriesCount}

CALCULATED METRICS:
- Materials Budget Usage: ${projectContext.budgetMaterials > 0 ? ((totalMaterials / projectContext.budgetMaterials) * 100).toFixed(1) : 'N/A'}%
- Revenue Collection: ${contractPrice > 0 ? ((totalRevenue / contractPrice) * 100).toFixed(1) : 'N/A'}%

Provide a comprehensive analysis with actionable insights.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    console.log("Calling AI for project analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide structured project analysis",
              parameters: {
                type: "object",
                properties: {
                  rating: {
                    type: "string",
                    enum: ["excellent", "good", "acceptable", "mediocre", "poor"],
                    description: "Overall project rating"
                  },
                  score: {
                    type: "number",
                    description: "Numeric score from 0-100"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of key strengths"
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "Areas needing improvement"
                  },
                  financial_health: {
                    type: "string",
                    description: "Assessment of financial health"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific actionable recommendations"
                  },
                  summary: {
                    type: "string",
                    description: "Brief overall summary"
                  }
                },
                required: ["rating", "score", "strengths", "improvements", "financial_health", "recommendations", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI analysis complete");
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        context: projectContext
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in analyze-project:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
