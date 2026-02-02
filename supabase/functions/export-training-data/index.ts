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
    const { format = 'coco' } = await req.json();
    
    console.log('🚀 Export training data - format:', format);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all edge training data with quote information
    const { data: edgeData, error: edgeError } = await supabaseClient
      .from('edge_training_data')
      .select('*')
      .not('quote_id', 'is', null)
      .order('created_at', { ascending: false });

    if (edgeError) {
      console.error('Error fetching edge data:', edgeError);
      throw edgeError;
    }

    console.log(`Found ${edgeData?.length || 0} edge training samples`);

    // Get aerial images for those quotes
    const quoteIds = [...new Set(edgeData?.map(e => e.quote_id).filter(Boolean) || [])];
    
    const { data: aerialData, error: aerialError } = await supabaseClient
      .from('aerial_images')
      .select('*')
      .in('quote_request_id', quoteIds)
      .not('image_url', 'is', null);

    if (aerialError) {
      console.warn('Error fetching aerial images:', aerialError);
    }

    // Create a map of quote_id to aerial image
    const aerialMap = new Map();
    aerialData?.forEach(img => {
      if (!aerialMap.has(img.quote_request_id)) {
        aerialMap.set(img.quote_request_id, img);
      }
    });

    // Group edge data by quote_id
    const groupedByQuote = edgeData?.reduce((acc: any, edge: any) => {
      const quoteId = edge.quote_id;
      if (!acc[quoteId]) {
        acc[quoteId] = {
          quote_id: quoteId,
          aerial_image: aerialMap.get(quoteId),
          edges: []
        };
      }
      acc[quoteId].edges.push(edge);
      return acc;
    }, {}) || {};

    const trainingSamples = Object.values(groupedByQuote).filter((sample: any) => 
      sample.edges.length > 0 && sample.aerial_image
    );

    console.log(`${trainingSamples.length} quotes with both imagery and edge data`);

    if (format === 'coco') {
      // Export in COCO format (standard for object detection/segmentation)
      const cocoData = {
        info: {
          description: "Roof Edge Detection Training Dataset",
          version: "1.0",
          year: 2025,
          contributor: "RoofHub AI",
          date_created: new Date().toISOString()
        },
        licenses: [],
        images: [],
        annotations: [],
        categories: [
          { id: 1, name: "RIDGE", supercategory: "roof_edge" },
          { id: 2, name: "VALLEY", supercategory: "roof_edge" },
          { id: 3, name: "EAVE", supercategory: "roof_edge" },
          { id: 4, name: "HIP", supercategory: "roof_edge" },
          { id: 5, name: "RAKE", supercategory: "roof_edge" },
          { id: 6, name: "GUTTER", supercategory: "roof_edge" },
          { id: 7, name: "UNLABELED", supercategory: "roof_edge" }
        ]
      };

      let annotationId = 1;

      trainingSamples.forEach((sample: any, imageIndex: number) => {
        const aerial = sample.aerial_image;
        
        // Add image
        cocoData.images.push({
          id: imageIndex + 1,
          file_name: `roof_${sample.quote_id}.jpg`,
          url: aerial.image_url,
          width: 1024, // Default dimensions
          height: 1024,
          quote_id: sample.quote_id,
          property_address: aerial.property_address,
          api_source: aerial.api_source
        });

        // Add annotations (edge drawings)
        sample.edges.forEach((edge: any) => {
          const categoryMap: Record<string, number> = {
            RIDGE: 1,
            VALLEY: 2,
            EAVE: 3,
            HIP: 4,
            RAKE: 5,
            GUTTER: 6,
            UNLABELED: 7
          };

          const edgeType = (edge.edge_type || 'UNLABELED').toUpperCase();
          const categoryId = categoryMap[edgeType] || 7;

          cocoData.annotations.push({
            id: annotationId++,
            image_id: imageIndex + 1,
            category_id: categoryId,
            category_name: edgeType,
            segmentation: edge.line_geometry,
            length_ft: edge.length_ft,
            angle_degrees: edge.angle_degrees,
            bbox: [],
            area: edge.length_ft,
            iscrowd: 0,
            was_ai_suggestion: edge.was_ai_suggestion,
            user_accepted: edge.user_accepted,
            created_at: edge.created_at
          });
        });
      });

      return new Response(
        JSON.stringify(cocoData, null, 2),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="roof_training_data.json"'
          }
        }
      );
    }

    if (format === 'simple') {
      // Simple format for quick review
      const simpleData = trainingSamples.map((sample: any) => ({
        quote_id: sample.quote_id,
        image_url: sample.aerial_image?.image_url,
        property_address: sample.aerial_image?.property_address,
        total_edges: sample.edges.length,
        edges_by_type: sample.edges.reduce((acc: any, edge: any) => {
          const type = (edge.edge_type || 'UNLABELED').toUpperCase();
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        edges: sample.edges.map((edge: any) => ({
          type: edge.edge_type,
          length_ft: edge.length_ft,
          angle: edge.angle_degrees,
          geometry: edge.line_geometry,
          was_ai_suggestion: edge.was_ai_suggestion,
          user_accepted: edge.user_accepted
        }))
      }));

      return new Response(
        JSON.stringify(simpleData, null, 2),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="roof_training_simple.json"'
          }
        }
      );
    }

    // Statistics format (default)
    const allEdges = trainingSamples.flatMap((s: any) => s.edges);
    const stats = {
      total_roof_images: trainingSamples.length,
      total_edge_annotations: allEdges.length,
      edges_by_type: allEdges.reduce((acc: any, edge: any) => {
        const type = (edge.edge_type || 'UNLABELED').toUpperCase();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      ai_suggestions: {
        total: allEdges.filter((e: any) => e.was_ai_suggestion).length,
        accepted: allEdges.filter((e: any) => e.was_ai_suggestion && e.user_accepted).length,
        rejected: allEdges.filter((e: any) => e.was_ai_suggestion && !e.user_accepted).length
      },
      average_edges_per_roof: trainingSamples.length > 0 
        ? (allEdges.length / trainingSamples.length).toFixed(1)
        : 0,
      samples: trainingSamples.map((sample: any) => ({
        quote_id: sample.quote_id,
        edge_count: sample.edges.length,
        image_url: sample.aerial_image?.image_url,
        property_address: sample.aerial_image?.property_address
      }))
    };

    return new Response(
      JSON.stringify(stats, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
