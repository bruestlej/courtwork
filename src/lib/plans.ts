import type { Profile, SubscriptionStatus } from "@/types/database";

/** Free-tier caps — Pro removes these limits. */
export const FREE_LIMITS = {
  clients: 3,
  clips: 10,
  playlists: 3,
} as const;

export type PlanResource = keyof typeof FREE_LIMITS;

export function isProActive(status: SubscriptionStatus | string): boolean {
  return status === "active";
}

export function getLimitMessage(resource: PlanResource): string {
  const limit = FREE_LIMITS[resource];
  const label =
    resource === "clients"
      ? "clients"
      : resource === "clips"
        ? "clips"
        : "playlists";
  return `Free plan includes up to ${limit} ${label}. Upgrade to Pro for unlimited.`;
}

export function canAddResource(
  resource: PlanResource,
  currentCount: number,
  profile: Pick<Profile, "subscription_status">
): { allowed: boolean; limit?: number; message?: string } {
  if (isProActive(profile.subscription_status)) {
    return { allowed: true };
  }

  const limit = FREE_LIMITS[resource];
  if (currentCount >= limit) {
    return { allowed: false, limit, message: getLimitMessage(resource) };
  }

  return { allowed: true, limit };
}

export const PLAN_COPY = {
  free: {
    name: "Free",
    summary: "Up to 3 clients, 10 clips, and 3 playlists",
    features: [
      `${FREE_LIMITS.clients} clients`,
      `${FREE_LIMITS.clips} clips`,
      `${FREE_LIMITS.playlists} playlists`,
      "Homework assignments",
      "Progress tracking",
    ],
  },
  pro: {
    name: "Pro",
    summary: "Unlimited clients, clips, and playlists",
    features: [
      "Unlimited clients",
      "Unlimited clips & playlists",
      "Homework assignments",
      "Email notifications",
      "Progress tracking",
    ],
  },
} as const;
