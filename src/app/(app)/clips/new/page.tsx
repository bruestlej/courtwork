"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";

export default function NewClipPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("Video must be under 100MB");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Session expired. Please sign in again.");
        return;
      }

      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("clips")
        .upload(path, file, {
          upsert: false,
          contentType: file.type || "video/mp4",
        });

      if (uploadError) {
        const message = uploadError.message.toLowerCase();
        if (message.includes("bucket") || message.includes("not found")) {
          setError(
            "Storage is not set up. Run supabase/migrations/002_storage_clips.sql in the Supabase SQL editor."
          );
        } else if (
          message.includes("policy") ||
          message.includes("row-level security") ||
          message.includes("denied")
        ) {
          setError(
            "Upload permission denied. Run supabase/migrations/002_storage_clips.sql in the Supabase SQL editor."
          );
        } else {
          setError(uploadError.message);
        }
        return;
      }

      const { error: dbError } = await supabase.from("clips").insert({
        trainer_id: user.id,
        title,
        description: description || null,
        storage_path: path,
      });

      if (dbError) {
        await supabase.storage.from("clips").remove([path]);
        setError(dbError.message);
        return;
      }

      window.location.href = "/clips";
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Upload Clip" backHref="/clips" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card
            className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-stone-300 py-10 transition-colors hover:border-orange-400"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                }
              }}
            />
            {file ? (
              <>
                <Upload className="h-8 w-8 text-orange-600" />
                <p className="mt-2 text-sm font-medium">{file.name}</p>
                <p className="text-xs text-stone-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-stone-400" />
                <p className="mt-2 text-sm font-medium text-stone-600">
                  Tap to select video
                </p>
                <p className="text-xs text-stone-400">MP4, MOV up to 100MB</p>
              </>
            )}
          </Card>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Crossover drill"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Focus on keeping the ball low..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Upload Clip"
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
