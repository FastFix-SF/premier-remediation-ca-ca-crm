import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      console.error("Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Stripe configuration missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // If we have both signature and webhook secret, verify the signature
    if (signature && stripeWebhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
        console.log("Webhook signature verified");
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else {
      // No signature verification - parse the body directly (for testing/development)
      console.log("No webhook secret configured - skipping signature verification");
      event = JSON.parse(body);
    }

    console.log("Received Stripe event:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout session:", session.id);

      // Check if order already exists for this session
      const { data: existingOrder } = await supabase
        .from("store_orders")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .single();

      if (existingOrder) {
        console.log("Order already exists for session:", session.id);
        return new Response(
          JSON.stringify({ received: true, message: "Order already exists" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const metadata = session.metadata || {};
      const items = metadata.items ? JSON.parse(metadata.items) : [];
      const subtotal = parseFloat(metadata.subtotal || "0");
      const total = (session.amount_total || 0) / 100;

      const orderData = {
        user_id: metadata.user_id || null,
        customer_name: metadata.customer_name || session.customer_details?.name || "Guest",
        customer_phone: metadata.customer_phone || session.customer_details?.phone || "",
        customer_email: metadata.customer_email || session.customer_details?.email || "",
        status: "pending",
        items: items,
        subtotal: subtotal,
        tax: 0,
        shipping: 0,
        total: total,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      };

      console.log("Creating order:", orderData);

      const { data: order, error: orderError } = await supabase
        .from("store_orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
      } else {
        console.log("Order created successfully:", order.id, order.order_number);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook handler failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
