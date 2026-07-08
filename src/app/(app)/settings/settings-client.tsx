"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, CreditCard, Loader2, ExternalLink } from "lucide-react";
import type { Profile } from "@/types/database";
import { PLANS } from "@/lib/stripe";
import { PLAN_COPY } from "@/lib/plans";

export default function SettingsPage({ profile }: { profile: Profile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    profile.subscription_status
  );
  const [syncMessage, setSyncMessage] = useState("");

  async function syncSubscription(message?: string) {
    setSyncing(true);
    if (message) setSyncMessage(message);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      const status = data.status || "free";
      setSubscriptionStatus(status);
      if (status === "active") {
        setSyncMessage("Pro plan is active.");
      } else if (!message) {
        setSyncMessage("You're on the Free plan.");
      }
      router.refresh();
    } catch {
      setSyncMessage("Could not refresh subscription status.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      syncSubscription("Confirming your Pro subscription…");
      router.replace("/settings");
    } else if (searchParams.get("billing") === "return") {
      syncSubscription("Updating your subscription…");
      router.replace("/settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  async function handleManageBilling() {
    setPortalLoading(true);
    setSyncMessage("");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setSyncMessage(data.error || "Could not open billing portal");
    setPortalLoading(false);
  }

  const isPro = subscriptionStatus === "active";

  return (
    <>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4 pb-8">
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
              {isPro ? "Pro plan active" : "Free plan"}
            </CardDescription>
            {syncMessage && (
              <p className="mt-2 text-xs text-stone-600">{syncMessage}</p>
            )}
            {!isPro && (
              <>
                <p className="mt-2 text-xs text-stone-500">
                  {PLAN_COPY.free.summary}
                </p>
                <ul className="mt-3 space-y-1">
                  {PLANS.free.features.map((f) => (
                    <li key={f} className="text-xs text-stone-600">
                      • {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-stone-700">
                  Pro includes:
                </p>
                <ul className="mt-1 space-y-1">
                  {PLANS.pro.features.map((f) => (
                    <li key={f} className="text-xs text-stone-600">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-3 w-full"
                  onClick={handleUpgrade}
                  disabled={loading || syncing || portalLoading}
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
            {isPro && (
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={handleManageBilling}
                disabled={portalLoading || syncing}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" /> Manage subscription
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => syncSubscription()}
              disabled={syncing || portalLoading}
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

        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </>
  );
}
