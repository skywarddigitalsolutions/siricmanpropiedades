import { describe, expect, it } from "vitest";
import { pageItems } from "./pagination";

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
