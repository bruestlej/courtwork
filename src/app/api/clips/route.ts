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
    return NextResponse.json({ error: "Only trainers can upload clips" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, storage_path, duration_seconds } = body;

  if (!title || !storage_path) {
    return NextResponse.json(
      { error: "Title and storage path are required" },
      { status: 400 }
    );
  }

  if (!storage_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }

  const usage = await getTrainerUsage(user.id, profile.subscription_status);
  const gate = canAddResource("clips", usage.clips, profile);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.message, upgrade: true }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("clips")
    .insert({
      trainer_id: user.id,
      title,
      description: description || null,
      storage_path,
      duration_seconds: duration_seconds ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
