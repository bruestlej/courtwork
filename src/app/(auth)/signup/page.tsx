"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"trainer" | "client">("trainer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsConfirmation(false);

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName.trim(), role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, Supabase may return a user with no session
    if (!data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    window.location.href = role === "client" ? "/homework" : "/dashboard";
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-8">
        <Card className="w-full max-w-sm space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl">
            ✉️
          </div>
          <h1 className="text-xl font-bold text-stone-900">Check your email</h1>
          <p className="text-sm text-stone-600">
            We sent a confirmation link to{" "}
            <span className="font-medium text-stone-900">{email.trim()}</span>.
            Open it to activate your account, then sign in.
          </p>
          <p className="text-xs text-stone-500">
            Didn&apos;t get it? Check spam, or wait a minute and try signing up
            again.
          </p>
          <Link href="/login">
            <Button className="mt-2 w-full">Go to Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-2xl">
          🏀
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Join CourtWork</h1>
        <p className="text-sm text-stone-500">Create your account</p>
      </div>

      <Card className="w-full max-w-sm">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["trainer", "client"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                    role === r
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Coach Smith"
              required
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-600">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
