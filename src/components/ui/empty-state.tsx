import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-stone-300" />
      <p className="mt-3 text-sm font-medium text-stone-700">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-xs text-stone-500">
          {description}
        </p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref}>
          <Button size="sm" className="mt-4">
            {actionLabel}
          </Button>
        </Link>
      )}
    </Card>
  );
}
