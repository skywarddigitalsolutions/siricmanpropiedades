// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makePublicProperty } from "@/test/fixtures/public-property";

const { listPublicProperties } = vi.hoisted(() => ({ listPublicProperties: vi.fn() }));
vi.mock("@/lib/api/public-catalog", () => ({ listPublicProperties }));

import { ApiError } from "@/lib/api/client";
import { rootMetadata } from "@/lib/seo/root-metadata";
import robots from "./robots";
import sitemap from "./sitemap";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SITE_URL", "https://siricman.com.ar");
});
afterEach(() => vi.unstubAllEnvs());

describe("robots", () => {
  it("keeps the admin panel out and points to the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/admin" },
      sitemap: "https://siricman.com.ar/sitemap.xml",
    });
  });
});

describe("sitemap", () => {
  it("lists the landing pages and every published property, page by page", async () => {
    listPublicProperties
      .mockResolvedValueOnce({
        items: Array.from({ length: 50 }, (_, n) =>
          makePublicProperty({ slug: `p-${n}`, publishedAt: "2026-09-01T00:00:00.000Z" }),
        ),
        total: 51,
      })
      .mockResolvedValueOnce({ items: [makePublicProperty({ slug: "p-50" })], total: 51 });

    const entries = await sitemap();

    expect(listPublicProperties).toHaveBeenNthCalledWith(1, { limit: 50, offset: 0 });
    expect(listPublicProperties).toHaveBeenNthCalledWith(2, { limit: 50, offset: 50 });
    expect(entries.map((entry) => entry.url).slice(0, 6)).toEqual([
      "https://siricman.com.ar/",
      "https://siricman.com.ar/propiedades",
      "https://siricman.com.ar/propiedades?operacion=venta",
      "https://siricman.com.ar/propiedades?operacion=alquiler",
      "https://siricman.com.ar/tasaciones",
      "https://siricman.com.ar/contacto",
    ]);
    expect(entries).toHaveLength(6 + 51);
    expect(entries[6]).toMatchObject({
      url: "https://siricman.com.ar/propiedades/p-0",
      lastModified: "2026-09-01T00:00:00.000Z",
    });
  });

  it("still serves the landing pages when the catalog is unavailable", async () => {
    listPublicProperties.mockRejectedValue(new ApiError(0, "down"));

    expect(await sitemap()).toHaveLength(6);
  });
});

describe("root metadata", () => {
  it("sets the site URL, a title template and Spanish Open Graph defaults", () => {
    const metadata = rootMetadata();

    expect(metadata.metadataBase?.toString()).toBe("https://siricman.com.ar/");
    expect(metadata.title).toEqual({
      default: "Siricman Propiedades | Venta y alquiler en CABA",
      template: "%s | Siricman Propiedades",
    });
    expect(metadata.openGraph).toMatchObject({ siteName: "Siricman Propiedades", locale: "es_AR" });
  });
});
