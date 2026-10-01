import { describe, expect, it } from "vitest";
import { getPageItems } from "./pagination";

describe("getPageItems", () => {
  it("lists every page when there are 7 or fewer", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses the tail with an ellipsis near the start", () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 12]);
    expect(getPageItems(4, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 12]);
  });

  it("collapses both sides in the middle: 1 ... 4 5 6 ... 12", () => {
    expect(getPageItems(5, 12)).toEqual([1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 12]);
  });

  it("collapses the head with an ellipsis near the end", () => {
    expect(getPageItems(12, 12)).toEqual([1, "ellipsis-start", 8, 9, 10, 11, 12]);
    expect(getPageItems(9, 12)).toEqual([1, "ellipsis-start", 8, 9, 10, 11, 12]);
  });
});
