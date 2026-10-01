const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Public origin of the site (canonical URLs, sitemap, Open Graph). Read at
 * runtime from `SITE_URL` (set by the production compose from `SITE_DOMAIN`),
 * so one Docker image serves any domain.
 */
export function getSiteUrl(): string {
  const value = process.env.SITE_URL?.trim();
  if (!value) return FALLBACK_SITE_URL;
  try {
    return new URL(value).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function absoluteUrl(path: `/${string}`): string {
  return `${getSiteUrl()}${path}`;
}

/**
 * Href for a public-site page. The admin runs on its own host when
 * `ADMIN_URL` is set, so a relative `/propiedades/...` would resolve on the
 * admin host; return an absolute `SITE_URL` link then. Without `ADMIN_URL`
 * (local dev) keep the relative path.
 */
export function publicSiteHref(path: `/${string}`): string {
  return process.env.ADMIN_URL?.trim() ? absoluteUrl(path) : path;
}
