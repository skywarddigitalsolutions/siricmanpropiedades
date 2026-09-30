// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderQrDataUri } from "./qr";

const OTPAUTH_URL =
  "otpauth://totp/BaseAuth:gabriel?secret=JBSWY3DPEHPK3PXP&issuer=BaseAuth";

describe("renderQrDataUri", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a base64-encoded SVG data URI", async () => {
    const dataUri = await renderQrDataUri(OTPAUTH_URL);

    expect(dataUri.startsWith("data:image/svg+xml;base64,")).toBe(true);

    const base64 = dataUri.replace("data:image/svg+xml;base64,", "");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    expect(decoded).toContain("<svg");
  });

  it("makes no outbound network call — the secret never leaves the server", async () => {
    await renderQrDataUri(OTPAUTH_URL);

    expect(fetch).not.toHaveBeenCalled();
  });
});
