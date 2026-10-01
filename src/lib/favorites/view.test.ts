import { describe, expect, it } from "vitest";
import { makePublicPropertyDetail } from "@/test/fixtures/public-property";
import type { FavoriteSnapshot } from "./store";
import { parseSlugsParam, similarHref, toFavoriteProperty, favoriteView } from "./view";

const snapshot: FavoriteSnapshot = {
  slug: "luminoso-3-ambientes-con-balcon",
  title: "Luminoso 3 ambientes",
  price: 185000,
  currency: "USD",
  operation: "sale",
  cover: null,
  neighborhood: "Palermo",
  savedAt: 1,
};

const property = (overrides = {}) =>
  toFavoriteProperty(makePublicPropertyDetail(overrides));

describe("parseSlugsParam", () => {
  it("splits, trims and dedupes", () => {
    expect(parseSlugsParam("a, b,a,,c")).toEqual({ ok: true, slugs: ["a", "b", "c"] });
  });

  it("rejects missing or empty input", () => {
    expect(parseSlugsParam(null)).toMatchObject({ ok: false });
    expect(parseSlugsParam("")).toMatchObject({ ok: false });
  });

  it("rejects invalid slugs and more than 50", () => {
    expect(parseSlugsParam("ok,Bad_Slug")).toMatchObject({ ok: false });
    expect(parseSlugsParam("a".repeat(121))).toMatchObject({ ok: false });
    const many = Array.from({ length: 51 }, (_, index) => `p${index}`).join(",");
    expect(parseSlugsParam(many)).toMatchObject({ ok: false });
    const fifty = Array.from({ length: 50 }, (_, index) => `p${index}`).join(",");
    expect(parseSlugsParam(fifty)).toMatchObject({ ok: true });
  });
});

describe("toFavoriteProperty", () => {
  it("keeps only the minimal card shape, with the thumbnail as cover", () => {
    const card = property();
    expect(card).toEqual({
      slug: "luminoso-3-ambientes-con-balcon",
      code: "SP-0101",
      title: "Luminoso 3 ambientes con balcón al frente",
      price: 185000,
      currency: "USD",
      operation: "sale",
      type: "apartment",
      neighborhood: { name: "Palermo", slug: "palermo" },
      coverImage: "https://media.test/p1-1-thumb.webp",
      dealStatus: "available",
    });
  });
});

describe("favoriteView", () => {
  it("is loading until the refresh answered", () => {
    expect(favoriteView(snapshot, undefined)).toEqual({ state: "loading" });
  });

  it("shows an available property normally, with no price note when unchanged", () => {
    expect(favoriteView(snapshot, { slug: snapshot.slug, status: "ok", property: property() })).toEqual({
      state: "available",
      statusLabel: null,
      priceNote: null,
    });
  });

  it("flags a reserved property but keeps it available", () => {
    const view = favoriteView(snapshot, {
      slug: snapshot.slug,
      status: "ok",
      property: property({ dealStatus: "reserved" }),
    });
    expect(view).toMatchObject({ state: "available", statusLabel: "Reservada" });
  });

  it("marks sold and rented as closed", () => {
    const sold = favoriteView(snapshot, {
      slug: snapshot.slug,
      status: "ok",
      property: property({ dealStatus: "sold" }),
    });
    expect(sold).toMatchObject({ state: "closed", statusLabel: "Vendida" });
    const rented = favoriteView(snapshot, {
      slug: snapshot.slug,
      status: "ok",
      property: property({ dealStatus: "rented" }),
    });
    expect(rented).toMatchObject({ state: "closed", statusLabel: "Alquilada" });
  });

  it("maps a 404 to gone and a failed lookup to unknown (keep the snapshot)", () => {
    expect(favoriteView(snapshot, { slug: snapshot.slug, status: "gone" })).toEqual({ state: "gone" });
    expect(favoriteView(snapshot, { slug: snapshot.slug, status: "error" })).toEqual({
      state: "unknown",
    });
  });

  it("notes a lower price, a higher price, and a currency change against the snapshot", () => {
    const note = (overrides: object) =>
      favoriteView(snapshot, { slug: snapshot.slug, status: "ok", property: property(overrides) });
    expect(note({ price: 170000 })).toMatchObject({ priceNote: "Bajó de precio" });
    expect(note({ price: 199000 })).toMatchObject({ priceNote: "Cambió el precio" });
    expect(note({ currency: "ARS" })).toMatchObject({ priceNote: "Cambió el precio" });
  });
});

describe("similarHref", () => {
  it("links to the results with the same operation, type and barrio", () => {
    expect(similarHref(property())).toBe(
      "/propiedades?operacion=venta&tipo=departamento&barrio=palermo",
    );
  });
});
