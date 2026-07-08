import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase email links (confirm signup, password recovery).
 * Configure in Supabase → Authentication → URL Configuration:
 *   Site URL: https://courtwork.vercel.app
 *   Redirect URLs:
 *     - https://courtwork.vercel.app/**
 *     - http://localhost:3000/**
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Password recovery should always land on reset form
      if (type === "recovery" || next === "/reset-password") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const role = data.user.user_metadata?.role;
      const destination =
        next || (role === "client" ? "/homework" : "/dashboard");
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (searchParams.get("type") === "signup" || searchParams.has("token_hash")) {
    return NextResponse.redirect(`${origin}/login?confirmed=1`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
