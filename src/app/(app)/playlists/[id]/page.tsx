import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PlaylistBuilder } from "@/components/playlists/playlist-builder";
import type { Clip } from "@/types/database";

export default async function EditPlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireTrainer();
  const supabase = await createClient();

  const [{ data: playlist }, { data: items }, { data: clips }] =
    await Promise.all([
      supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .eq("trainer_id", profile.id)
        .single(),
      supabase
        .from("playlist_items")
        .select("clip_id, position")
        .eq("playlist_id", id)
        .order("position"),
      supabase
        .from("clips")
        .select("*")
        .eq("trainer_id", profile.id)
        .order("title"),
    ]);

  if (!playlist) notFound();

  const initialClipIds = (items ?? []).map((i) => i.clip_id);

  return (
    <>
      <PageHeader title="Edit Playlist" backHref="/playlists" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <PlaylistBuilder
          clips={(clips as Clip[]) ?? []}
          playlistId={playlist.id}
          initialTitle={playlist.title}
          initialDescription={playlist.description ?? ""}
          initialClipIds={initialClipIds}
        />
      </div>
    </>
  );
}
