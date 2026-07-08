import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ClipLibrary } from "@/components/clips/clip-library";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/feedback";
import { Plus, Video } from "lucide-react";
import type { Clip } from "@/types/database";

export default async function ClipsPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const { data: clips, error } = await supabase
    .from("clips")
    .select("*")
    .eq("trainer_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Clip Library"
        subtitle={`${clips?.length ?? 0} clips`}
        action={
          <Link href="/clips/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {error && <ErrorBanner message={error.message} />}
        {clips && clips.length > 0 ? (
          <ClipLibrary clips={clips as Clip[]} />
        ) : (
          !error && (
            <EmptyState
              icon={Video}
              title="No clips yet"
              description="Upload short drill videos to build homework playlists."
              actionHref="/clips/new"
              actionLabel="Upload your first clip"
            />
          )
        )}
      </div>
    </>
  );
}
