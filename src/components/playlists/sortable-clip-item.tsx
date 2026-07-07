"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Video } from "lucide-react";
import type { Clip } from "@/types/database";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SortableClipItem({
  clip,
  onRemove,
  isInPlaylist = true,
}: {
  clip: Clip;
  onRemove?: () => void;
  isInPlaylist?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-white p-3 shadow-sm",
        isDragging && "z-50 opacity-80 shadow-lg",
        isInPlaylist ? "border-orange-200" : "border-stone-200"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-stone-400 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
        <Video className="h-4 w-4 text-orange-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{clip.title}</p>
        <p className="text-xs text-stone-500">
          {formatDuration(clip.duration_seconds)}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function DraggableLibraryClip({
  clip,
  onAdd,
}: {
  clip: Clip;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-left transition-colors hover:border-orange-300 hover:bg-orange-50 active:scale-[0.98]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
        <Video className="h-4 w-4 text-stone-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{clip.title}</p>
        <p className="text-xs text-stone-500">
          {formatDuration(clip.duration_seconds)}
        </p>
      </div>
      <span className="text-xs font-medium text-orange-600">+ Add</span>
    </button>
  );
}
