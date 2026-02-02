import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      quoteId, 
      categories = ['sketch_report', 'estimate', 'material_order'],
      limit = 5 
    } = await req.json();

    console.log('Searching training context for quote:', quoteId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Search for relevant training documents
    // Priority: Same quote > Same category > Recent
    const { data: trainingDocs, error } = await supabaseClient
      .from('project_training_documents')
      .select('*')
      .eq('quote_request_id', quoteId)
      .in('document_category', categories)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching training docs:', error);
      throw error;
    }

    console.log(`Found ${trainingDocs?.length || 0} training documents`);

    // Build context string from training documents
    const contextSummary = trainingDocs?.map(doc => {
      const data = doc.extracted_data || {};
      return {
        id: doc.id,
        category: doc.document_category,
        fileName: doc.file_name,
        summary: buildSummary(doc.document_category, data),
        extractedData: data
      };
    }) || [];

    // Build AI-ready context
    const aiContext = contextSummary.map(doc => 
      `[${doc.category.toUpperCase()}] ${doc.fileName}\n${doc.summary}`
    ).join('\n\n---\n\n');

    return new Response(
      JSON.stringify({ 
        success: true,
        trainingDocuments: contextSummary,
        aiContext,
        count: contextSummary.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in search-training-context:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function buildSummary(category: string, data: any): string {
  switch (category) {
    case 'sketch_report':
      return `Measurements: ${JSON.stringify(data.measurements || {})}\nPitch: ${data.pitch || 'N/A'}\nGeometry: ${JSON.stringify(data.geometry || {})}\nMaterials: ${JSON.stringify(data.materials || {})}`;
    
    case 'estimate':
      return `Total Cost: ${data.total_cost || 'N/A'}\nMaterials: ${JSON.stringify(data.materials || [])}\nLabor Cost: ${data.labor_cost || 'N/A'}\nLine Items: ${data.line_items?.length || 0} items`;
    
    case 'material_order':
      return `Materials: ${JSON.stringify(data.materials || [])}\nSpecifications: ${JSON.stringify(data.specifications || {})}`;
    
    case 'labor_report':
      return `Tasks: ${JSON.stringify(data.tasks || [])}\nTotal Hours: ${data.hours || 'N/A'}`;
    
    case 'contract':
      return `Scope: ${data.scope || 'N/A'}\nPricing: ${data.pricing || 'N/A'}\nTimeline: ${data.timeline || 'N/A'}`;
    
    default:
      return JSON.stringify(data);
  }
}
