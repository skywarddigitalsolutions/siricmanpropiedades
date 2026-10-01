import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  buildPropertyListHref,
  countSecondaryFilters,
  hasActiveFilters,
  parsePropertyListParams,
} from "./list-params";

describe("parsePropertyListParams", () => {
  it("returns empty filters and page 1 for no params", () => {
    const result = parsePropertyListParams({});

    expect(result).toEqual({
      filters: {},
      page: 1,
      limit: PAGE_SIZE,
      offset: 0,
    });
  });

  it("parses known enum values", () => {
    const result = parsePropertyListParams({
      publicationStatus: "published",
      dealStatus: "reserved",
      operation: "rent",
      type: "apartment",
    });

    expect(result.filters).toEqual({
      publicationStatus: "published",
      dealStatus: "reserved",
      operation: "rent",
      type: "apartment",
    });
  });

  it("ignores unknown enum values instead of forwarding them", () => {
    const result = parsePropertyListParams({
      publicationStatus: "deleted",
      operation: "swap",
      type: "castle",
      dealStatus: "bogus",
    });

    expect(result.filters).toEqual({});
  });

  it("trims and keeps q, clamped to 100 characters", () => {
    const long = "a".repeat(150);
    const result = parsePropertyListParams({ q: `  ${long}  ` });

    expect(result.filters.q).toBe("a".repeat(100));
  });

  it("drops a blank q", () => {
    const result = parsePropertyListParams({ q: "   " });

    expect(result.filters.q).toBeUndefined();
  });

  it("keeps a trimmed neighborhoodId", () => {
    const result = parsePropertyListParams({ neighborhoodId: " abc-123 " });

    expect(result.filters.neighborhoodId).toBe("abc-123");
  });

  it("takes the first value when a param repeats", () => {
    const result = parsePropertyListParams({ operation: ["sale", "rent"] });

    expect(result.filters.operation).toBe("sale");
  });

  it("clamps page to at least 1 for invalid input", () => {
    expect(parsePropertyListParams({ page: "0" }).page).toBe(1);
    expect(parsePropertyListParams({ page: "-5" }).page).toBe(1);
    expect(parsePropertyListParams({ page: "abc" }).page).toBe(1);
  });

  it("computes offset from page and the fixed page size", () => {
    const result = parsePropertyListParams({ page: "3" });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(PAGE_SIZE);
    expect(result.offset).toBe((3 - 1) * PAGE_SIZE);
  });
});

describe("countSecondaryFilters", () => {
  it("excludes q from the count", () => {
    expect(countSecondaryFilters({ q: "casa" })).toBe(0);
  });

  it("counts every other active filter", () => {
    expect(
      countSecondaryFilters({
        publicationStatus: "draft",
        operation: "sale",
        type: "house",
        dealStatus: "available",
        neighborhoodId: "n1",
      }),
    ).toBe(5);
  });

  it("returns 0 for no filters", () => {
    expect(countSecondaryFilters({})).toBe(0);
  });
});

describe("hasActiveFilters", () => {
  it("is false for an empty filter set", () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it("is true when any filter is set, including q", () => {
    expect(hasActiveFilters({ q: "casa" })).toBe(true);
    expect(hasActiveFilters({ operation: "sale" })).toBe(true);
  });
});

describe("buildPropertyListHref", () => {
  it("returns the bare route with no filters and page 1", () => {
    expect(buildPropertyListHref({}, 1)).toBe("/admin/propiedades");
  });

  it("omits page when it is 1 but keeps filters", () => {
    expect(buildPropertyListHref({ operation: "sale" }, 1)).toBe(
      "/admin/propiedades?operation=sale",
    );
  });

  it("includes page when greater than 1", () => {
    expect(buildPropertyListHref({}, 2)).toBe("/admin/propiedades?page=2");
  });

  it("preserves every filter alongside the page", () => {
    const href = buildPropertyListHref(
      {
        q: "casa",
        publicationStatus: "published",
        dealStatus: "available",
        operation: "sale",
        type: "house",
        neighborhoodId: "n1",
      },
      3,
    );

    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/admin/propiedades");
    expect(url.searchParams.get("q")).toBe("casa");
    expect(url.searchParams.get("publicationStatus")).toBe("published");
    expect(url.searchParams.get("dealStatus")).toBe("available");
    expect(url.searchParams.get("operation")).toBe("sale");
    expect(url.searchParams.get("type")).toBe("house");
    expect(url.searchParams.get("neighborhoodId")).toBe("n1");
    expect(url.searchParams.get("page")).toBe("3");
  });
});
