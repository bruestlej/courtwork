import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrainerUsage } from "@/lib/usage";

function MeterBar({
  label,
  used,
  limit,
  unlimited,
}: {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
}) {
  const pct = unlimited ? 100 : Math.min(100, (used / limit) * 100);
  const atLimit = !unlimited && used >= limit;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-700">{label}</span>
        <span className={atLimit ? "font-medium text-orange-600" : "text-stone-500"}>
          {unlimited ? `${used} · unlimited` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? "bg-orange-500" : "bg-orange-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageMeter({ usage }: { usage: TrainerUsage }) {
  if (usage.isPro) return null;

  return (
    <Card>
      <CardTitle className="text-sm">Free plan usage</CardTitle>
      <CardDescription className="mt-1">
        Upgrade to Pro for unlimited clients, clips, and playlists.
      </CardDescription>
      <div className="mt-4 space-y-3">
        <MeterBar
          label="Clients"
          used={usage.clients}
          limit={usage.limits.clients}
          unlimited={false}
        />
        <MeterBar
          label="Clips"
          used={usage.clips}
          limit={usage.limits.clips}
          unlimited={false}
        />
        <MeterBar
          label="Playlists"
          used={usage.playlists}
          limit={usage.limits.playlists}
          unlimited={false}
        />
      </div>
      <Link href="/settings" className="mt-4 block">
        <Button size="sm" className="w-full">
          Upgrade to Pro — $29/mo
        </Button>
      </Link>
    </Card>
  );
}
