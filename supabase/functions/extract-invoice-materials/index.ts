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
    const { fileUrl, fileName } = await req.json();
    
    console.log("Processing invoice:", fileName);
    
    // Check if it's a PDF file - reject it with clear message
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      return new Response(
        JSON.stringify({ 
          error: "PDF files are not supported. Please upload your invoice as an image (JPG, PNG) or take a screenshot of the PDF.",
          success: false 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Prepare the enhanced prompt for construction invoices
    const systemPrompt = `You are an expert at extracting material information from construction invoices and receipts.

IMPORTANT: Pay special attention to these invoice formats:
- Standard invoice layouts with tabular item lists
- Item codes/SKUs in the first column (like "EBA215")
- Descriptions that may span multiple lines
- Quantities with units (like "1" with "30/Box" or "30Box")
- Rates/prices per unit
- Tax percentages (like "10.75%") that need to be calculated
- Total amounts at the bottom

Extract ALL material items from the invoice including:
- Date of purchase (check top of invoice, date fields)
- Vendor name (check company name at top, "Bill From", or letterhead)
- Item description (combine item code + full description if available)
- Item code/SKU (first column, like "EBA215")
- Quantity (actual quantity, not box size - if it says "1" quantity of "30Box", use 30)
- Unit (extract from U/M column or description - box, sheet, roll, each, etc.)
- Unit price (Rate column - price per unit)
- Tax amount (calculate from tax percentage if shown, or extract line item tax)
- Total amount (Amount column for that line item)

CALCULATION RULES:
1. If tax is shown as percentage (e.g., 10.75%), calculate: tax_amount = (quantity × unit_price) × (tax_rate / 100)
2. Total amount should equal: (quantity × unit_price) + tax_amount
3. For box quantities like "30Box", if quantity shows "1", actual quantity is 30

Return the data as a JSON array of objects with these exact fields:
{
  "date": "YYYY-MM-DD",
  "vendor": "string",
  "item_description": "string",
  "item_code": "string or null",
  "quantity": number,
  "unit": "string",
  "unit_price": number,
  "tax_amount": number,
  "total_amount": number
}

Be precise with numbers and dates. If information is missing, use null for strings and 0 for numbers.`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all material items from this invoice or receipt."
          },
          {
            type: "image_url",
            image_url: { url: fileUrl }
          }
        ]
      }
    ];

    console.log("Calling AI gateway for extraction...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" }
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
    console.log("AI extraction complete");
    
    const extractedContent = aiData.choices?.[0]?.message?.content;
    if (!extractedContent) {
      throw new Error("No content extracted from AI response");
    }

    // Parse the JSON response
    let extractedData;
    try {
      const parsed = JSON.parse(extractedContent);
      // Handle both array and object with items array
      extractedData = Array.isArray(parsed) ? parsed : (parsed.items || []);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Invalid JSON response from AI");
    }

    console.log(`Extracted ${extractedData.length} material items`);

    return new Response(
      JSON.stringify({ 
        success: true,
        materials: extractedData 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in extract-invoice-materials:", error);
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
