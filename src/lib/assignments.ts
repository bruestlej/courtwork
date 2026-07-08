import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Assignment, Profile } from "@/types/database";

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AssignmentWithClient = Omit<Assignment, "client" | "playlist"> & {
  client: Pick<Profile, "full_name" | "email"> | null;
};

export type AssignmentWithTrainer = Omit<Assignment, "client" | "playlist"> & {
  trainer: Pick<Profile, "full_name"> | null;
  playlist: { title: string } | null;
};

export async function getTrainerAssignments(
  trainerId: string,
  limit?: number
): Promise<AssignmentWithClient[]> {
  const admin = getSupabaseAdmin();

  let query = admin
    .from("assignments")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: assignments, error } = await query;
  if (error || !assignments?.length) return [];

  const clientIds = [...new Set(assignments.map((a) => a.client_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", clientIds);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  );

  return assignments.map((a) => ({
    ...(a as Assignment),
    client: byId.get(a.client_id) ?? null,
  }));
}

export async function getClientAssignments(
  clientId: string
): Promise<AssignmentWithTrainer[]> {
  const admin = getSupabaseAdmin();

  const { data: assignments, error } = await admin
    .from("assignments")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !assignments?.length) return [];

  const trainerIds = [...new Set(assignments.map((a) => a.trainer_id))];
  const playlistIds = [...new Set(assignments.map((a) => a.playlist_id))];

  const [{ data: trainers }, { data: playlists }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", trainerIds),
    admin.from("playlists").select("id, title").in("id", playlistIds),
  ]);

  const trainerById = new Map(
    (trainers ?? []).map((t) => [t.id, { full_name: t.full_name }])
  );
  const playlistById = new Map(
    (playlists ?? []).map((p) => [p.id, { title: p.title }])
  );

  return assignments.map((a) => ({
    ...(a as Assignment),
    trainer: trainerById.get(a.trainer_id) ?? null,
    playlist: playlistById.get(a.playlist_id) ?? null,
  }));
}

export async function createAssignment(input: {
  trainerId: string;
  playlistId: string;
  clientId: string;
  title: string;
  message?: string | null;
  dueDate?: string | null;
}): Promise<{ data: Assignment | null; error: string | null }> {
  const admin = getSupabaseAdmin();

  const { data: link } = await admin
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", input.trainerId)
    .eq("client_id", input.clientId)
    .maybeSingle();

  if (!link) {
    return { data: null, error: "Client is not on your roster" };
  }

  const { data: playlist } = await admin
    .from("playlists")
    .select("id")
    .eq("id", input.playlistId)
    .eq("trainer_id", input.trainerId)
    .maybeSingle();

  if (!playlist) {
    return { data: null, error: "Playlist not found" };
  }

  const { data, error } = await admin
    .from("assignments")
    .insert({
      playlist_id: input.playlistId,
      client_id: input.clientId,
      trainer_id: input.trainerId,
      title: input.title,
      message: input.message ?? null,
      due_date: input.dueDate ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Assignment, error: null };
}
