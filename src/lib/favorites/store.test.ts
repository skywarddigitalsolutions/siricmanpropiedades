import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAVORITES_CAP,
  FAVORITES_KEY,
  addFavorite,
  parseFavorites,
  readFavorites,
  removeFavorite,
  subscribeFavorites,
  toggleFavorite,
  withFavorite,
  type FavoriteSnapshot,
} from "./store";

function fav(slug: string, savedAt = 1): FavoriteSnapshot {
  return {
    slug,
    title: `Propiedad ${slug}`,
    price: 100000,
    currency: "USD",
    operation: "sale",
    cover: null,
    neighborhood: "Palermo",
    savedAt,
  };
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("pure list helpers", () => {
  it("puts the newest first and dedupes by slug", () => {
    const list = withFavorite(withFavorite([], fav("a")), fav("b"));
    expect(list.map((item) => item.slug)).toEqual(["b", "a"]);
    expect(withFavorite(list, fav("a", 9)).map((item) => item.slug)).toEqual(["a", "b"]);
  });

  it("caps the list and drops the oldest", () => {
    let list: FavoriteSnapshot[] = [];
    for (let index = 0; index < FAVORITES_CAP + 3; index += 1) {
      list = withFavorite(list, fav(`p${index}`));
    }
    expect(list).toHaveLength(FAVORITES_CAP);
    expect(list[0].slug).toBe(`p${FAVORITES_CAP + 2}`);
    expect(list.some((item) => item.slug === "p0")).toBe(false);
  });

  it("ignores corrupt or foreign data when parsing", () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites("not json")).toEqual([]);
    expect(parseFavorites('{"a":1}')).toEqual([]);
    const mixed = JSON.stringify([fav("ok"), { slug: 5 }, null, fav("ok")]);
    expect(parseFavorites(mixed).map((item) => item.slug)).toEqual(["ok"]);
  });
});

describe("localStorage store", () => {
  it("persists under the versioned key and reads it back", () => {
    addFavorite(fav("a"));
    expect(FAVORITES_KEY).toBe("siricman:favorites:v1");
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toHaveLength(1);
    expect(readFavorites().map((item) => item.slug)).toEqual(["a"]);
  });

  it("returns a stable reference while nothing changed", () => {
    addFavorite(fav("a"));
    expect(readFavorites()).toBe(readFavorites());
  });

  it("toggles and removes", () => {
    expect(toggleFavorite(fav("a"))).toBe(true);
    expect(toggleFavorite(fav("a"))).toBe(false);
    expect(readFavorites()).toEqual([]);
    addFavorite(fav("b"));
    removeFavorite("b");
    expect(readFavorites()).toEqual([]);
  });

  it("notifies subscribers on local changes and on storage events from other tabs", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFavorites(listener);
    addFavorite(fav("a"));
    expect(listener).toHaveBeenCalledTimes(1);

    localStorage.setItem(FAVORITES_KEY, JSON.stringify([fav("z")]));
    window.dispatchEvent(new StorageEvent("storage", { key: FAVORITES_KEY }));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(readFavorites().map((item) => item.slug)).toEqual(["z"]);

    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    addFavorite(fav("b"));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not throw when storage is unavailable (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readFavorites()).toEqual([]);
    expect(() => addFavorite(fav("a"))).not.toThrow();
  });
});
