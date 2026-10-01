import { describe, expect, it } from "vitest";
import { makePropertyDetail } from "@/test/fixtures/property";
import { toPublicPropertyDetail } from "./preview";

describe("toPublicPropertyDetail", () => {
  it("maps the admin property to the public shape the detail view renders", () => {
    const result = toPublicPropertyDetail(
      makePropertyDetail({
        firstPublishedAt: "2026-09-01T12:00:00.000Z",
        images: [
          {
            id: "i1",
            position: 0,
            url: "https://media.test/1.webp",
            width: 1600,
            height: 1200,
            thumbnailUrl: "https://media.test/1-t.webp",
            thumbnailWidth: 480,
            thumbnailHeight: 360,
            createdAt: "2024-01-01",
          },
        ],
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: "p1",
        code: "SP-0001",
        slug: "casa-en-palermo",
        title: "Casa en Palermo",
        neighborhood: { name: "Palermo", slug: "palermo" },
        address: "Av. Siempre Viva 123",
        publishedAt: "2026-09-01T12:00:00.000Z",
        services: {
          water: true,
          naturalGas: true,
          sewer: true,
          electricity: true,
          internet: true,
        },
      }),
    );
    expect(result.images).toEqual([
      {
        url: "https://media.test/1.webp",
        width: 1600,
        height: 1200,
        thumbnailUrl: "https://media.test/1-t.webp",
        thumbnailWidth: 480,
        thumbnailHeight: 360,
      },
    ]);
  });

  it("hides the address when the property does not show it, like the public API", () => {
    const result = toPublicPropertyDetail(makePropertyDetail({ showExactAddress: false }));

    expect(result.address).toBeNull();
  });

  it("does not leak admin-only fields", () => {
    const result = toPublicPropertyDetail(makePropertyDetail()) as unknown as Record<
      string,
      unknown
    >;

    expect(result).not.toHaveProperty("publicationStatus");
    expect(result).not.toHaveProperty("showExactAddress");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");
  });
});
