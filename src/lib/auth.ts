import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

export async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) return profile as Profile;

  const ensured = await ensureProfile(user);
  if (!ensured) redirect("/login?error=profile");

  return ensured as Profile;
}

export async function requireTrainer(): Promise<Profile> {
  const profile = await getProfile();
  if (profile.role !== "trainer") redirect("/homework");
  return profile;
}

export async function requireClient(): Promise<Profile> {
  const profile = await getProfile();
  if (profile.role !== "client") redirect("/dashboard");
  return profile;
}
