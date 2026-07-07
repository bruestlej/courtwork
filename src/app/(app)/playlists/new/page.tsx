import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PlaylistBuilder } from "@/components/playlists/playlist-builder";
import type { Clip } from "@/types/database";

export default async function NewPlaylistPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const { data: clips } = await supabase
    .from("clips")
    .select("*")
    .eq("trainer_id", profile.id)
    .order("title");

  return (
    <>
      <PageHeader title="New Playlist" backHref="/playlists" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <PlaylistBuilder clips={(clips as Clip[]) ?? []} />
      </div>
    </>
  );
}
