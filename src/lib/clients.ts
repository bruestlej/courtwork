import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type TrainerClientLink = {
  id: string;
  trainer_id: string;
  client_id: string;
  created_at: string;
  client: Profile | null;
};

/** Load a trainer's roster via the user session (RLS-enforced). */
export async function getTrainerClientLinks(
  trainerId: string
): Promise<{ links: TrainerClientLink[]; error: string | null }> {
  const supabase = await createClient();

  const { data: links, error } = await supabase
    .from("trainer_clients")
    .select("id, trainer_id, client_id, created_at")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (error) return { links: [], error: error.message };
  if (!links?.length) return { links: [], error: null };

  const clientIds = links.map((l) => l.client_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", clientIds);

  if (profileError) return { links: [], error: profileError.message };

  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

  return {
    links: links.map((link) => ({
      ...link,
      client: byId.get(link.client_id) ?? null,
    })),
    error: null,
  };
}

export async function getTrainerClients(
  trainerId: string
): Promise<{ clients: Profile[]; error: string | null }> {
  const { links, error } = await getTrainerClientLinks(trainerId);
  return {
    clients: links
      .map((l) => l.client)
      .filter((c): c is Profile => Boolean(c)),
    error,
  };
}

export async function countTrainerClients(trainerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("trainer_clients")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", trainerId);
  return count ?? 0;
}
