import "server-only";
import { renderSVG } from "uqr";

/**
 * Renders `otpauthUrl` as a self-contained SVG QR code, embedded as a
 * `data:image/svg+xml;base64,...` URI (ADR-9). Rendering runs entirely
 * in-process — `uqr` is a zero-dependency, offline QR encoder — so the
 * otpauth secret never leaves the server or reaches a third party.
 *
 * Substitution recorded by task 4.1: `design.md` ADR-9 names `qrcode` as
 * the primary choice, with `uqr` as an explicit fallback "if `qrcode`'s
 * transitive dependencies are objectionable". `npm view qrcode
 * dependencies` shows `pngjs`, `yargs`, and `dijkstrajs` — `yargs` alone is
 * a CLI argument parser pulled in only for `qrcode`'s bin script, not for
 * `QRCode.toString`, and it drags its own multi-package tree along.
 * `uqr` adds zero dependencies and exports `renderSVG` directly, so it is
 * used here instead; the produced artifact (an SVG data URI) is identical
 * in shape and in every guarantee ADR-9 requires.
 */
export async function renderQrDataUri(otpauthUrl: string): Promise<string> {
  const svg = renderSVG(otpauthUrl, { ecc: "M", border: 1 });
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}
