"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    profile.subscription_status
  );
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("upgraded") !== "true") return;

    let cancelled = false;

    async function syncAfterUpgrade() {
      setSyncing(true);
      setSyncMessage("Confirming your Pro subscription…");

      try {
        const res = await fetch("/api/stripe/sync", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "active") {
          setSubscriptionStatus("active");
          setSyncMessage("Pro plan is now active.");
        } else {
          setSyncMessage(
            "Payment received, but Pro status isn’t active yet. Wait a few seconds and refresh, or ensure stripe listen is running."
          );
        }
        router.replace("/settings");
        router.refresh();
      } catch {
        if (!cancelled) {
          setSyncMessage("Could not confirm subscription. Try refreshing.");
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    syncAfterUpgrade();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

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
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setSyncMessage(data.error || "Checkout failed");
    setLoading(false);
  }

  async function handleRefreshStatus() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      if (data.status === "active") {
        setSubscriptionStatus("active");
        setSyncMessage("Pro plan is now active.");
      } else {
        setSubscriptionStatus(data.status || "free");
        setSyncMessage("Still on Free — no active Stripe subscription found.");
      }
      router.refresh();
    } catch {
      setSyncMessage("Could not refresh status.");
    } finally {
      setSyncing(false);
    }
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
              {subscriptionStatus === "active"
                ? "Pro plan active"
                : "Free plan"}
            </CardDescription>
            {syncMessage && (
              <p className="mt-2 text-xs text-stone-600">{syncMessage}</p>
            )}
            {subscriptionStatus !== "active" && (
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
                  disabled={loading || syncing}
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
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={handleRefreshStatus}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                </>
              ) : (
                "Refresh subscription status"
              )}
            </Button>
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
