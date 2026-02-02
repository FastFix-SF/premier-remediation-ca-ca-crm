import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AerialImageRequest {
  leadId?: string;
  quoteRequestId?: string;
  projectId?: string;
  propertyAddress: string;
  latitude?: number;
  longitude?: number;
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
}

interface NearMapResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    angle: string;
    captureDate: string;
    resolution: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log(`Aerial imagery acquisition request: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API keys
    const nearMapApiKey = Deno.env.get('NEARMAP_API_KEY');
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!nearMapApiKey && !googleMapsApiKey) {
      throw new Error('No aerial imagery API keys configured');
    }

    const requestData: AerialImageRequest = await req.json();
    console.log('Processing aerial imagery request:', requestData);

    let lat: number, lng: number;

    // If coordinates not provided, geocode the address
    if (!requestData.latitude || !requestData.longitude) {
      console.log('Geocoding address:', requestData.propertyAddress);
      
      if (!googleMapsApiKey) {
        throw new Error('Google Maps API key required for geocoding');
      }

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(requestData.propertyAddress)}&key=${googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData: GeocodeResponse = await geocodeResponse.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error('Unable to geocode address');
      }

      lat = geocodeData.results[0].geometry.location.lat;
      lng = geocodeData.results[0].geometry.location.lng;
      console.log(`Geocoded coordinates: ${lat}, ${lng}`);
    } else {
      lat = requestData.latitude;
      lng = requestData.longitude;
    }

    const images: any[] = [];

    // Helper function to convert lat/lng to tile coordinates
    const latLngToTile = (lat: number, lng: number, zoom: number) => {
      const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
      const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
      return { x, y, z: zoom };
    };

    // Try NearMap API first (primary source)
    if (nearMapApiKey) {
      try {
        console.log('Attempting NearMap API acquisition...');
        
        // Use NearMap Tile API with proper coordinate conversion
        const zoomLevel = 19;
        const tileCoords = latLngToTile(lat, lng, zoomLevel);
        
        // NearMap Tile API endpoint format
        const nearMapTileUrl = `https://api.nearmap.com/tiles/v3/Vert/${tileCoords.z}/${tileCoords.x}/${tileCoords.y}.jpg?apikey=${nearMapApiKey}`;
        console.log("NearMap tile URL:", nearMapTileUrl);
        
        const nearMapResponse = await fetch(nearMapTileUrl);
        console.log("NearMap response status:", nearMapResponse.status);
        
        if (nearMapResponse.ok) {
          const imageBlob = await nearMapResponse.arrayBuffer();
          
          // Store image in Supabase Storage
          const fileName = `aerial_${Date.now()}_nearmap_z${zoomLevel}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('project-photos')
            .upload(fileName, imageBlob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) {
            console.error('Error uploading NearMap image:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('project-photos')
              .getPublicUrl(fileName);

            images.push({
              url: publicUrl,
              api_source: 'nearmap',
              image_type: 'aerial',
              angle: 'overhead',
              resolution: 'high',
              zoom_level: zoomLevel,
              file_size: imageBlob.byteLength,
              capture_date: new Date().toISOString(),
              image_quality_score: 85
            });
            
            console.log('Successfully acquired NearMap image');
          }
        } else {
          console.error("NearMap API error - status:", nearMapResponse.status, "text:", await nearMapResponse.text());
        }
      } catch (error) {
        console.error('NearMap API error:', error);
      }
    }

    // Fallback to Google Maps Static API
    if (images.length === 0 && googleMapsApiKey) {
      try {
        console.log('Attempting Google Maps API acquisition...');
        
        // Multiple views from Google Maps
        const googleMapUrls = [
          {
            url: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=1024x1024&maptype=satellite&key=${googleMapsApiKey}`,
            angle: 'overhead',
            zoom_level: 20
          },
          {
            url: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=1024x1024&maptype=satellite&key=${googleMapsApiKey}`,
            angle: 'overhead',
            zoom_level: 19
          }
        ];

        for (const mapConfig of googleMapUrls) {
          const mapResponse = await fetch(mapConfig.url);
          
          if (mapResponse.ok) {
            const imageBlob = await mapResponse.arrayBuffer();
            
            // Store image in Supabase Storage
            const fileName = `aerial_${Date.now()}_google_zoom${mapConfig.zoom_level}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('project-photos')
              .upload(fileName, imageBlob, {
                contentType: 'image/jpeg',
              });

            if (uploadError) {
              console.error('Error uploading Google Maps image:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('project-photos')
                .getPublicUrl(fileName);

              images.push({
                url: publicUrl,
                api_source: 'google_maps',
                image_type: 'satellite',
                angle: mapConfig.angle,
                resolution: 'medium',
                zoom_level: mapConfig.zoom_level,
                file_size: imageBlob.byteLength,
                capture_date: new Date().toISOString(),
                image_quality_score: 70
              });
            }
          }
        }
        
        console.log(`Successfully acquired ${images.length} Google Maps images`);
      } catch (error) {
        console.error('Google Maps API error:', error);
      }
    }

    if (images.length === 0) {
      throw new Error('No aerial images could be acquired from any source');
    }

// Store metadata in aerial_images table
const imageRecords = [];
for (const image of images) {
  const { data: insertData, error: insertError } = await supabase
    .from('aerial_images')
    .insert({
      lead_id: requestData.leadId || null,
      project_id: requestData.projectId || null,
      quote_request_id: requestData.quoteRequestId || null,
      property_address: requestData.propertyAddress,
      latitude: lat,
      longitude: lng,
      image_url: image.url,
      image_type: image.image_type,
      api_source: image.api_source,
      angle: image.angle,
      resolution: image.resolution,
      zoom_level: image.zoom_level,
      file_size: image.file_size,
      capture_date: image.capture_date,
      image_quality_score: image.image_quality_score,
      processing_status: 'completed',
      image_metadata: {
        originalSource: image.api_source,
        acquisitionTimestamp: new Date().toISOString(),
        coordinates: { lat, lng }
      }
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting aerial image record:', insertError);
  } else {
    imageRecords.push(insertData);
  }
}

    console.log(`Successfully processed ${imageRecords.length} aerial images`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully acquired ${imageRecords.length} aerial images`,
      images: imageRecords,
      coordinates: { lat, lng }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in acquire-aerial-imagery function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);