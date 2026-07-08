/** Canonical app origin for Supabase auth redirects (must match Supabase allow list). */
export function getAppOrigin(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getAuthCallbackUrl(
  nextPath: string,
  fallbackOrigin?: string
): string {
  const origin = getAppOrigin(fallbackOrigin);
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
