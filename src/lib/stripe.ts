import Stripe from "stripe";
import { PLAN_COPY } from "@/lib/plans";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return stripeClient;
}

export const PLANS = {
  free: PLAN_COPY.free,
  pro: {
    name: "Pro",
    price: 2900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [...PLAN_COPY.pro.features],
  },
} as const;
