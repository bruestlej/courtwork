import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") {
    return NextResponse.json(
      { error: "Only trainers can manage billing" },
      { status: 403 }
    );
  }

  if (!profile.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Upgrade to Pro first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/settings?billing=return`,
  });

  return NextResponse.json({ url: session.url });
}
