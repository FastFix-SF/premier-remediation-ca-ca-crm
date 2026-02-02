import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, limit = 20 } = await req.json();
    const tenorApiKey = Deno.env.get('TENOR_API_KEY');

    if (!tenorApiKey) {
      throw new Error('TENOR_API_KEY not configured');
    }

    // Use Tenor's search or trending endpoint
    const endpoint = searchTerm 
      ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${tenorApiKey}&limit=${limit}&media_filter=gif`
      : `https://tenor.googleapis.com/v2/featured?key=${tenorApiKey}&limit=${limit}&media_filter=gif`;

    console.log('Fetching GIFs from Tenor:', { searchTerm, endpoint });

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Tenor API error:', error);
      throw new Error(`Tenor API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Tenor response to simpler format
    // Use nanogif (smallest format) for mobile optimization
    const gifs = data.results.map((result: any) => ({
      id: result.id,
      title: result.content_description || 'GIF',
      url: result.media_formats.gif.url,
      preview: result.media_formats.nanogif?.url || result.media_formats.tinygif?.url || result.media_formats.gif.url,
      width: result.media_formats.gif.dims[0],
      height: result.media_formats.gif.dims[1],
    }));

    return new Response(JSON.stringify({ gifs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-gifs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
