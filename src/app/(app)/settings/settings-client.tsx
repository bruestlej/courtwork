"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, CreditCard, Loader2 } from "lucide-react";
import type { Profile } from "@/types/database";
import { PLANS } from "@/lib/stripe";

export default function SettingsPage({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Card>
          <CardTitle className="text-sm">Account</CardTitle>
          <CardDescription className="mt-1">
            {profile.full_name || "No name set"}
          </CardDescription>
          <p className="text-sm text-stone-500">{profile.email}</p>
          <Badge variant="orange" className="mt-2 capitalize">
            {profile.role}
          </Badge>
        </Card>

        {profile.role === "trainer" && (
          <Card>
            <CardTitle className="text-sm">Subscription</CardTitle>
            <CardDescription className="mt-1">
              {profile.subscription_status === "active"
                ? "Pro plan active"
                : "Free plan"}
            </CardDescription>
            {profile.subscription_status !== "active" && (
              <>
                <ul className="mt-3 space-y-1">
                  {PLANS.pro.features.map((f) => (
                    <li key={f} className="text-xs text-stone-600">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-3 w-full"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" /> Upgrade to Pro — $29/mo
                    </>
                  )}
                </Button>
              </>
            )}
          </Card>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </>
  );
}
