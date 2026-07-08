import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/** After Checkout success, confirm subscription with Stripe and update profile. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customers = await getStripe().customers.list({
      email: user.email,
      limit: 5,
    });
    const match =
      customers.data.find((c) => c.metadata?.supabase_user_id === user.id) ||
      customers.data[0];
    if (match) {
      customerId = match.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }
  }

  if (!customerId) {
    return NextResponse.json({
      status: profile?.subscription_status || "free",
      synced: false,
    });
  }

  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const status = subscriptions.data.length > 0 ? "active" : "free";

  await admin
    .from("profiles")
    .update({ subscription_status: status })
    .eq("id", user.id);

  return NextResponse.json({ status, synced: true });
}
