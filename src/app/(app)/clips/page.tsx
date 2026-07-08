import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ClipLibrary } from "@/components/clips/clip-library";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Video } from "lucide-react";
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
          <ClipLibrary clips={clips as Clip[]} />
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
