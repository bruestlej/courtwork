import { createClient } from "@/lib/supabase/server";
import type { Assignment, Profile } from "@/types/database";

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
): Promise<{ assignments: AssignmentWithClient[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("assignments")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: assignments, error } = await query;
  if (error) return { assignments: [], error: error.message };
  if (!assignments?.length) return { assignments: [], error: null };

  const clientIds = [...new Set(assignments.map((a) => a.client_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", clientIds);

  if (profileError) return { assignments: [], error: profileError.message };

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  );

  return {
    assignments: assignments.map((a) => ({
      ...(a as Assignment),
      client: byId.get(a.client_id) ?? null,
    })),
    error: null,
  };
}

export async function getClientAssignments(
  clientId: string
): Promise<{ assignments: AssignmentWithTrainer[]; error: string | null }> {
  const supabase = await createClient();

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return { assignments: [], error: error.message };
  if (!assignments?.length) return { assignments: [], error: null };

  const trainerIds = [...new Set(assignments.map((a) => a.trainer_id))];
  const playlistIds = [...new Set(assignments.map((a) => a.playlist_id))];

  const [{ data: trainers, error: trainerError }, { data: playlists, error: playlistError }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", trainerIds),
      supabase.from("playlists").select("id, title").in("id", playlistIds),
    ]);

  if (trainerError) return { assignments: [], error: trainerError.message };
  if (playlistError) return { assignments: [], error: playlistError.message };

  const trainerById = new Map(
    (trainers ?? []).map((t) => [t.id, { full_name: t.full_name }])
  );
  const playlistById = new Map(
    (playlists ?? []).map((p) => [p.id, { title: p.title }])
  );

  return {
    assignments: assignments.map((a) => ({
      ...(a as Assignment),
      trainer: trainerById.get(a.trainer_id) ?? null,
      playlist: playlistById.get(a.playlist_id) ?? null,
    })),
    error: null,
  };
}

export async function createAssignment(input: {
  trainerId: string;
  playlistId: string;
  clientId: string;
  title: string;
  message?: string | null;
  dueDate?: string | null;
}): Promise<{ data: Assignment | null; error: string | null }> {
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", input.trainerId)
    .eq("client_id", input.clientId)
    .maybeSingle();

  if (!link) {
    return { data: null, error: "Client is not on your roster" };
  }

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", input.playlistId)
    .eq("trainer_id", input.trainerId)
    .maybeSingle();

  if (!playlist) {
    return { data: null, error: "Playlist not found" };
  }

  const { data, error } = await supabase
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
