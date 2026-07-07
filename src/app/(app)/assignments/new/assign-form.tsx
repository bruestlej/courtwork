"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import type { Playlist, Profile } from "@/types/database";

export default function AssignHomeworkPage({
  playlists,
  clients,
}: {
  playlists: Playlist[];
  clients: Profile[];
}) {
  const router = useRouter();
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id ?? "");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlist_id: playlistId,
        client_id: clientId,
        title: title || playlists.find((p) => p.id === playlistId)?.title,
        message: message || null,
        due_date: dueDate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to assign homework");
      setLoading(false);
      return;
    }

    router.push("/assignments");
    router.refresh();
  }

  return (
    <>
      <PageHeader title="Assign Homework" backHref="/assignments" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="space-y-2">
            <Label>Playlist</Label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="flex h-11 w-full rounded-xl border-2 border-stone-200 bg-white px-4 text-sm focus:border-orange-500 focus:outline-none"
              required
            >
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-11 w-full rounded-xl border-2 border-stone-200 bg-white px-4 text-sm focus:border-orange-500 focus:outline-none"
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week 3 Ball Handling"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Due Date (optional)</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Focus on your weak hand this week..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Assigning...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Assign & Notify
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
