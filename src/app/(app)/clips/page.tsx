import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Video } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Clip } from "@/types/database";

export default async function ClipsPage() {
  const profile = await requireTrainer();
  const supabase = await createClient();

  const { data: clips } = await supabase
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
        {clips && clips.length > 0 ? (
          <div className="space-y-2">
            {(clips as Clip[]).map((clip) => (
              <Card key={clip.id} className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Video className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm">{clip.title}</CardTitle>
                  <CardDescription>
                    {formatDuration(clip.duration_seconds)}
                    {clip.description && ` · ${clip.description.slice(0, 40)}`}
                  </CardDescription>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12 text-center">
            <Video className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-sm text-stone-500">No clips yet</p>
            <Link href="/clips/new">
              <Button size="sm" className="mt-3">
                Upload your first clip
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
