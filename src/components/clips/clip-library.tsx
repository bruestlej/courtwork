"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Video, X } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Clip } from "@/types/database";

interface ClipLibraryProps {
  clips: Clip[];
}

export function ClipLibrary({ clips: initialClips }: ClipLibraryProps) {
  const [clips, setClips] = useState(initialClips);
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeClip) {
      setVideoUrl(null);
      return;
    }

    let cancelled = false;
    setLoadingUrl(true);
    setError("");

    const supabase = createClient();
    supabase.storage
      .from("clips")
      .createSignedUrl(activeClip.storage_path, 3600)
      .then(({ data, error: signError }) => {
        if (cancelled) return;
        setLoadingUrl(false);
        if (signError || !data?.signedUrl) {
          setError("Could not load video. Check storage permissions.");
          setVideoUrl(null);
          return;
        }
        setVideoUrl(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClip]);

  async function handleLoadedMetadata(
    e: React.SyntheticEvent<HTMLVideoElement>
  ) {
    if (!activeClip) return;
    const duration = e.currentTarget.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (activeClip.duration_seconds) return;

    const seconds = Math.round(duration);
    setClips((prev) =>
      prev.map((c) =>
        c.id === activeClip.id ? { ...c, duration_seconds: seconds } : c
      )
    );
    setActiveClip((prev) =>
      prev ? { ...prev, duration_seconds: seconds } : prev
    );

    const supabase = createClient();
    await supabase
      .from("clips")
      .update({ duration_seconds: seconds })
      .eq("id", activeClip.id);
  }

  return (
    <div className="space-y-4">
      {activeClip && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between bg-stone-900 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">
              {activeClip.title}
            </p>
            <button
              type="button"
              onClick={() => setActiveClip(null)}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {loadingUrl && (
            <div className="flex aspect-video items-center justify-center bg-black text-sm text-stone-400">
              Loading video...
            </div>
          )}
          {error && (
            <div className="bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {videoUrl && !loadingUrl && (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full bg-black"
              onLoadedMetadata={handleLoadedMetadata}
            />
          )}
          {activeClip.description && (
            <p className="px-4 py-3 text-sm text-stone-600">
              {activeClip.description}
            </p>
          )}
        </Card>
      )}

      <div className="space-y-2">
        {clips.map((clip) => {
          const isActive = activeClip?.id === clip.id;
          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => setActiveClip(clip)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                isActive
                  ? "border-orange-400 bg-orange-50"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                {isActive ? (
                  <Play className="h-5 w-5 text-orange-600" />
                ) : (
                  <Video className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm">{clip.title}</CardTitle>
                <CardDescription>
                  {formatDuration(clip.duration_seconds)}
                  {clip.description && ` · ${clip.description.slice(0, 40)}`}
                </CardDescription>
              </div>
              <Play className="h-4 w-4 shrink-0 text-stone-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
