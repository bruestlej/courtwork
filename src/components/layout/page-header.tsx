import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="safe-area-top sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-stone-100 active:bg-stone-200"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-stone-900">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-stone-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
