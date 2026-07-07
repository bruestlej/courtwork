import Stripe from "stripe";

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
  pro: {
    name: "Pro",
    price: 2900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "Unlimited clients",
      "Unlimited clips & playlists",
      "Homework assignments",
      "Email notifications",
      "Progress tracking",
    ],
  },
} as const;
