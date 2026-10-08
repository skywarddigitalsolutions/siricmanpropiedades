import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("next.config redirects", () => {
  it("sends the legacy /tasaciones URL to /vender permanently", async () => {
    const redirects = await nextConfig.redirects!();

    expect(redirects).toContainEqual({
      source: "/tasaciones",
      destination: "/vender",
      permanent: true,
    });
  });
});
