import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TrainerClientLink = {
  id: string;
  trainer_id: string;
  client_id: string;
  created_at: string;
  client: Profile | null;
};

/** Load a trainer's roster (bypasses nested-join RLS issues). */
export async function getTrainerClientLinks(
  trainerId: string
): Promise<TrainerClientLink[]> {
  const admin = getSupabaseAdmin();

  const { data: links, error } = await admin
    .from("trainer_clients")
    .select("id, trainer_id, client_id, created_at")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (error || !links?.length) return [];

  const clientIds = links.map((l) => l.client_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .in("id", clientIds);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  return links.map((link) => ({
    ...link,
    client: byId.get(link.client_id) ?? null,
  }));
}

export async function getTrainerClients(trainerId: string): Promise<Profile[]> {
  const links = await getTrainerClientLinks(trainerId);
  return links
    .map((l) => l.client)
    .filter((c): c is Profile => Boolean(c));
}

export async function countTrainerClients(trainerId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from("trainer_clients")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", trainerId);
  return count ?? 0;
}
