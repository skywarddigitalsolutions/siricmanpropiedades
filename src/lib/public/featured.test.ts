import { describe, expect, it } from "vitest";
import { makePublicProperty } from "@/test/fixtures/public-property";
import { MIN_FEATURED, SHOWCASE_SIZE, needsFallback, pickShowcase } from "./featured";

const make = (id: string) => makePublicProperty({ id, slug: id, title: `P ${id}` });
const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe("needsFallback", () => {
  it("is true below the minimum of featured properties", () => {
    expect(needsFallback(0)).toBe(true);
    expect(needsFallback(MIN_FEATURED - 1)).toBe(true);
    expect(needsFallback(MIN_FEATURED)).toBe(false);
  });
});

describe("pickShowcase", () => {
  it("keeps only the featured ones when there are enough", () => {
    const featured = ["a", "b", "c"].map(make);
    const latest = ["x", "y", "z"].map(make);

    expect(ids(pickShowcase(featured, latest))).toEqual(["a", "b", "c"]);
  });

  it("fills with the latest, featured first, without duplicates, up to the size", () => {
    const featured = ["a", "b"].map(make);
    const latest = ["b", "x", "y", "z", "w", "v", "u"].map(make);

    const result = pickShowcase(featured, latest);

    expect(ids(result)).toEqual(["a", "b", "x", "y", "z", "w"]);
    expect(result).toHaveLength(SHOWCASE_SIZE);
  });

  it("uses the latest alone when nothing is featured", () => {
    expect(ids(pickShowcase([], ["x", "y"].map(make)))).toEqual(["x", "y"]);
  });

  it("is empty when there is nothing at all", () => {
    expect(pickShowcase([], [])).toEqual([]);
  });

  it("caps a long featured list", () => {
    const featured = Array.from({ length: 9 }, (_, i) => make(`f${i}`));
    expect(pickShowcase(featured, [])).toHaveLength(SHOWCASE_SIZE);
  });
});
