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
    const integrationKey = Deno.env.get('ROOFHUB_INTEGRATION_KEY');
    
    if (!integrationKey) {
      console.error('ROOFHUB_INTEGRATION_KEY is not set');
      throw new Error('RoofHub integration key not configured');
    }

    const baseURL = 'https://services-qa.roofhub.pro';
    
    // First, get the access token using OAuth2
    console.log('Getting OAuth2 access token...');
    const tokenParams = new URLSearchParams({
      'client_id': integrationKey,
      'client_secret': integrationKey,
      'grant_type': 'client_credentials',
      'scope': 'ALL'
    });

    const tokenResponse = await fetch(`${baseURL}/Authentication/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token authentication error:', tokenResponse.status, errorText);
      throw new Error(`Authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('Successfully obtained access token');

    // Parse request body to get parameters
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    
    // Read action from body first, fallback to URL params, default to 'products'
    const action = body.action || url.searchParams.get('action') || 'products';
    const branchId = body.branchId || url.searchParams.get('branchId');
    const category = body.category || url.searchParams.get('category');
    const limit = body.limit || url.searchParams.get('limit') || '100';

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Handle different actions
    if (action === 'branches') {
      console.log('Fetching branches from RoofHub...');
      const response = await fetch(`${baseURL}/branches/v2/branchLocations`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RoofHub branches API error:', response.status, errorText);
        throw new Error(`RoofHub API error: ${response.status}`);
      }

      const branches = await response.json();
      console.log('Successfully fetched branches:', branches);

      return new Response(
        JSON.stringify({ branches }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Default action: fetch products (catalog)
    console.log('Fetching products from RoofHub catalog...');
    
    const response = await fetch(`${baseURL}/products/v2/catalog`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RoofHub catalog API error:', response.status, errorText);
      throw new Error(`RoofHub API error: ${response.status}`);
    }

    const products = await response.json();
    console.log('Successfully fetched products from RoofHub catalog');

    // Filter by branch and category if provided
    let filteredProducts = products;
    if (branchId) {
      filteredProducts = products.filter((p: any) => 
        p.branchCode === branchId || p.branchId === branchId
      );
    }
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter((p: any) => 
        p.category === category || p.productCategory === category
      );
    }

    // Map to expected format
    const mappedProducts = filteredProducts.map((p: any) => ({
      sku: p.productCode || p.sku || '',
      name: p.productName || p.name || '',
      uom: p.productUOM?.[0] || p.uom || 'Each',
      price: p.price || 0,
      category: p.productCategory || p.category || '',
    }));

    return new Response(
      JSON.stringify({ products: mappedProducts }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in roofhub-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
