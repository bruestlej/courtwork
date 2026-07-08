import { createClient } from "@/lib/supabase/server";
import { FREE_LIMITS, isProActive } from "@/lib/plans";
import type { Profile } from "@/types/database";

export type TrainerUsage = {
  clients: number;
  clips: number;
  playlists: number;
  isPro: boolean;
  limits: typeof FREE_LIMITS;
};

export async function getTrainerUsage(
  trainerId: string,
  subscriptionStatus?: Profile["subscription_status"]
): Promise<TrainerUsage> {
  const supabase = await createClient();

  let status = subscriptionStatus;
  if (!status) {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", trainerId)
      .single();
    status = data?.subscription_status ?? "free";
  }

  const [clients, clips, playlists] = await Promise.all([
    supabase
      .from("trainer_clients")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId),
    supabase
      .from("clips")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId),
    supabase
      .from("playlists")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId),
  ]);

  return {
    clients: clients.count ?? 0,
    clips: clips.count ?? 0,
    playlists: playlists.count ?? 0,
    isPro: isProActive(status ?? "free"),
    limits: FREE_LIMITS,
  };
}
