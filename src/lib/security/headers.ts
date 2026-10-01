// Pure builders for the security headers. No `server-only` import: they run
// in `src/proxy.ts` and in `next.config.ts`.

export type SecurityHeader = { key: string; value: string };

export type CspOptions = {
  /** Per-request nonce. Without one, `script-src` falls back to `'unsafe-inline'`. */
  nonce?: string;
  isDev: boolean;
  /** Admin pages must never be framed. */
  isAdmin: boolean;
  /** Extra `img-src` sources (the API media origin). */
  imgSources: string[];
};

/** Headers that do not depend on the request (set from `next.config.ts`). */
export function getStaticSecurityHeaders(options: {
  isProduction: boolean;
}): SecurityHeader[] {
  const headers: SecurityHeader[] = [];
  if (options.isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }
  headers.push(
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  );
  return headers;
}

/**
 * Content-Security-Policy for one response. Next needs inline scripts for
 * hydration data, so scripts use either a nonce (+ `'strict-dynamic'`) or
 * `'unsafe-inline'`; styles stay `'unsafe-inline'` (React/Next inline styles).
 */
export function buildCsp(options: CspOptions): string {
  const { nonce, isDev, isAdmin, imgSources } = options;

  const scriptSrc = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : ["'self'", "'unsafe-inline'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  const connectSrc = isDev ? ["'self'", "ws:", "wss:"] : ["'self'"];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${["'self'", "data:", "blob:", ...imgSources].join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src https://www.google.com https://maps.google.com",
    `frame-ancestors ${isAdmin ? "'none'" : "'self'"}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directives.join("; ");
}

function toOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * `img-src` sources for property photos (served by the API under `/media`).
 * Production: `MEDIA_ORIGIN` if set, otherwise `https://api.<SITE_URL host>`
 * (the deploy layout), otherwise any `https:` image.
 */
export function getImgSources(options: {
  isDev: boolean;
  siteUrl?: string;
  mediaOrigin?: string;
}): string[] {
  if (options.isDev) return ["http:", "https:"];

  const explicit = toOrigin(options.mediaOrigin);
  if (explicit) return [explicit];

  const site = toOrigin(options.siteUrl);
  if (site) {
    const { protocol, hostname } = new URL(site);
    if (protocol === "https:" && hostname !== "localhost") {
      return [`https://api.${hostname.replace(/^www\./, "")}`];
    }
  }
  return ["https:"];
}
