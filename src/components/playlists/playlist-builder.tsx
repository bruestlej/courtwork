"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  SortableClipItem,
  DraggableLibraryClip,
} from "@/components/playlists/sortable-clip-item";
import type { Clip } from "@/types/database";
import { Loader2, ListMusic } from "lucide-react";

interface PlaylistBuilderProps {
  clips: Clip[];
  playlistId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialClipIds?: string[];
}

export function PlaylistBuilder({
  clips,
  playlistId,
  initialTitle = "",
  initialDescription = "",
  initialClipIds = [],
}: PlaylistBuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [playlistClips, setPlaylistClips] = useState<Clip[]>(() =>
    initialClipIds
      .map((id) => clips.find((c) => c.id === id))
      .filter(Boolean) as Clip[]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const availableClips = clips.filter(
    (c) => !playlistClips.some((pc) => pc.id === c.id)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPlaylistClips((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function addClip(clip: Clip) {
    setPlaylistClips((prev) => [...prev, clip]);
  }

  function removeClip(clipId: string) {
    setPlaylistClips((prev) => prev.filter((c) => c.id !== clipId));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Please enter a playlist title");
      return;
    }
    if (playlistClips.length === 0) {
      setError("Add at least one clip to the playlist");
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let id = playlistId;

    if (id) {
      await supabase
        .from("playlists")
        .update({ title, description: description || null })
        .eq("id", id);

      await supabase.from("playlist_items").delete().eq("playlist_id", id);
    } else {
      const createRes = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(
          createData.upgrade
            ? `${createData.error} Go to Settings to upgrade.`
            : createData.error || "Failed to create playlist"
        );
        setLoading(false);
        return;
      }
      id = createData.id;
    }

    const items = playlistClips.map((clip, index) => ({
      playlist_id: id!,
      clip_id: clip.id,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from("playlist_items")
      .insert(items);

    if (itemsError) {
      setError(itemsError.message);
      setLoading(false);
      return;
    }

    router.push("/playlists");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Playlist Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ball Handling Week 1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Focus on weak-hand dribbling..."
          />
        </div>
      </div>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900">
          <ListMusic className="h-4 w-4 text-orange-600" />
          Playlist ({playlistClips.length} clips)
        </h3>
        {playlistClips.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={playlistClips.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {playlistClips.map((clip) => (
                  <SortableClipItem
                    key={clip.id}
                    clip={clip}
                    onRemove={() => removeClip(clip.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <Card className="border-dashed py-8 text-center">
            <p className="text-sm text-stone-500">
              Tap + Add below to add clips, then drag by the grip to reorder
            </p>
          </Card>
        )}
      </section>

      {availableClips.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-900">
            Clip Library
          </h3>
          <div className="space-y-2">
            {availableClips.map((clip) => (
              <DraggableLibraryClip
                key={clip.id}
                clip={clip}
                onAdd={() => addClip(clip)}
              />
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleSave} className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : playlistId ? (
          "Update Playlist"
        ) : (
          "Create Playlist"
        )}
      </Button>
    </div>
  );
}
