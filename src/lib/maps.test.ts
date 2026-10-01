import { describe, expect, it } from "vitest";
import { buildMapEmbedUrl } from "./maps";

describe("buildMapEmbedUrl", () => {
  it("builds a keyless Google Maps embed URL with an exact zoom by default", () => {
    expect(buildMapEmbedUrl("Las Casas 4054, Boedo, CABA")).toBe(
      "https://www.google.com/maps?q=Las%20Casas%204054%2C%20Boedo%2C%20CABA&output=embed&z=16",
    );
  });

  it("zooms out for approximate locations", () => {
    expect(buildMapEmbedUrl("Palermo, CABA", "approximate")).toBe(
      "https://www.google.com/maps?q=Palermo%2C%20CABA&output=embed&z=14",
    );
  });
});
