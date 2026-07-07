import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import AssignHomeworkPage from "./assign-form";
import type { Playlist, Profile } from "@/types/database";

export default async function NewAssignmentPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const [{ data: playlists }, { data: links }] = await Promise.all([
    supabase
      .from("playlists")
      .select("*")
      .eq("trainer_id", profile.id)
      .order("title"),
    supabase
      .from("trainer_clients")
      .select("client:profiles!trainer_clients_client_id_fkey(*)")
      .eq("trainer_id", profile.id),
  ]);

  const clients = (links ?? [])
    .map((l) => {
      const c = l.client;
      return Array.isArray(c) ? c[0] : c;
    })
    .filter((c): c is Profile => Boolean(c));

  if (!playlists?.length) redirect("/playlists/new");
  if (!clients.length) redirect("/clients/add");

  return (
    <AssignHomeworkPage
      playlists={playlists as Playlist[]}
      clients={clients}
    />
  );
}
