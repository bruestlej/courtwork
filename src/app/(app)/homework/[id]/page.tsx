import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HomeworkDetail } from "./homework-detail";
import { unwrapJoin } from "@/lib/utils";
import type { Clip } from "@/types/database";

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireClient();
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .eq("client_id", profile.id)
    .single();

  if (!assignment) notFound();

  const [{ data: items }, { data: progress }] = await Promise.all([
    supabase
      .from("playlist_items")
      .select("position, clip:clips(*)")
      .eq("playlist_id", assignment.playlist_id)
      .order("position"),
    supabase
      .from("assignment_progress")
      .select("*")
      .eq("assignment_id", id),
  ]);

  const clips = (items ?? [])
    .map((i) => unwrapJoin(i.clip))
    .filter((c): c is Clip => Boolean(c));

  return (
    <HomeworkDetail
      assignment={assignment}
      clips={clips}
      progress={progress ?? []}
    />
  );
}
