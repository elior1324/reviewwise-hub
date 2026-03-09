import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_U6q0bcJeR70YPv": "pro",
  "prod_U6q1CwTI9xXEeK": "premium",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();

    let event: Stripe.Event;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured. Webhook signature verification is required.");
    }

    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    logStep("Event received", { type: event.type, id: event.id });

    const relevantEvents = [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ];

    if (!relevantEvents.includes(event.type)) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerEmail: string | null = null;
    let newTier = "free";

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      customerEmail = session.customer_email || null;

      // If no email on session, look up the customer
      if (!customerEmail && session.customer) {
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (!customer.deleted) customerEmail = customer.email;
      }

      // Get the subscription to determine the product/tier
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const productId = sub.items.data[0]?.price?.product as string;
        newTier = PRODUCT_TO_TIER[productId] || "pro";
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(sub.customer as string);
      if (!customer.deleted) customerEmail = customer.email;

      if (sub.status === "active") {
        const productId = sub.items.data[0]?.price?.product as string;
        newTier = PRODUCT_TO_TIER[productId] || "pro";
      } else {
        newTier = "free";
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(sub.customer as string);
      if (!customer.deleted) customerEmail = customer.email;
      newTier = "free";
    }

    if (!customerEmail) {
      logStep("No customer email found, skipping");
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Updating tier", { email: customerEmail, newTier });

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const matchedUser = userData?.users?.find(
      (u: any) => u.email?.toLowerCase() === customerEmail!.toLowerCase()
    );

    if (!matchedUser) {
      logStep("No matching user found for email", { email: customerEmail });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update businesses owned by this user
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ subscription_tier: newTier })
      .eq("owner_id", matchedUser.id);

    if (updateError) {
      logStep("Error updating business tier", { error: updateError.message });
      throw updateError;
    }

    logStep("Successfully updated tier", { userId: matchedUser.id, newTier });

    return new Response(JSON.stringify({ received: true, updated: true, tier: newTier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
