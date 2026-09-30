import "server-only";
import { isIP } from "node:net";

/**
 * Extracts the real client IP from an inbound request's `X-Forwarded-For`
 * header, per ADR-4: Caddy sets this header to the connecting client's IP
 * and ignores any client-supplied value (no `trusted_proxies` configured),
 * so the rightmost entry is the one hop we trust.
 *
 * Returns `undefined` (and logs a warning without the raw header value) when
 * the header is missing, empty, or its rightmost entry is not a valid IPv4
 * or IPv6 address.
 */
export function getClientIp(headers: Headers): string | undefined {
  const rawHeader = headers.get("x-forwarded-for");
  if (!rawHeader) {
    console.warn("getClientIp: X-Forwarded-For header is missing");
    return undefined;
  }

  const entries = rawHeader.split(",").map((entry) => entry.trim());
  const rightmost = entries.at(-1);

  if (!rightmost || isIP(rightmost) === 0) {
    console.warn("getClientIp: X-Forwarded-For header has no valid IP entry");
    return undefined;
  }

  return rightmost;
}
