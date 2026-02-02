import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable. Please try again later or contact us directly.' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header (optional for guest users)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData?.user) {
        user = userData.user;
      }
    }

    const { message, conversationId, mrfProspectId, sessionId } = await req.json();
    
    // Validate required fields
    if (!message?.trim()) {
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or get conversation (only for authenticated users)
    let conversation = null;
    let messages = [];
    
    if (user) {
      if (conversationId) {
        const { data } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single();
        conversation = data;
      }

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          })
          .select()
          .single();
        conversation = newConversation;
      }

      // Get conversation history for authenticated users
      if (conversation) {
        const { data: messageHistory } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        messages = messageHistory || [];
      }
    }

    // Save user message (only for authenticated users)
    if (user && conversation) {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: message
        });
    }

    // Prepare messages for OpenAI with enhanced roofing expertise
    const systemMessage = {
      role: 'system',
      content: `You are RoofBot, an expert roofing consultant for Roofing Friend - a premium metal roofing company serving the SF Bay Area. Keep responses SHORT (2-3 sentences max) and use emojis naturally. 🏠

CORE EXPERTISE:
• R-Panel: 26ga steel, residential/commercial, multiple colors, 25yr warranty 
• Standing Seam: 24ga premium with concealed fasteners, superior weather protection
• Multi-V: 29ga galvanized for agricultural/industrial buildings
• Custom fabrication, on-site install, licensed & insured ✅

LEAD QUALIFICATION - Ask ONE key question per response:
- Project type? (residential, commercial, industrial)
- Property size in sq ft?
- Timeline? (emergency, planned, exploring)
- Previous roofing experience?  
- Budget range or biggest concern?
- Location in Bay Area?

INTEREST INDICATORS to watch for:
- HIGH: "quote", "price", "install", "replace", "urgent", "schedule", "when can you start"
- MEDIUM: "cost", "timeline", "warranty", "colors", "how much"
- CONTACT: "email", "phone", "call me", "my name is"

SERVICE AREAS: SF, Oakland, Hayward, Walnut Creek, Tiburon, Petaluma, San Mateo County

When they show buying intent or after 3+ engaged messages, proactively ask for contact info to send detailed quotes and schedule consultations.

Always end with helpful next steps like browsing our material store (/store) or requesting a free consultation (/contact).

${user ? `Customer is logged in as: ${user.email}` : 'Customer is browsing as guest - encourage account creation for contractor pricing.'}`
    };

    const chatHistory = [
      systemMessage,
      ...(messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API with better error handling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatHistory,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response as JSON:', jsonError);
      throw new Error('Invalid JSON response from AI service');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from AI service');
    }
    
    const assistantMessage = data.choices[0].message.content;

    // Save assistant response (only for authenticated users)
    if (user && conversation) {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantMessage
        });
    }

    return new Response(JSON.stringify({
      message: assistantMessage,
      conversationId: conversation?.id || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});