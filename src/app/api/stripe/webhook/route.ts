import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function setStatusByUserId(
  userId: string,
  status: string,
  customerId?: string
) {
  const updates: {
    subscription_status: string;
    stripe_customer_id?: string;
  } = { subscription_status: status };
  if (customerId) updates.stripe_customer_id = customerId;

  await getSupabaseAdmin().from("profiles").update(updates).eq("id", userId);
}

async function setStatusByCustomerId(customerId: string, status: string) {
  await getSupabaseAdmin()
    .from("profiles")
    .update({ subscription_status: status })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (userId) {
          await setStatusByUserId(userId, "active", customerId);
        } else if (customerId) {
          await setStatusByCustomerId(customerId, "active");
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : "canceled";
        await setStatusByCustomerId(customerId, status);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        await setStatusByCustomerId(customerId, "canceled");
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        if (customerId) await setStatusByCustomerId(customerId, "past_due");
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
