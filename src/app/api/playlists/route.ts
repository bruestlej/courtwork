import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAddResource } from "@/lib/plans";
import { getTrainerUsage } from "@/lib/usage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") {
    return NextResponse.json(
      { error: "Only trainers can create playlists" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const usage = await getTrainerUsage(user.id, profile.subscription_status);
  const gate = canAddResource("playlists", usage.playlists, profile);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.message, upgrade: true }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      trainer_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to create playlist" },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
