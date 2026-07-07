"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Play, Video } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Clip, AssignmentProgress } from "@/types/database";

interface HomeworkDetailProps {
  assignment: {
    id: string;
    title: string;
    message: string | null;
    status: string;
    due_date: string | null;
  };
  clips: Clip[];
  progress: AssignmentProgress[];
}

export function HomeworkDetail({
  assignment,
  clips,
  progress: initialProgress,
}: HomeworkDetailProps) {
  const router = useRouter();
  const [activeClip, setActiveClip] = useState<Clip | null>(clips[0] ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialProgress);

  const completedIds = new Set(
    progress.filter((p) => p.completed_at).map((p) => p.clip_id)
  );

  useEffect(() => {
    if (!activeClip) return;
    const supabase = createClient();
    supabase.storage
      .from("clips")
      .createSignedUrl(activeClip.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setVideoUrl(data.signedUrl);
      });
  }, [activeClip]);

  async function markComplete(clipId: string) {
    const supabase = createClient();
    const existing = progress.find((p) => p.clip_id === clipId);

    if (existing?.completed_at) return;

    const { data, error } = await supabase
      .from("assignment_progress")
      .upsert(
        {
          assignment_id: assignment.id,
          clip_id: clipId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id,clip_id" }
      )
      .select()
      .single();

    if (!error && data) {
      setProgress((prev) => {
        const filtered = prev.filter((p) => p.clip_id !== clipId);
        return [...filtered, data as AssignmentProgress];
      });

      const allDone = clips.every(
        (c) => c.id === clipId || completedIds.has(c.id)
      );

      if (allDone) {
        await supabase
          .from("assignments")
          .update({ status: "completed" })
          .eq("id", assignment.id);
      } else {
        await supabase
          .from("assignments")
          .update({ status: "in_progress" })
          .eq("id", assignment.id);
      }

      router.refresh();
    }
  }

  const completedCount = clips.filter((c) => completedIds.has(c.id)).length;

  return (
    <>
      <PageHeader title={assignment.title} backHref="/homework" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {assignment.message && (
          <Card className="bg-orange-50 border-orange-200">
            <p className="text-sm text-orange-800">{assignment.message}</p>
          </Card>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">
            {completedCount}/{clips.length} completed
          </span>
          <Badge
            variant={
              completedCount === clips.length
                ? "green"
                : completedCount > 0
                  ? "blue"
                  : "orange"
            }
          >
            {completedCount === clips.length
              ? "done"
              : completedCount > 0
                ? "in progress"
                : "not started"}
          </Badge>
        </div>

        {activeClip && videoUrl && (
          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              playsInline
              className="aspect-video w-full"
            />
            <div className="bg-stone-900 px-4 py-3">
              <p className="font-medium text-white">{activeClip.title}</p>
              {activeClip.description && (
                <p className="text-sm text-stone-400">
                  {activeClip.description}
                </p>
              )}
              {!completedIds.has(activeClip.id) && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => markComplete(activeClip.id)}
                >
                  <Check className="h-4 w-4" /> Mark Complete
                </Button>
              )}
            </div>
          </div>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold">Drills</h3>
          <div className="space-y-2">
            {clips.map((clip, i) => {
              const done = completedIds.has(clip.id);
              const isActive = activeClip?.id === clip.id;
              return (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => setActiveClip(clip)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isActive
                      ? "border-orange-400 bg-orange-50"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold">
                    {done ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                    <Video className="h-4 w-4 text-stone-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-sm">
                      {clip.title}
                    </CardTitle>
                    <p className="text-xs text-stone-500">
                      {formatDuration(clip.duration_seconds)}
                    </p>
                  </div>
                  {isActive ? (
                    <Play className="h-4 w-4 shrink-0 text-orange-600" />
                  ) : done ? (
                    <Badge variant="green">done</Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
