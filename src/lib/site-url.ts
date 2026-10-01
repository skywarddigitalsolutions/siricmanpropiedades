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
