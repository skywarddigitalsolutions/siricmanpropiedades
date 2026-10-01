import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain function, not vi.fn: vitest would report the rejections it records as test failures.
const lookup = vi.hoisted(() => ({
  calls: [] as string[],
  impl: (async () => undefined) as (slug: string) => Promise<unknown>,
}));
vi.mock("@/lib/api/public-catalog", () => ({
  getPublicProperty: (slug: string) => {
    lookup.calls.push(slug);
    return lookup.impl(slug);
  },
}));

import { ApiError } from "@/lib/api/client";
import { makePublicPropertyDetail } from "@/test/fixtures/public-property";
import { GET } from "./route";

const request = (query: string) => new Request(`http://site.test/api/favoritos${query}`);

describe("GET /api/favoritos", () => {
  beforeEach(() => {
    lookup.calls = [];
  });

  it("answers 400 without calling the API for a missing, invalid or oversized list", async () => {
    expect((await GET(request(""))).status).toBe(400);
    expect((await GET(request("?slugs=Bad_Slug"))).status).toBe(400);
    const many = Array.from({ length: 51 }, (_, index) => `p${index}`).join(",");
    expect((await GET(request(`?slugs=${many}`))).status).toBe(400);
    expect(lookup.calls).toEqual([]);
  });

  it("returns ok with a minimal card, gone for 404s and error for other failures", async () => {
    lookup.impl = async (slug) => {
      if (slug === "vendida") return makePublicPropertyDetail({ slug, dealStatus: "sold" });
      if (slug === "borrada") throw new ApiError(404, "Not found");
      throw new ApiError(429, "Too many");
    };

    const response = await GET(request("?slugs=vendida,borrada,limitada"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(3);
    expect(body[0]).toMatchObject({
      slug: "vendida",
      status: "ok",
      property: { slug: "vendida", dealStatus: "sold", price: 185000, currency: "USD" },
    });
    expect(body[0].property).not.toHaveProperty("description");
    expect(body[1]).toEqual({ slug: "borrada", status: "gone" });
    expect(body[2]).toEqual({ slug: "limitada", status: "error" });
  });

  it("dedupes slugs and keeps the request order", async () => {
    lookup.impl = async (slug) => makePublicPropertyDetail({ slug });

    const body = await (await GET(request("?slugs=b,a,b"))).json();

    expect(body.map((item: { slug: string }) => item.slug)).toEqual(["b", "a"]);
    expect(lookup.calls).toHaveLength(2);
  });
});
