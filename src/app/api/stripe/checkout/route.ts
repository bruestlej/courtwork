import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe, PLANS } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!PLANS.pro.priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRO_PRICE_ID is not configured" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role && profile.role !== "trainer") {
    return NextResponse.json(
      { error: "Only trainers can upgrade" },
      { status: 403 }
    );
  }

  // Billing fields are protected by trigger; use admin for customer id writes
  const admin = getSupabaseAdmin();
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: profile?.email || user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PLANS.pro.priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?upgraded=true`,
    cancel_url: `${baseUrl}/settings`,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
