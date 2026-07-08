"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  ListMusic,
  Users,
  ClipboardList,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const trainerNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/clips", label: "Clips", icon: Video },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/assignments", label: "Homework", icon: ClipboardList },
];

const clientNav = [
  { href: "/homework", label: "Homework", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav({ role }: { role: "trainer" | "client" }) {
  const pathname = usePathname();
  const items = role === "trainer" ? trainerNav : clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-lg safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors touch-manipulation",
                active
                  ? "text-orange-600"
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
