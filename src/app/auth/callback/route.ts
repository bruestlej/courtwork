import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email confirmation / magic-link redirects.
 * Configure in Supabase Auth → URL Configuration:
 *   Site URL: your app URL
 *   Redirect URLs: {APP_URL}/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = data.user.user_metadata?.role;
      const destination =
        next || (role === "client" ? "/homework" : "/dashboard");
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Fallback: confirmation succeeded but no session code (confirm-then-login)
  if (searchParams.get("type") === "signup" || searchParams.has("token_hash")) {
    return NextResponse.redirect(`${origin}/login?confirmed=1`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
