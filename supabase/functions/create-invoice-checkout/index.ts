import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log('Stripe key exists:', !!stripeKey);
    
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const { invoiceNumber, amount, customerEmail } = await req.json();
    console.log('Received request:', { invoiceNumber, amount, customerEmail });

    if (!invoiceNumber || !amount) {
      console.error('Missing required fields:', { invoiceNumber, amount });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountInCents = Math.round(amount * 100);
    console.log('Creating checkout session for amount:', amountInCents, 'cents');

    // Create checkout session with embedded mode
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoiceNumber}`,
              description: 'Roofing services invoice payment',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      return_url: `${Deno.env.get('SUPABASE_URL')}/invoice/${invoiceNumber}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        invoice_number: invoiceNumber,
      },
    });

    console.log('Checkout session created successfully:', session.id);

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
