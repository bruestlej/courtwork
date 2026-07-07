import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function ensureProfile(user: User): Promise<Profile | null> {
  const role: UserRole =
    user.user_metadata?.role === "client" ? "client" : "trainer";

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? "",
        role,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) return null;
  return data as Profile;
}

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

  return ensured;
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
