import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, projectId, photos, photoUrls, audioBase64 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Support both new photos array and legacy photoUrls
    const photoData = photos || (photoUrls || []).map((url: string) => ({ url, caption: '', comments: [] }));

    console.log('Generating report for project:', projectName);
    console.log('Number of photos:', photoData?.length || 0);

    // Handle audio - transcription not supported, use placeholder
    let transcription = '';
    
    if (audioBase64) {
      console.log('Audio recording provided (transcription via gateway not supported)');
      transcription = 'Voice note was recorded by field worker. Please generate report based on visual analysis of photos and their captions/comments.';
    }

    // Build photo context with notes, recommendations, and comments
    const photoContext = photoData.map((photo: any, i: number) => {
      let context = `Photo ${i + 1}: ${photo.url}`;
      if (photo.caption) context += `\n  - Notes: "${photo.caption}"`;
      if (photo.recommendation) context += `\n  - Recommendation: "${photo.recommendation}"`;
      if (photo.comments && photo.comments.length > 0) {
        context += `\n  - Comments: ${photo.comments.map((c: string) => `"${c}"`).join(', ')}`;
      }
      return context;
    }).join('\n\n');

    // Company info for professional branding
    const companyInfo = {
      name: 'THE ROOFING FRIEND, INC',
      address: '211 Jackson St. Hayward, CA 94544',
      phone: '(415) 697-1849',
      email: 'roofingfriend@gmail.com',
      license: 'CA License #1067709',
      tagline: '"We Can, We Will" - Your Trusted Metal Roofing Partner',
      logoUrl: 'https://roofingfriend.lovable.app/images/roofing-friend-logo.png'
    };

    // Generate the report using Lovable AI with the photos and transcription
    console.log('Generating report with AI...');
    
    const reportResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional report writer for construction and roofing projects. Generate clear, professional, and well-formatted field reports suitable for customer presentation.

IMPORTANT: Start your response DIRECTLY with the report content. Do NOT include any preamble, introduction, or phrases like "Here is the report" or "Based on the photos". Jump straight into the report format.

The report MUST follow this EXACT structure with professional HTML formatting:

<!-- Professional Header -->
<div class="report-header">
  <img src="${companyInfo.logoUrl}" alt="${companyInfo.name}" class="report-logo" />
  <div class="company-info">
    <h1 class="company-name">${companyInfo.name}</h1>
    <p class="company-detail">${companyInfo.address}</p>
    <p class="company-detail">${companyInfo.phone} | ${companyInfo.email}</p>
    <p class="company-license">${companyInfo.license}</p>
  </div>
</div>

<div class="report-title-section">
  <h2 class="report-title">Field Inspection Report</h2>
  <div class="report-meta">
    <p><strong>Project:</strong> [PROJECT_NAME]</p>
    <p><strong>Date:</strong> [current date in format: Month Day, Year]</p>
    <p><strong>Report #:</strong> FIR-[generate a 6 digit number]</p>
  </div>
</div>

<div class="report-divider"></div>

<div class="report-content">
  <div class="report-section">
    <h3 class="section-heading">1. Executive Summary</h3>
    <p class="section-text">[Brief professional overview of the inspection, key findings, and recommendations in 2-3 sentences]</p>
  </div>

  <div class="report-section">
    <h3 class="section-heading">2. Work Performed</h3>
    <p class="section-text">[Detailed description of work completed or inspection performed]</p>
    <ul class="work-list">
      <li>[Key work items or inspection points]</li>
    </ul>
  </div>

  <div class="report-section">
    <h3 class="section-heading">3. Photo Documentation</h3>
    [For each photo, use this exact format:]
    <div class="photo-documentation">
      <div class="photo-container">
        <img src="[PHOTO_URL]" alt="Photo [number]" class="report-photo" />
        <p class="photo-caption"><strong>Photo [number]:</strong> [Professional description combining the provided notes/comments with your visual analysis]</p>
      </div>
    </div>
  </div>

  <div class="report-section">
    <h3 class="section-heading">4. Observations & Findings</h3>
    <ul class="findings-list">
      <li>[Professional observations from photos and voice notes]</li>
    </ul>
  </div>

  <div class="report-section">
    <h3 class="section-heading">5. Recommendations</h3>
    <p class="section-text">Based on our field inspection and the repair recommendations noted for each area, we recommend the following actions:</p>
    <ul class="recommendations-list">
      <li>[Use the specific recommendations provided for each photo - these are the repair suggestions the field worker documented]</li>
      <li>[Include any additional professional recommendations based on overall findings]</li>
    </ul>
  </div>
</div>

<div class="report-footer">
  <div class="footer-divider"></div>
  <p class="footer-tagline">${companyInfo.tagline}</p>
  <p class="footer-contact">${companyInfo.license} | ${companyInfo.phone} | ${companyInfo.email}</p>
  <p class="footer-address">${companyInfo.address}</p>
</div>

CRITICAL INSTRUCTIONS:
- Use professional, formal language suitable for customer presentation
- Use the provided notes (caption) for internal observations
- Use the provided recommendations for customer-facing repair suggestions - these should be prominently featured in the Recommendations section
- Keep descriptions clear, factual, and professional
- Include all photos with proper formatting
- Embed the actual photo URLs in img tags with class="report-photo"
- Do NOT add any text before the report-header div`
          },
          {
            role: 'user',
            content: `Generate a professional field inspection report for project "${projectName}".

Voice note from field worker:
${transcription || 'No voice note provided'}

Photos to include in the report WITH their notes and recommendations (use these exact URLs in img tags):
${photoContext}

There are ${photoData.length} photo(s) to document. Create a comprehensive, customer-facing field report. EMBED the actual photo URLs in the report using img tags with class="report-photo". 

IMPORTANT: 
- Use the "Notes" for each photo as internal observations in the photo documentation section
- Use the "Recommendation" for each photo as customer-facing repair suggestions - compile these into the Recommendations section
- If a photo has a specific recommendation, include it prominently in Section 5 (Recommendations)`
          }
        ],
      }),
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      console.error('Report generation error:', errorText);
      
      if (reportResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (reportResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Failed to generate report');
    }

    const responseText = await reportResponse.text();
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response from AI');
      throw new Error('Received empty response from AI. Please try again or reduce the number of photos.');
    }

    let reportData;
    try {
      reportData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new Error('Invalid response format from AI. Please try again.');
    }

    const report = reportData.choices?.[0]?.message?.content || '';
    if (!report) {
      throw new Error('AI generated an empty report. Please try again.');
    }

    console.log('Report generated successfully');

    return new Response(JSON.stringify({ 
      report,
      transcription 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-project-report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
