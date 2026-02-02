import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// Initialize Supabase client for CRM operations
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  phone: string;
  address?: string;
  company: string;
  service: string;
  referralSource: string;
  message: string;
  // Additional fields for quote requests
  propertyAddress?: string;
  projectType?: string;
  propertyType?: string;
  timeline?: string;
  additionalInfo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormRequest = await req.json();
    
    console.log("CRM lead creation request received:", formData);

    // Validate required fields
    if (!formData.name || !formData.email) {
      console.error("Missing required fields:", { name: formData.name, email: formData.email });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Name and email are required fields" 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Create or update CRM lead
let leadId: string | null = null;
let quoteRequestId: string | null = null;
let leadAction = 'created';
    
    try {
      // Enhanced data structure for quote requests
      const isQuoteRequest = formData.referralSource === 'automated_quote_system';
      
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        company_name: formData.company || null,
        project_type: formData.projectType || formData.service || null,
        property_type: formData.propertyType || null,
        timeline: formData.timeline || null,
        source: formData.referralSource || null,
        notes: isQuoteRequest ? 
          `Property Address: ${formData.propertyAddress || 'Not provided'}\nProject Type: ${formData.projectType || 'Not specified'}\nProperty Type: ${formData.propertyType || 'Not specified'}\nTimeline: ${formData.timeline || 'Not specified'}\nAdditional Info: ${formData.additionalInfo || 'None'}\n\nOriginal Message: ${formData.message || ''}` : 
          formData.message || null,
        status: 'new'
      };

// For quote requests, create a separate quote_requests record
if (isQuoteRequest) {
  const quoteData = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone || null,
    project_type: formData.projectType || formData.service || null,
    property_type: formData.propertyType || null,
    timeline: formData.timeline || null,
    notes: formData.additionalInfo ? `Additional Info: ${formData.additionalInfo}` : (formData.message || null),
    property_address: formData.propertyAddress || null,
    status: 'new'
  };

  const { data: newQuote, error: insertQuoteError } = await supabase
    .from('quote_requests')
    .insert(quoteData)
    .select('id')
    .single();

  if (insertQuoteError) {
    console.error("Error creating quote request:", insertQuoteError);
    throw insertQuoteError;
  }

  quoteRequestId = newQuote.id;
  console.log("Quote request created:", quoteRequestId);
} else {
        // For general contact forms, check if lead exists and update
        const { data: existingLead, error: checkError } = await supabase
          .from('leads')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking existing lead:", checkError);
          throw checkError;
        }

        if (existingLead) {
          // Update existing lead
          const { data: updatedLead, error: updateError } = await supabase
            .from('leads')
            .update({
              ...leadData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLead.id)
            .select('id')
            .single();

          if (updateError) {
            console.error("Error updating lead:", updateError);
            throw updateError;
          }

          leadId = updatedLead.id;
          leadAction = 'updated';
          console.log("Lead updated in CRM:", leadId);
        } else {
          // Create new lead
          const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert(leadData)
            .select('id')
            .single();

          if (insertError) {
            console.error("Error creating lead:", insertError);
            throw insertError;
          }

          leadId = newLead.id;
          console.log("Lead created in CRM:", leadId);
        }
      }

// Send SMS notification to Sebastian for new leads
const SEBASTIAN_PHONE = '+15106196839';
try {
  console.log('Sending new lead SMS notification to Sebastian');
  
  // Get Twilio credentials
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    const leadType = isQuoteRequest ? 'Quote Request' : 'Lead';
    const smsBody = `🚨 New ${leadType}!\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\n${formData.propertyAddress ? `Address: ${formData.propertyAddress}\n` : ''}${formData.projectType ? `Project: ${formData.projectType}\n` : ''}\nCheck the dashboard for details.`;
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const smsResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: SEBASTIAN_PHONE,
        From: twilioPhoneNumber,
        Body: smsBody,
      }),
    });
    
    if (smsResponse.ok) {
      const smsResult = await smsResponse.json();
      console.log('SMS notification sent successfully to Sebastian');
      
      // Log the outbound SMS to sms_conversations for two-way tracking
      try {
        const { error: logError } = await supabase
          .from('sms_conversations')
          .insert({
            lead_id: leadId || null,
            from_phone: twilioPhoneNumber,
            to_phone: SEBASTIAN_PHONE,
            direction: 'outbound',
            message: smsBody,
            twilio_sid: smsResult.sid || null,
            context: {
              notification_type: isQuoteRequest ? 'quote_request' : 'lead',
              lead_name: formData.name,
              lead_email: formData.email,
              quote_request_id: quoteRequestId
            }
          });
        
        if (logError) {
          console.error('Failed to log outbound SMS:', logError);
        } else {
          console.log('✅ Outbound SMS logged to sms_conversations');
        }
      } catch (logErr) {
        console.error('Error logging outbound SMS:', logErr);
      }
    } else {
      const errorText = await smsResponse.text();
      console.error('Failed to send SMS notification:', errorText);
    }
  } else {
    console.log('Twilio credentials not configured, skipping SMS notification');
  }
} catch (smsError) {
  console.error('Error sending SMS notification:', smsError);
  // Don't fail the lead creation if SMS fails
}

// Trigger aerial imagery acquisition for quote requests
if (isQuoteRequest && formData.propertyAddress && quoteRequestId) {
  try {
    console.log('Triggering aerial imagery acquisition for quote request:', quoteRequestId);
    const imageryResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/acquire-aerial-imagery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteRequestId: quoteRequestId,
        propertyAddress: formData.propertyAddress
      })
    });

    if (imageryResponse.ok) {
      const imageryData = await imageryResponse.json();
      console.log('Aerial imagery acquisition triggered successfully:', imageryData);
    } else {
      console.error('Failed to trigger aerial imagery acquisition:', await imageryResponse.text());
    }
  } catch (imageryError) {
    console.error('Error triggering aerial imagery acquisition:', imageryError);
    // Don't fail the creation if imagery acquisition fails
  }
}

return new Response(
  JSON.stringify({ 
    success: true, 
    message: isQuoteRequest ? "Quote request created successfully" : "Lead created successfully",
    leadId,
    quoteRequestId,
    leadAction
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  }
);

    } catch (leadError) {
      console.error("CRM lead operation failed:", leadError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create lead in CRM system" 
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }

  } catch (error: any) {
    console.error("Error in create-crm-lead function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);