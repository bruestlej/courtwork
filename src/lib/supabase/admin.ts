import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";

/** Service-role client — use only for webhooks, billing sync, and profile bootstrap. */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureProfile(user: User) {
  const role = user.user_metadata?.role === "client" ? "client" : "trainer";

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: (user.email ?? "").toLowerCase(),
        full_name: user.user_metadata?.full_name ?? "",
        role,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) return null;
  return data;
}
