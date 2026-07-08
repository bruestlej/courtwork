import { redirect } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTrainerClients } from "@/lib/clients";
import AssignHomeworkPage from "./assign-form";
import type { Playlist } from "@/types/database";

export default async function NewAssignmentPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const [{ data: playlists }, clientsResult] = await Promise.all([
    supabase
      .from("playlists")
      .select("*")
      .eq("trainer_id", profile.id)
      .order("title"),
    getTrainerClients(profile.id),
  ]);

  if (!playlists?.length) redirect("/playlists/new");
  if (!clientsResult.clients.length) redirect("/clients/add");

  return (
    <AssignHomeworkPage
      playlists={playlists as Playlist[]}
      clients={clientsResult.clients}
    />
  );
}
