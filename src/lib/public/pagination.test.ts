import { describe, expect, it } from "vitest";
import { compactPageItems, pageItems, responsivePageItems } from "./pagination";

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses the far end with an ellipsis", () => {
    expect(pageItems(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
  });

  it("collapses both ends around a middle page", () => {
    expect(pageItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("collapses the start near the end", () => {
    expect(pageItems(12, 12)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12]);
  });

  it("returns a single page as-is", () => {
    expect(pageItems(1, 1)).toEqual([1]);
  });
});

describe("compactPageItems (narrow phones)", () => {
  it("lists up to 4 pages in full", () => {
    expect(compactPageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps only first, current and last, with ellipses in the gaps", () => {
    expect(compactPageItems(6, 12)).toEqual([1, "ellipsis", 6, "ellipsis", 12]);
    expect(compactPageItems(1, 12)).toEqual([1, "ellipsis", 12]);
    expect(compactPageItems(2, 12)).toEqual([1, 2, "ellipsis", 12]);
    expect(compactPageItems(12, 12)).toEqual([1, "ellipsis", 12]);
    expect(compactPageItems(3, 5)).toEqual([1, "ellipsis", 3, "ellipsis", 5]);
  });

  it("never shows more than five slots", () => {
    for (let total = 1; total <= 30; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        expect(compactPageItems(current, total).length).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe("responsivePageItems", () => {
  const view = (items: ReturnType<typeof responsivePageItems>, mode: "full" | "compact") =>
    items.filter((entry) => entry[mode]).map((entry) => entry.item);

  it("merges both lists in order so each width shows its own list", () => {
    for (const [current, total] of [
      [1, 12],
      [4, 12],
      [6, 12],
      [9, 12],
      [12, 12],
      [3, 5],
      [2, 3],
    ]) {
      const items = responsivePageItems(current, total);
      expect(view(items, "full")).toEqual(pageItems(current, total));
      expect(view(items, "compact")).toEqual(compactPageItems(current, total));
    }
  });

  it("renders each page number once, with unique keys", () => {
    const items = responsivePageItems(4, 12);
    const keys = items.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(items.filter((entry) => entry.item === 4)).toHaveLength(1);
  });
});
