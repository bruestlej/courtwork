"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const lastCapturedUrl = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname || !posthog) return;

    let url = window.origin + pathname;
    if (search) {
      url += `?${search}`;
    }

    if (lastCapturedUrl.current === url) return;
    lastCapturedUrl.current = url;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, search, posthog]);

  return null;
}
