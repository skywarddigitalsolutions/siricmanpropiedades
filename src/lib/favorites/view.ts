import type { Currency, DealStatus, Operation, PropertyType } from "@/lib/properties/enums";
import { DEAL_STATUS_LABELS } from "@/lib/properties/labels";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import type { PublicPropertyDetail } from "@/lib/public/types";
import type { FavoriteSnapshot } from "./store";

/**
 * Shared by the `/api/favoritos` route handler and the favorites page: the
 * minimal live data a saved card needs, and how a saved snapshot plus that
 * live data maps to what the visitor sees. Plain module (no `server-only`).
 */
export const MAX_SLUGS = 50;
const SLUG = /^[a-z0-9-]{1,120}$/;

export type FavoriteProperty = {
  slug: string;
  code: string;
  title: string;
  price: number;
  currency: Currency;
  operation: Operation;
  type: PropertyType;
  neighborhood: { name: string; slug: string };
  coverImage: string | null;
  dealStatus: DealStatus;
};

/** `ok` published (any deal status), `gone` the API answered 404, `error` could not be checked. */
export type FavoriteRefresh =
  | { slug: string; status: "ok"; property: FavoriteProperty }
  | { slug: string; status: "gone" }
  | { slug: string; status: "error" };

export function parseSlugsParam(
  value: string | null,
): { ok: true; slugs: string[] } | { ok: false; error: string } {
  if (!value?.trim()) return { ok: false, error: "Falta la lista de propiedades." };
  const slugs = [
    ...new Set(
      value
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ];
  if (slugs.length === 0) return { ok: false, error: "Falta la lista de propiedades." };
  if (slugs.length > MAX_SLUGS) return { ok: false, error: `Máximo ${MAX_SLUGS} propiedades.` };
  if (!slugs.every((slug) => SLUG.test(slug))) return { ok: false, error: "Propiedad inválida." };
  return { ok: true, slugs };
}

export function toFavoriteProperty(detail: PublicPropertyDetail): FavoriteProperty {
  return {
    slug: detail.slug,
    code: detail.code,
    title: detail.title,
    price: detail.price,
    currency: detail.currency,
    operation: detail.operation,
    type: detail.type,
    neighborhood: detail.neighborhood,
    coverImage: detail.images[0]?.thumbnailUrl ?? null,
    dealStatus: detail.dealStatus,
  };
}

export type FavoriteView =
  | { state: "loading" }
  | { state: "gone" }
  | { state: "unknown" }
  | {
      state: "available" | "closed";
      /** "Reservada", "Vendida" or "Alquilada"; `null` while plainly available. */
      statusLabel: string | null;
      priceNote: "Bajó de precio" | "Cambió el precio" | null;
    };

export function favoriteView(
  snapshot: FavoriteSnapshot,
  refresh: FavoriteRefresh | undefined,
): FavoriteView {
  if (!refresh) return { state: "loading" };
  if (refresh.status === "gone") return { state: "gone" };
  if (refresh.status === "error") return { state: "unknown" };

  const { property } = refresh;
  const closed = property.dealStatus === "sold" || property.dealStatus === "rented";
  let priceNote: "Bajó de precio" | "Cambió el precio" | null = null;
  if (property.currency !== snapshot.currency) priceNote = "Cambió el precio";
  else if (property.price < snapshot.price) priceNote = "Bajó de precio";
  else if (property.price > snapshot.price) priceNote = "Cambió el precio";

  return {
    state: closed ? "closed" : "available",
    statusLabel: property.dealStatus === "available" ? null : DEAL_STATUS_LABELS[property.dealStatus],
    priceNote,
  };
}

/** Results for the same operation, type and barrio. */
export function similarHref(
  property: Pick<FavoriteProperty, "operation" | "type" | "neighborhood">,
): string {
  return buildSearchHref(EMPTY_SEARCH, {
    operation: property.operation,
    type: property.type,
    neighborhood: property.neighborhood.slug,
  });
}
