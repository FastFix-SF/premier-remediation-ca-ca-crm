import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ultra-detailed photorealistic prompts for iOS 26 style 3D icons
const APP_PROMPTS: Record<string, string> = {
  projects: `Ultra-realistic 3D rendered iOS app icon: A photorealistic manila folder with authentic paper texture and crisp folded edges, containing rolled construction blueprints with visible technical grid lines. Soft studio lighting from top-left creates gentle shadows. Small brushed brass clasp detail. Background is a perfectly smooth gradient from deep sapphire blue (#1e40af) to electric cyan (#06b6d4). Hyperrealistic depth with subtle cast shadow on the gradient surface. Clean minimalist Apple design aesthetic. Perfect 512x512 square composition, absolutely no text or labels.`,
  
  messages: `Ultra-realistic 3D rendered iOS app icon: Two photorealistic speech bubbles made of frosted glass with a subtle green tint. The bubbles have realistic glass thickness, soft interior glow, and catch light naturally. One bubble slightly overlapping the other. Background is a smooth gradient from forest green (#16a34a) to mint (#10b981). Studio-quality lighting with ambient occlusion between bubbles. Apple-style clean aesthetic. 512x512, no text.`,
  
  clock: `Ultra-realistic 3D rendered iOS app icon: A photorealistic luxury watch face with brushed rose gold bezel, pristine white enamel dial, and elegant minimalist hour markers. Subtle reflections on the glass crystal surface. Background is a smooth gradient from warm amber (#f59e0b) to burnt orange (#ea580c). Jewelry-quality render with soft studio lighting. Premium timepiece aesthetic. 512x512, no text.`,
  
  schedule: `Ultra-realistic 3D rendered iOS app icon: A stack of 3D calendar pages with realistic paper texture, one page with a curled corner revealing depth beneath. Embossed date numbers visible on top page. Subtle paper shadows between layers. Background is a smooth gradient from violet (#8b5cf6) to deep purple (#7c3aed). Soft ambient lighting creating gentle shadows. 512x512, no text.`,
  
  tasks: `Ultra-realistic 3D rendered iOS app icon: A 3D checkbox with brushed titanium frame and premium green checkmark that has real depth and dimension. The checkmark appears slightly raised with metallic sheen. Background is a smooth gradient from emerald (#10b981) to teal (#14b8a6). Industrial design aesthetic with professional studio lighting. 512x512, no text.`,
  
  "time-off": `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D palm tree with detailed fronds and textured trunk, leaning slightly. Small sandy beach element at base. Tropical paradise lighting with warm sun glow. Background is a smooth gradient from teal (#14b8a6) to cyan (#06b6d4). Vacation paradise aesthetic. 512x512, no text.`,
  
  safety: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D hard hat with matte yellow finish and realistic industrial plastic texture. Chrome adjustment strap detail visible. Construction site lighting with soft shadows. Background is a smooth gradient from amber (#f59e0b) to gold (#eab308). Professional safety equipment render. 512x512, no text.`,
  
  inventory: `Ultra-realistic 3D rendered iOS app icon: Three photorealistic 3D cardboard boxes stacked with realistic corrugated texture and tape details. Boxes have slight wear and authentic warehouse appearance. Background is a smooth gradient from cyan (#06b6d4) to teal (#14b8a6). Warehouse lighting with soft ambient shadows. 512x512, no text.`,
  
  quizzes: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D open book with creamy paper pages fanning naturally. Visible page texture and subtle shadows in the spine. One page slightly turning. Background is a smooth gradient from purple (#a855f7) to pink (#ec4899). Library lighting with warm ambient glow. 512x512, no text.`,
  
  "ai-review": `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D QR code made of raised metallic cubes with holographic shimmer effect. Subtle digital glow emanating from the pattern. Background is a smooth gradient from purple (#9333ea) to violet (#7c3aed). Futuristic tech lighting with ambient reflections. 512x512, no text.`,
  
  settings: `Ultra-realistic 3D rendered iOS app icon: Two interlocking 3D gear cogs with brushed stainless steel finish and precise machined teeth. Realistic metallic reflections and mechanical precision. Background is a smooth gradient from zinc (#71717a) to neutral gray (#525252). Industrial lighting with subtle shadows. 512x512, no text.`,
  
  scoring: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D trophy cup with polished gold finish and detailed ornate handles. Gleaming reflections and luxury metallic sheen. Small pedestal base. Background is a smooth gradient from yellow (#eab308) to orange (#f97316). Award ceremony lighting with dramatic highlights. 512x512, no text.`,
  
  photos: `Ultra-realistic 3D rendered iOS app icon: A hyperrealistic 3D camera lens with visible glass elements, chrome focusing rings, and subtle aperture blades visible inside. Rainbow light refraction on the glass surface. Background is a smooth gradient from pink (#ec4899) to rose (#f43f5e). Professional photography studio lighting. 512x512, no text.`,
  
  "daily-logs": `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D desk calendar with tear-off pages and a premium green checkmark badge overlay. Realistic paper texture and subtle page shadows. Background is a smooth gradient from indigo (#6366f1) to blue (#3b82f6). Office lighting with clean aesthetic. 512x512, no text.`,
  
  "work-orders": `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D clipboard with metal clip and realistic paper work order form. Slight paper curl at edges. Background is a smooth gradient from amber (#f59e0b) to yellow (#eab308). Construction office lighting with professional depth. 512x512, no text.`,
  
  "service-tickets": `Ultra-realistic 3D rendered iOS app icon: Two photorealistic 3D admission-style tickets with perforated tear lines and realistic paper texture. Tickets slightly fanned apart. Background is a smooth gradient from red (#ef4444) to orange (#f97316). Event lighting with warm tones. 512x512, no text.`,
  
  inspections: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D magnifying glass with crystal clear lens, chrome metal frame, and elegant wooden handle. Light rays refracting through the lens. Background is a smooth gradient from sky blue (#0ea5e9) to blue (#3b82f6). Detective-style dramatic lighting. 512x512, no text.`,
  
  punchlists: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D notepad with multiple checkbox items, some checked with green marks. Realistic spiral binding and paper texture. Background is a smooth gradient from lime (#84cc16) to green (#22c55e). Fresh productive lighting aesthetic. 512x512, no text.`,
  
  documents: `Ultra-realistic 3D rendered iOS app icon: A stack of photorealistic 3D document papers with visible text lines and realistic paper edges. Slight shadow between sheets. Background is a smooth gradient from slate (#64748b) to gray (#6b7280). Clean office lighting with professional depth. 512x512, no text.`,
  
  incidents: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D warning triangle with glossy yellow surface and red exclamation mark with realistic depth. Subtle emergency glow effect. Background is a smooth gradient from rose (#f43f5e) to red (#ef4444). Alert lighting with urgency. 512x512, no text.`,
  
  team: `Ultra-realistic 3D rendered iOS app icon: Three photorealistic 3D human silhouettes standing together, rendered in frosted glass with subtle color tints. Overlapping with depth. Background is a smooth gradient from purple (#a855f7) to violet (#8b5cf6). Collaborative team lighting with warmth. 512x512, no text.`,
  
  permits: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D official document with embossed seal, raised stamp detail, and authentic paper texture. Government document aesthetic. Background is a smooth gradient from cyan (#06b6d4) to blue (#3b82f6). Official lighting with gravitas. 512x512, no text.`,
  
  equipment: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D wrench tool with brushed chrome finish and detailed grip texture. Industrial tool aesthetic with realistic metallic reflections. Background is a smooth gradient from zinc (#71717a) to neutral (#737373). Workshop lighting. 512x512, no text.`,
  
  vehicles: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D pickup truck with sleek design, glossy paint finish, and chrome details. Modern fleet vehicle aesthetic. Background is a smooth gradient from blue (#3b82f6) to indigo (#6366f1). Showroom lighting with professional depth. 512x512, no text.`,
  
  recognitions: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D medal with polished gold surface and elegant ribbon attachment. Award ceremony quality with detailed engravings suggested by light play. Background is a smooth gradient from yellow (#eab308) to orange (#f97316). Achievement lighting with golden glow. 512x512, no text.`,
  
  leads: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D contact card with raised person silhouette and subtle text line suggestions. Premium business card paper texture. Background is a smooth gradient from indigo (#6366f1) to purple (#a855f7). Sales meeting lighting with professional warmth. 512x512, no text.`,
  
  estimates: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D calculator with raised buttons, LCD display area, and brushed plastic finish. Modern office equipment aesthetic. Background is a smooth gradient from blue (#3b82f6) to sky blue (#0ea5e9). Financial office lighting. 512x512, no text.`,
  
  invoices: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D receipt or invoice paper with raised dollar sign symbol and realistic paper texture. Slight paper curl. Background is a smooth gradient from green (#22c55e) to emerald (#10b981). Accounting office lighting with clean aesthetic. 512x512, no text.`,
  
  analytics: `Ultra-realistic 3D rendered iOS app icon: A 3D frosted glass bar chart with three rising bars of different heights, glowing data points, and holographic reflections. Futuristic data visualization. Background is a smooth gradient from purple (#a855f7) to magenta (#d946ef). Tech dashboard lighting with digital glow. 512x512, no text.`,
  
  expenses: `Ultra-realistic 3D rendered iOS app icon: A stack of photorealistic 3D coins with detailed edge ridges and metallic gold/silver finish. Coins slightly cascading. Background is a smooth gradient from emerald (#10b981) to green (#22c55e). Financial lighting with monetary prestige. 512x512, no text.`,
  
  payments: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D credit card with metallic chip detail, embossed number suggestions, and premium plastic finish. Slight angle for depth. Background is a smooth gradient from blue (#3b82f6) to purple (#a855f7). Secure transaction lighting. 512x512, no text.`,
  
  financials: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D upward trending line chart made of glowing material with data points as spheres. Growth and success visualization. Background is a smooth gradient from teal (#14b8a6) to emerald (#10b981). Executive boardroom lighting. 512x512, no text.`,
  
  training: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D graduation cap with realistic fabric texture, tassel detail, and slight tilt. Academic achievement aesthetic. Background is a smooth gradient from orange (#f97316) to amber (#f59e0b). Graduation ceremony warm lighting. 512x512, no text.`,
  
  email: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D envelope with realistic paper texture, sealed flap, and subtle notification badge glow. Classic mail aesthetic. Background is a smooth gradient from red (#ef4444) to pink (#ec4899). Communication-focused warm lighting. 512x512, no text.`,
  
  warranties: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D shield with brushed metal surface and embedded checkmark. Protection and security aesthetic with premium finish. Background is a smooth gradient from blue (#3b82f6) to indigo (#6366f1). Trust and reliability lighting. 512x512, no text.`,
  
  contracts: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D fountain pen signing a document with visible ink line. Premium legal document aesthetic with realistic paper and pen materials. Background is a smooth gradient from purple (#a855f7) to violet (#8b5cf6). Executive signing ceremony lighting. 512x512, no text.`,
  
  proposals: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D document folder with premium ribbon seal. Business proposal presentation aesthetic with elegant materials. Background is a smooth gradient from blue (#3b82f6) to cyan (#06b6d4). Professional presentation lighting. 512x512, no text.`,
  
  solar: `Ultra-realistic 3D rendered iOS app icon: A photorealistic 3D sun with dynamic rays emanating outward and warm glow effect. Clean energy aesthetic with bright, optimistic feel. Background is a smooth gradient from yellow (#eab308) to orange (#f97316). Bright daylight with energy and vitality. 512x512, no text.`,
};

// Retry helper for rate limits
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const waitTime = Math.pow(2, attempt + 1) * 1000; // Exponential backoff: 2s, 4s, 8s
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  
  throw new Error("Max retries exceeded due to rate limiting");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appId, appName, customPrompt } = await req.json();

    if (!appId || !appName) {
      return new Response(
        JSON.stringify({ error: "appId and appName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to generating
    await supabase
      .from("app_icons")
      .upsert({
        app_id: appId,
        status: "generating",
        updated_at: new Date().toISOString(),
      }, { onConflict: "app_id" });

    // Get the premium prompt for this app, or build a detailed fallback
    const appPrompt = APP_PROMPTS[appId] || customPrompt || 
      `Ultra-realistic 3D rendered iOS app icon for "${appName}": A photorealistic 3D object representing ${appName.toLowerCase()} with premium materials (brushed metal, frosted glass, or matte finish). Soft studio lighting from top-left creates gentle shadows and ambient occlusion. Background is a smooth gradient with complementary colors. Hyperrealistic depth with subtle cast shadow. Clean minimalist Apple design aesthetic. Perfect 512x512 square composition, absolutely no text or labels.`;

    console.log(`Generating premium icon for ${appId}: ${appName}`);
    console.log(`Using prompt: ${appPrompt.substring(0, 100)}...`);

    // Call Lovable AI Gateway with Pro model for higher quality
    const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: appPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      await supabase
        .from("app_icons")
        .update({ 
          status: "failed", 
          error_message: `AI Gateway error: ${response.status}`,
          updated_at: new Date().toISOString(),
        })
        .eq("app_id", appId);

      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image data in response:", data);
      
      await supabase
        .from("app_icons")
        .update({ 
          status: "failed", 
          error_message: "No image data returned from AI",
          updated_at: new Date().toISOString(),
        })
        .eq("app_id", appId);

      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${appId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("app-icons")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      
      await supabase
        .from("app_icons")
        .update({ 
          status: "failed", 
          error_message: `Storage upload failed: ${uploadError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("app_id", appId);

      return new Response(
        JSON.stringify({ error: "Failed to upload image", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("app-icons")
      .getPublicUrl(fileName);

    const iconUrl = urlData.publicUrl;

    // Update database with completed status
    await supabase
      .from("app_icons")
      .upsert({
        app_id: appId,
        icon_url: iconUrl,
        prompt_used: appPrompt,
        status: "completed",
        error_message: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "app_id" });

    console.log(`Successfully generated premium icon for ${appId}: ${iconUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        appId, 
        iconUrl,
        message: `Premium icon generated successfully for ${appName}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating app icon:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
