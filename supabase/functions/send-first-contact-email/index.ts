import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, name, email, phone, project_type, property_type, notes, timeline, preview, editInstructions, currentEmail } = await req.json();
    
    console.log(preview ? "Generating preview for lead:" : "Sending first contact email for lead:", leadId);
    if (editInstructions) {
      console.log("Edit instructions provided:", editInstructions);
    }

    // Validate required fields
    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    // Get API keys
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!openaiApiKey || !resendApiKey) {
      throw new Error("Missing required API keys");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build context for OpenAI
    const hasProjectType = project_type && project_type !== '';
    const hasAddress = notes && (notes.toLowerCase().includes('address') || notes.toLowerCase().includes('street'));
    
    let contextInfo = `- Customer name: ${name}\n`;
    contextInfo += `- Project type: ${hasProjectType ? project_type : 'not specified'}\n`;
    contextInfo += `- Property type: ${property_type || 'not specified'}\n`;
    contextInfo += `- Timeline: ${timeline || 'not specified'}\n`;
    contextInfo += `- Property address provided: ${hasAddress ? 'yes' : 'no'}\n`;
    if (notes) contextInfo += `- Additional notes: ${notes}\n`;

    let systemPrompt: string;
    let userPrompt: string;

    // Check if this is an edit request
    if (editInstructions && currentEmail) {
      systemPrompt = `You are Sebastian Runciman from The Roofing Friend, Inc. You need to revise an existing email based on the user's feedback while maintaining professionalism.`;
      
      userPrompt = `Here is the current email:
---
${currentEmail}
---

Customer context:
${contextInfo}

Please revise this email based on these instructions: "${editInstructions}"

Keep the signature as: "Best, Sebastian Runciman, The Roofing Friend, Inc."
Maintain a friendly, professional tone. Only output the revised email body, no subject line.`;
    } else {
      systemPrompt = `You are Sebastian Runciman from The Roofing Friend, Inc., responding to a new lead inquiry. Generate a warm, professional first contact email.`;
      
      userPrompt = `Context:
${contextInfo}

Generate an email body (without subject line) that:
1. Thanks them for reaching out
2. ${hasProjectType ? `Acknowledges their need: "We can definitely help ${project_type === 'repair' ? 'with your roof repair' : project_type === 'replacement' ? 'replace your roof' : project_type === 'inspection' ? 'inspect your roof' : 'with your roofing project'}"` : 'Asks what they need help with'}
3. ${!hasAddress ? 'Politely requests the property address' : 'Mentions we have their property address'}
4. Mentions we'll schedule an inspection to take a closer look
5. States we're fully booked this week but next week works
6. Asks what day works best for them
7. Signs: "Best, Sebastian Runciman, The Roofing Friend, Inc."

Keep it concise (4-5 short paragraphs), friendly, and professional. Use a natural conversational tone. Do not include a subject line in the body.`;
    }

    // Call OpenAI API
    console.log("Calling OpenAI API to generate email...");
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const emailContent = openaiData.choices[0].message.content;

    console.log("Generated email content:", emailContent);

    // If preview mode, just return the content without sending
    if (preview) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          preview: true,
          message: editInstructions ? "Email revised" : "Email preview generated",
          emailContent,
          subject: "Re: Your Roofing Inquiry"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: "Sebastian Runciman <onboarding@resend.dev>",
      to: [email],
      subject: "Re: Your Roofing Inquiry",
      html: emailContent.replace(/\n/g, '<br>'),
    });

    console.log("Email sent via Resend:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}. ${emailResponse.error.message.includes('verify a domain') ? 'Please verify your domain at resend.com/domains or send to your verified email (fastrackfix@gmail.com).' : ''}`);
    }

    // Update lead status to 'contacted'
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: 'contacted',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      console.error("Error updating lead status:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailContent 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in send-first-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
