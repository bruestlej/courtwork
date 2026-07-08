import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FREE_LIMITS, PLAN_COPY } from "@/lib/plans";
import {
  Video,
  ListMusic,
  Send,
  BarChart3,
  Smartphone,
  Check,
  Minus,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Clip Library",
    description: "Upload and organize training drill videos",
  },
  {
    icon: ListMusic,
    title: "Drag & Drop Playlists",
    description: "Build custom homework sequences in seconds",
  },
  {
    icon: Send,
    title: "Assign to Clients",
    description: "Send homework with due dates and notes",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "See which drills your athletes complete",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Built for the court — works on any phone",
  },
];

type PlanRow = {
  label: string;
  shortLabel?: string;
  free: string | boolean;
  pro: string | boolean;
};

const planRows: PlanRow[] = [
  {
    label: "Clients",
    free: String(FREE_LIMITS.clients),
    pro: "Unlimited",
  },
  {
    label: "Clips",
    free: String(FREE_LIMITS.clips),
    pro: "Unlimited",
  },
  {
    label: "Playlists",
    free: String(FREE_LIMITS.playlists),
    pro: "Unlimited",
  },
  {
    label: "Homework assignments",
    shortLabel: "Homework",
    free: true,
    pro: true,
  },
  {
    label: "Progress tracking",
    shortLabel: "Progress",
    free: true,
    pro: true,
  },
  {
    label: "Email notifications",
    shortLabel: "Email alerts",
    free: false,
    pro: true,
  },
];

/** Feature column + two equal plan columns (aligned with CTA buttons below). */
const PLAN_GRID =
  "grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 sm:gap-x-3";

function PlanColumn({
  children,
  pro = false,
  className = "",
}: {
  children: ReactNode;
  pro?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 w-full overflow-hidden text-center ${
        pro ? "bg-orange-50/50" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function PlanCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className="mx-auto h-4 w-4 text-orange-600 sm:h-5 sm:w-5"
        aria-label="Included"
      />
    ) : (
      <Minus
        className="mx-auto h-4 w-4 text-stone-300 sm:h-5 sm:w-5"
        aria-label="Not included"
      />
    );
  }
  if (value === "Unlimited") {
    return (
      <>
        <span className="text-xs font-medium text-stone-900 sm:hidden">Unl.</span>
        <span className="hidden text-sm font-medium text-stone-900 sm:inline">
          Unlimited
        </span>
      </>
    );
  }
  return (
    <span className="text-xs font-medium text-stone-900 sm:text-sm">{value}</span>
  );
}

function FeatureLabel({ label, shortLabel }: { label: string; shortLabel?: string }) {
  if (shortLabel) {
    return (
      <>
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </>
    );
  }
  return <>{label}</>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="safe-area-top border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-xl">🏀</span>
            <span className="truncate font-bold text-stone-900">CourtWork</span>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="touch-manipulation px-2 sm:px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="touch-manipulation">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <section className="py-10 text-center sm:py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Homework playlists for{" "}
            <span className="text-orange-600">basketball trainers</span>
          </h1>
          <p className="mt-4 text-sm text-stone-600 sm:text-base">
            Drag-and-drop video clips into custom workout playlists. Assign
            homework to your clients and track their progress — all from your
            phone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full touch-manipulation sm:w-auto">
                Start free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full touch-manipulation sm:w-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-3 pb-12 sm:pb-16">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <Icon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="text-sm text-stone-500">{description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-12 sm:mb-16">
          <div className="text-center">
            <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
              Simple pricing
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Start free. Upgrade when you outgrow the limits.
            </p>
          </div>

          <div
            className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            aria-label="Free and Pro plan comparison"
          >
            {/* Header */}
            <div
              className={`${PLAN_GRID} border-b border-stone-200 bg-stone-50 px-2 py-3 text-sm sm:px-3 sm:py-4`}
            >
              <div aria-hidden />
              <PlanColumn>
                <div className="text-xs font-bold text-stone-900 sm:text-sm">
                  {PLAN_COPY.free.name}
                </div>
                <div className="mt-0.5 text-lg font-extrabold text-stone-900 sm:mt-1 sm:text-2xl">
                  $0
                </div>
                <div className="text-[10px] text-stone-500 sm:text-xs">forever</div>
              </PlanColumn>
              <PlanColumn pro className="rounded-tl-lg bg-orange-50">
                <div className="text-xs font-bold text-orange-700 sm:text-sm">
                  {PLAN_COPY.pro.name}
                </div>
                <div className="mt-0.5 text-lg font-extrabold text-stone-900 sm:mt-1 sm:text-2xl">
                  $29
                </div>
                <div className="text-[10px] text-stone-500 sm:text-xs">per month</div>
              </PlanColumn>
            </div>

            {/* Feature rows */}
            {planRows.map((row, index) => (
              <div
                key={row.label}
                className={`${PLAN_GRID} items-center px-2 text-xs sm:px-3 sm:text-sm ${
                  index < planRows.length - 1 ? "border-b border-stone-100" : ""
                }`}
              >
                <div
                  className="min-w-0 py-2.5 leading-snug text-stone-600 sm:py-3.5"
                  title={row.shortLabel ? row.label : undefined}
                >
                  <FeatureLabel label={row.label} shortLabel={row.shortLabel} />
                </div>
                <PlanColumn className="py-2.5 sm:py-3.5">
                  <PlanCell value={row.free} />
                </PlanColumn>
                <PlanColumn pro className="py-2.5 sm:py-3.5">
                  <PlanCell value={row.pro} />
                </PlanColumn>
              </div>
            ))}

            {/* CTAs share the same grid columns as Free / Pro */}
            <div
              className={`${PLAN_GRID} border-t border-stone-200 bg-stone-50 px-2 py-3 sm:px-3 sm:py-4`}
            >
              <div aria-hidden />
              <Link href="/signup" className="min-w-0">
                <Button
                  variant="outline"
                  className="h-11 w-full touch-manipulation text-sm sm:h-10"
                >
                  Start free
                </Button>
              </Link>
              <Link href="/signup" className="min-w-0">
                <Button className="h-11 w-full touch-manipulation text-sm sm:h-10">
                  Get Pro
                </Button>
              </Link>
            </div>
          </div>

          <p className="mt-4 px-1 text-center text-xs leading-relaxed text-stone-500">
            Clients never pay — only trainers subscribe. Upgrade to Pro anytime
            from Settings.
          </p>
        </section>
      </main>
    </div>
  );
}
