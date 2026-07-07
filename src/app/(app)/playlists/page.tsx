import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ListMusic } from "lucide-react";

export default async function PlaylistsPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const { data: playlists } = await supabase
    .from("playlists")
    .select("*, playlist_items(count)")
    .eq("trainer_id", profile.id)
    .order("updated_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Playlists"
        subtitle={`${playlists?.length ?? 0} playlists`}
        action={
          <Link href="/playlists/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New
            </Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {playlists && playlists.length > 0 ? (
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                      <ListMusic className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm">
                        {playlist.title}
                      </CardTitle>
                      <CardDescription>
                        {(playlist.playlist_items as { count: number }[])?.[0]
                          ?.count ?? 0}{" "}
                        clips
                        {playlist.description &&
                          ` · ${playlist.description.slice(0, 30)}`}
                      </CardDescription>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <ListMusic className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-sm text-stone-500">No playlists yet</p>
            <Link href="/playlists/new">
              <Button size="sm" className="mt-3">
                Build your first playlist
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
