import { describe, expect, it } from "vitest";
import { findExactNeighborhood, matchNeighborhoods, normalizeSearch } from "./neighborhood-match";

const LIST = [
  { id: "1", name: "Villa Urquiza", slug: "villa-urquiza" },
  { id: "2", name: "Núñez", slug: "nunez" },
  { id: "3", name: "Palermo", slug: "palermo" },
  { id: "4", name: "Palermo Hollywood", slug: "palermo-hollywood" },
  { id: "5", name: "Barracas", slug: "barracas" },
  { id: "6", name: "Villa del Parque", slug: "villa-del-parque" },
];

const names = (query: string) => matchNeighborhoods(query, LIST).map((m) => m.neighborhood.name);

describe("normalizeSearch", () => {
  it("lowercases, strips accents and trims", () => {
    expect(normalizeSearch("  NÚÑEZ ")).toBe("nunez");
  });
});

describe("matchNeighborhoods", () => {
  it("ignores accents and case in both directions", () => {
    expect(names("nunez")).toEqual(["Núñez"]);
    expect(names("Nuñez")).toEqual(["Núñez"]);
    expect(names("núñ")).toEqual(["Núñez"]);
  });

  it("ranks prefix, then word-prefix, then substring matches", () => {
    const list = [
      { id: "a", name: "Monte Castro", slug: "monte-castro" },
      { id: "b", name: "Castelar Norte", slug: "castelar-norte" },
      { id: "c", name: "Villa Castrense", slug: "villa-castrense" },
      { id: "d", name: "Boedoblastro", slug: "boedoblastro" },
    ];
    expect(matchNeighborhoods("cas", list).map((m) => m.neighborhood.name)).toEqual([
      "Castelar Norte",
      "Monte Castro",
      "Villa Castrense",
    ]);
    expect(matchNeighborhoods("astr", list).map((m) => m.neighborhood.name)).toEqual([
      "Boedoblastro",
      "Monte Castro",
      "Villa Castrense",
    ]);
  });

  it("returns the matched range on the original name", () => {
    const [match] = matchNeighborhoods("urq", LIST);
    expect(match.neighborhood.name).toBe("Villa Urquiza");
    expect(match.start).toBe(6);
    expect(match.length).toBe(3);
  });

  it("caps the number of results", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      name: `Barrio ${i}`,
      slug: `barrio-${i}`,
    }));
    expect(matchNeighborhoods("barrio", many)).toHaveLength(8);
    expect(matchNeighborhoods("barrio", many, 3)).toHaveLength(3);
  });

  it("returns nothing for an empty query or no match", () => {
    expect(names("")).toEqual([]);
    expect(names("   ")).toEqual([]);
    expect(names("zzz")).toEqual([]);
  });
});

describe("findExactNeighborhood", () => {
  it("finds a barrio by its full name regardless of accents and case", () => {
    expect(findExactNeighborhood("NUÑEZ", LIST)?.slug).toBe("nunez");
    expect(findExactNeighborhood("palermo", LIST)?.slug).toBe("palermo");
  });

  it("returns undefined when it is only a partial name", () => {
    expect(findExactNeighborhood("palerm", LIST)).toBeUndefined();
  });
});
