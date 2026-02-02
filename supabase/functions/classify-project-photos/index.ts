
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ClassificationResult {
  photoId: string;
  suggestedTag: 'before' | 'after' | 'unknown';
  confidence: number;
  reasoning: string;
}

async function classifyPhotoWithOpenAI(photoUrl: string, fileName: string, uploadDate: string): Promise<{ tag: 'before' | 'after' | 'unknown', confidence: number, reasoning: string }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze this construction/roofing project photo and classify it as 'before', 'after', or 'unknown'.

Consider these factors:
1. File name: "${fileName}"
2. Upload date: ${uploadDate}
3. Visual cues: Is this showing work in progress, completed work, or initial conditions?
4. Image quality and composition: Professional completion photos vs. documentation photos
5. Visible materials, tools, or staging areas

For roofing projects specifically:
- 'before': Shows existing roof needing work, damage, old materials, pre-construction state
- 'after': Shows completed work, new materials, clean finished appearance, professional presentation
- 'unknown': Unclear progress state, during construction, or insufficient visual information

Respond in JSON format:
{
  "classification": "before|after|unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you chose this classification"
}

Be conservative - if you're not confident, choose 'unknown'.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: photoUrl } }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        tag: parsed.classification as 'before' | 'after' | 'unknown',
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return {
        tag: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response'
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    const errorMessage = error instanceof Error ? error.message : 'API error occurred';
    return {
      tag: 'unknown',
      confidence: 0,
      reasoning: `API error: ${errorMessage}`
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, autoApply = false } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log(`Starting photo classification for project: ${projectId}`);

    // Fetch untagged photos for the project
    const { data: photos, error: photosError } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .is('photo_tag', null);

    if (photosError) {
      throw new Error(`Failed to fetch photos: ${photosError.message}`);
    }

    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No untagged photos found', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${photos.length} untagged photos to classify`);

    const results: ClassificationResult[] = [];

    // Process each photo
    for (const photo of photos) {
      try {
        console.log(`Classifying photo: ${photo.id}`);
        
        const fileName = photo.photo_url.split('/').pop() || '';
        const uploadDate = new Date(photo.uploaded_at).toLocaleDateString();
        
        const classification = await classifyPhotoWithOpenAI(
          photo.photo_url,
          fileName,
          uploadDate
        );

        const result: ClassificationResult = {
          photoId: photo.id,
          suggestedTag: classification.tag,
          confidence: classification.confidence,
          reasoning: classification.reasoning
        };

        results.push(result);

        // If autoApply is true and confidence is high, update the database
        if (autoApply && classification.confidence > 0.7 && classification.tag !== 'unknown') {
          const { error: updateError } = await supabase
            .from('project_photos')
            .update({ photo_tag: classification.tag })
            .eq('id', photo.id);

          if (updateError) {
            console.error(`Failed to update photo ${photo.id}:`, updateError);
          } else {
            console.log(`Auto-applied tag '${classification.tag}' to photo ${photo.id}`);
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to classify photo ${photo.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Classification failed';
        results.push({
          photoId: photo.id,
          suggestedTag: 'unknown',
          confidence: 0,
          reasoning: `Classification failed: ${errorMessage}`
        });
      }
    }

    console.log(`Classification complete. Processed ${results.length} photos`);

    return new Response(
      JSON.stringify({ 
        message: `Classified ${results.length} photos`,
        results,
        autoApplied: autoApply
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-project-photos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
