// Host-based routing between the public site and the admin panel. Pure so the
// proxy can stay thin; no `server-only` import (used from `src/proxy.ts`).

export type HostDecision =
  | { action: "next" }
  | { action: "redirect"; url: string };

type HostRoutingInput = {
  /** Request host (`Host` / `X-Forwarded-Host`), possibly with a port. */
  host: string;
  pathname: string;
  search: string;
  /** `ADMIN_URL`; when unset or invalid no host logic applies (local dev). */
  adminUrl?: string;
  /** Public site origin (`SITE_URL`). */
  siteUrl?: string;
};

function parseUrl(value: string | undefined): URL | undefined {
  if (!value?.trim()) return undefined;
  try {
    return new URL(value.trim());
  } catch {
    return undefined;
  }
}

/** First entry of a possibly comma-separated forwarded host, lowercased. */
function normalizeHost(host: string): string {
  return host.split(",")[0].trim().toLowerCase();
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * - Admin host: `/admin*` is served, `/` goes to `/admin`, everything else
 *   goes to the same path on the site.
 * - Any other host: `/admin*` goes to the admin host (same path and query).
 */
export function decideHostRouting(input: HostRoutingInput): HostDecision {
  const admin = parseUrl(input.adminUrl);
  if (!admin) return { action: "next" };

  const { pathname, search } = input;
  const onAdminHost = normalizeHost(input.host) === admin.host.toLowerCase();

  if (onAdminHost) {
    if (isAdminPath(pathname)) return { action: "next" };
    if (pathname === "/") {
      return { action: "redirect", url: `${admin.origin}/admin` };
    }
    const site = parseUrl(input.siteUrl);
    if (!site) return { action: "next" };
    return { action: "redirect", url: `${site.origin}${pathname}${search}` };
  }

  if (isAdminPath(pathname)) {
    return { action: "redirect", url: `${admin.origin}${pathname}${search}` };
  }
  return { action: "next" };
}
