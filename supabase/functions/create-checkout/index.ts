
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  productId: string;
  title: string;
  unit: string;
  pricePerUnit: number;
  quantity: number;
  totalPrice: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CHECKOUT SESSION START ===");
    
    // Get and validate Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
    
    if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
      console.error("Invalid or missing STRIPE_SECRET_KEY");
      return new Response(
        JSON.stringify({ 
          error: "Stripe configuration missing. Please contact support.",
          code: "STRIPE_KEY_MISSING"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    
    const { items, embedded, userId, customerName, customerPhone, customerEmail }: { 
      items: CartItem[], 
      embedded?: boolean,
      userId?: string,
      customerName?: string,
      customerPhone?: string,
      customerEmail?: string
    } = requestBody;

    if (!items || items.length === 0) {
      console.error("No items in cart");
      return new Response(
        JSON.stringify({ error: "Cart is empty", code: "EMPTY_CART" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate cart items
    console.log("=== VALIDATING CART ITEMS ===");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title || !item.pricePerUnit || item.pricePerUnit <= 0 || !item.quantity || item.quantity <= 0) {
        return new Response(
          JSON.stringify({ error: `Invalid item: ${item.title || 'Unknown'}`, code: "INVALID_ITEM" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    console.log("Stripe initialized successfully");

    // Create line items for Stripe
    const lineItems = items.map((item) => {
      let quantity: number;
      let unitAmount: number;
      
      if (item.unit === 'EA') {
        quantity = Math.max(1, Math.round(item.quantity));
        unitAmount = Math.round(item.pricePerUnit * 100);
      } else {
        const totalPriceInCents = Math.round(item.pricePerUnit * item.quantity * 100);
        quantity = 1;
        unitAmount = totalPriceInCents;
      }
      
      return {
        price_data: {
          currency: "usd",
          product_data: { name: item.title },
          unit_amount: unitAmount,
        },
        quantity: quantity,
      };
    });

    const origin = req.headers.get("origin") || "https://roofingfriend.com";
    
    // Calculate subtotal for metadata
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Create metadata for order creation via webhook
    const metadata = {
      user_id: userId || '',
      customer_name: customerName || '',
      customer_phone: customerPhone || '',
      customer_email: customerEmail || '',
      items: JSON.stringify(items),
      subtotal: subtotal.toString(),
    };

    // Create Stripe checkout session - embedded or hosted mode
    if (embedded) {
      console.log("=== CREATING EMBEDDED CHECKOUT SESSION ===");
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        ui_mode: "embedded",
        return_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        metadata,
      });
      
      console.log("Embedded session created:", session.id);
      return new Response(
        JSON.stringify({ clientSecret: session.client_secret }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      console.log("=== CREATING HOSTED CHECKOUT SESSION ===");
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata,
      });
      
      console.log("Hosted session created:", session.id);
      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

  } catch (error) {
    console.error("=== ERROR ===", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, code: "INTERNAL_ERROR" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
