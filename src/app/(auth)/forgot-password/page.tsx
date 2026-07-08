"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl(
      "/reset-password",
      window.location.origin
    );

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo }
    );

    if (resetError) {
      const msg = resetError.message.toLowerCase();
      if (msg.includes("redirect") || msg.includes("url")) {
        setError(
          "Redirect URL not allowed in Supabase. Add your app URL under Authentication → URL Configuration → Redirect URLs."
        );
      } else {
        setError(resetError.message);
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-2xl">
          🏀
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Reset password</h1>
        <p className="text-sm text-stone-500">
          We&apos;ll email you a link to choose a new password
        </p>
      </div>

      <Card className="w-full max-w-sm">
        {sent ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-stone-700">
              If an account exists for{" "}
              <span className="font-medium">{email.trim()}</span>, you&apos;ll
              get a reset link shortly.
            </p>
            <p className="text-xs text-stone-500">
              Check spam/junk. Supabase sends from{" "}
              <span className="font-mono">noreply@mail.app.supabase.io</span>.
            </p>
            <div className="rounded-xl bg-stone-100 px-3 py-2 text-left text-xs text-stone-600">
              <p className="font-medium text-stone-700">Still nothing?</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Use the exact email you signed up with</li>
                <li>
                  Supabase free tier limits auth emails (~2/hour) — wait and
                  retry
                </li>
                <li>
                  In Supabase → Authentication → Logs, check for a
                  &quot;recovery&quot; event
                </li>
                <li>
                  Add{" "}
                  <span className="font-mono break-all">
                    {getAuthCallbackUrl("/reset-password", typeof window !== "undefined" ? window.location.origin : undefined)}
                  </span>{" "}
                  to Redirect URLs
                </li>
              </ul>
            </div>
            <Link href="/login">
              <Button className="mt-2 w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-stone-500">
              <Link href="/login" className="font-medium text-orange-600">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
