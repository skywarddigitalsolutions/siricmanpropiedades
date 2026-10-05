import type { Currency, Operation, PropertyType } from "@/lib/properties/enums";
import { PROPERTY_TYPE_LABELS, formatPrice } from "@/lib/properties/labels";
import type { PublicNeighborhood, PublicPropertyFilters, PublicSort } from "./types";

/**
 * Results page state, read from and written to Spanish, shareable URLs
 * (`/propiedades?operacion=venta&ambientes=3…`). Invalid values are dropped,
 * never forwarded, so a hand-edited URL can't make the API answer 400.
 */
export type ResultsSort = "recientes" | "menor-precio" | "mayor-precio";

export type SearchState = {
  operation?: Operation;
  type?: PropertyType;
  /** Neighborhood slugs (up to {@link MAX_NEIGHBORHOODS}). */
  neighborhoods?: string[];
  /** Minimum rooms (5 means "5 or more"). */
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage: boolean;
  credit: boolean;
  pets: boolean;
  currency?: Currency;
  priceMin?: number;
  priceMax?: number;
  sort: ResultsSort;
  page: number;
  code?: string;
};

export const EMPTY_SEARCH: SearchState = {
  garage: false,
  credit: false,
  pets: false,
  sort: "recientes",
  page: 1,
};

export const RESULTS_PATH = "/propiedades";

/** The back accepts at most 10 comma-separated slugs in `neighborhood`. */
export const MAX_NEIGHBORHOODS = 10;

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

/** "palermo,belgrano" → valid, de-duplicated slugs (first 10); undefined when none. */
function parseNeighborhoods(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const slugs = [
    ...new Set(
      value
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => SLUG_PATTERN.test(slug)),
    ),
  ].slice(0, MAX_NEIGHBORHOODS);
  return slugs.length > 0 ? slugs : undefined;
}

export const OPERATION_SLUGS: Record<Operation, string> = {
  sale: "venta",
  rent: "alquiler",
};

export const TYPE_SLUGS: Record<PropertyType, string> = {
  apartment: "departamento",
  house: "casa",
  ph: "ph",
  land: "terreno",
  commercial: "local",
  office: "oficina",
  garage: "cochera",
};

const SORTS: Record<ResultsSort, PublicSort> = {
  recientes: "newest",
  "menor-precio": "price_asc",
  "mayor-precio": "price_desc",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function fromSlug<T extends string>(slugs: Record<T, string>, slug?: string): T | undefined {
  return (Object.keys(slugs) as T[]).find((key) => slugs[key] === slug);
}

function intInRange(value: string | undefined, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
}

/** "300.000" or "$ 300000" → 300000 (prices are whole units). */
function amount(value: string | undefined): number | undefined {
  const digits = value?.replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
}

export function parseSearchParams(raw: RawParams): SearchState {
  const currency = first(raw, "moneda");
  const sort = first(raw, "orden");
  const code = first(raw, "codigo")?.toUpperCase();
  let priceMin = amount(first(raw, "desde"));
  let priceMax = amount(first(raw, "hasta"));
  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  const state: SearchState = {
    ...EMPTY_SEARCH,
    operation: fromSlug(OPERATION_SLUGS, first(raw, "operacion")),
    type: fromSlug(TYPE_SLUGS, first(raw, "tipo")),
    neighborhoods: parseNeighborhoods(first(raw, "barrio")),
    rooms: intInRange(first(raw, "ambientes"), 1, 5),
    bedrooms: intInRange(first(raw, "dormitorios"), 1, 4),
    bathrooms: intInRange(first(raw, "banos"), 1, 3),
    garage: first(raw, "cochera") === "1",
    credit: first(raw, "credito") === "1",
    pets: first(raw, "mascotas") === "1",
    currency: currency === "USD" || currency === "ARS" ? currency : undefined,
    priceMin,
    priceMax,
    sort: sort && sort in SORTS ? (sort as ResultsSort) : "recientes",
    page: intInRange(first(raw, "pagina"), 1, 10_000) ?? 1,
    code: code && code.length <= 20 ? code : undefined,
  };

  // Drop keys left undefined so states compare cleanly.
  return Object.fromEntries(
    Object.entries(state).filter(([, value]) => value !== undefined),
  ) as SearchState;
}

/**
 * The back filters and sorts by price within one currency only. When price
 * matters but no currency was chosen, use the usual one in CABA: dollars for
 * sales, pesos for rents.
 */
export function effectiveCurrency(state: SearchState): Currency | undefined {
  if (state.currency) return state.currency;
  const usesPrice =
    state.sort !== "recientes" ||
    state.priceMin !== undefined ||
    state.priceMax !== undefined;
  if (!usesPrice) return undefined;
  return state.operation === "rent" ? "ARS" : "USD";
}

export function toApiFilters(state: SearchState, pageSize: number): PublicPropertyFilters {
  const filters: PublicPropertyFilters = {
    operation: state.operation,
    type: state.type,
    neighborhood: state.neighborhoods?.join(","),
    minRooms: state.rooms,
    minBedrooms: state.bedrooms,
    minBathrooms: state.bathrooms,
    hasGarage: state.garage || undefined,
    creditEligible: state.credit || undefined,
    petsAllowed: state.pets || undefined,
    code: state.code,
    currency: effectiveCurrency(state),
    priceMin: state.priceMin,
    priceMax: state.priceMax,
    sort: SORTS[state.sort],
    limit: pageSize,
    offset: (state.page - 1) * pageSize,
  };
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  ) as PublicPropertyFilters;
}

/** Results URL for `state` with `patch` applied; the page resets to 1 unless patched. */
export function buildSearchHref(state: SearchState, patch: Partial<SearchState> = {}): string {
  const next: SearchState = { ...state, page: 1, ...patch };
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined | false) => {
    if (value !== undefined && value !== false) params.set(key, String(value));
  };

  set("operacion", next.operation && OPERATION_SLUGS[next.operation]);
  set("tipo", next.type && TYPE_SLUGS[next.type]);
  set("barrio", next.neighborhoods?.join(","));
  set("ambientes", next.rooms);
  set("dormitorios", next.bedrooms);
  set("banos", next.bathrooms);
  set("cochera", next.garage && 1);
  set("credito", next.credit && 1);
  set("mascotas", next.pets && 1);
  set("moneda", next.currency);
  set("desde", next.priceMin);
  set("hasta", next.priceMax);
  set("orden", next.sort !== "recientes" && next.sort);
  set("pagina", next.page > 1 && next.page);
  set("codigo", next.code);

  // Commas stay readable in the URL (`barrio=palermo,belgrano`).
  const query = params.toString().replace(/%2C/gi, ",");
  return query ? `${RESULTS_PATH}?${query}` : RESULTS_PATH;
}

/** The one URL for exactly this state, page included. */
export function canonicalHref(state: SearchState): string {
  return buildSearchHref(state, { page: state.page });
}

/** Filters that live in the filters sheet (operation and barrio have their own controls). */
export function countActiveFilters(state: SearchState): number {
  return [
    state.type,
    state.rooms,
    state.bedrooms,
    state.bathrooms,
    state.garage,
    state.credit,
    state.pets,
    state.priceMin !== undefined || state.priceMax !== undefined,
  ].filter(Boolean).length;
}

export type ActiveFilter = { label: string; removeHref: string };

function priceLabel(state: SearchState): string | undefined {
  const { priceMin, priceMax } = state;
  if (priceMin === undefined && priceMax === undefined) return undefined;
  const currency = effectiveCurrency(state) ?? "USD";
  if (priceMin !== undefined && priceMax !== undefined) {
    return `${formatPrice(currency, priceMin)} – ${formatPrice(currency, priceMax)}`;
  }
  return priceMin !== undefined
    ? `Desde ${formatPrice(currency, priceMin)}`
    : `Hasta ${formatPrice(currency, priceMax as number)}`;
}

/**
 * One entry per filter the visitor applied (operation and sort have their own
 * controls), each with the URL that drops only that filter.
 */
export function activeFilters(
  state: SearchState,
  neighborhoods: PublicNeighborhood[],
): ActiveFilter[] {
  const filters: { label: string; patch: Partial<SearchState> }[] = [];
  for (const slug of state.neighborhoods ?? []) {
    const name = neighborhoods.find((item) => item.slug === slug)?.name;
    const rest = (state.neighborhoods ?? []).filter((item) => item !== slug);
    filters.push({
      label: name ?? slug,
      patch: { neighborhoods: rest.length > 0 ? rest : undefined },
    });
  }
  if (state.type) {
    filters.push({ label: PROPERTY_TYPE_LABELS[state.type], patch: { type: undefined } });
  }
  if (state.rooms) {
    filters.push({
      label: state.rooms === 5 ? "5 o más ambientes" : `${state.rooms} ambientes`,
      patch: { rooms: undefined },
    });
  }
  if (state.bedrooms) {
    filters.push({
      label: state.bedrooms === 1 ? "1 dormitorio" : `${state.bedrooms} dormitorios`,
      patch: { bedrooms: undefined },
    });
  }
  if (state.bathrooms) {
    filters.push({
      label: state.bathrooms === 1 ? "1 baño" : `${state.bathrooms} baños`,
      patch: { bathrooms: undefined },
    });
  }
  if (state.garage) filters.push({ label: "Cochera", patch: { garage: false } });
  if (state.credit) filters.push({ label: "Apto crédito", patch: { credit: false } });
  if (state.pets) filters.push({ label: "Mascotas", patch: { pets: false } });
  const price = priceLabel(state);
  if (price) {
    filters.push({
      label: price,
      patch: { priceMin: undefined, priceMax: undefined, currency: undefined },
    });
  }
  return filters.map(({ label, patch }) => ({ label, removeHref: buildSearchHref(state, patch) }));
}

export function resultsTitle(total: number, operation?: Operation): string {
  const noun = total === 1 ? "propiedad" : "propiedades";
  const suffix = operation === "sale" ? " en venta" : operation === "rent" ? " en alquiler" : "";
  return `${total} ${noun}${suffix}`;
}

/**
 * Whether the incoming query is exactly the canonical one for `state` (key
 * order aside). When it isn't (empty fields from the GET forms, invalid or
 * default values), the page redirects so each search has one URL.
 */
export function isCanonicalQuery(raw: RawParams, state: SearchState): boolean {
  const incoming = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) incoming.append(key, item);
    }
  }
  const canonical = new URLSearchParams(canonicalHref(state).split("?")[1] ?? "");
  incoming.sort();
  canonical.sort();
  return incoming.toString() === canonical.toString();
}

const TYPE_PLURALS: Record<PropertyType, string> = {
  apartment: "Departamentos",
  house: "Casas",
  ph: "PH",
  land: "Terrenos",
  commercial: "Locales",
  office: "Oficinas",
  garage: "Cocheras",
};

/**
 * Page title for a results URL. Only landing-style combinations (operation,
 * type, barrio on page 1) are worth indexing; any other filter makes a
 * near-duplicate page, so it is kept out of the index.
 */
export function resultsSeo(
  state: SearchState,
  neighborhoodName?: string,
): { title: string; indexable: boolean } {
  const noun = state.type ? TYPE_PLURALS[state.type] : "Propiedades";
  const operation =
    state.operation === "sale" ? " en venta" : state.operation === "rent" ? " en alquiler" : "";
  const several = (state.neighborhoods?.length ?? 0) > 1;
  const place = neighborhoodName && !several ? ` en ${neighborhoodName}` : " en CABA";
  const extra =
    countActiveFilters({ ...state, type: undefined }) > 0 ||
    state.currency !== undefined ||
    state.sort !== "recientes" ||
    state.page > 1 ||
    state.code !== undefined ||
    several;
  return { title: `${noun}${operation}${place}`, indexable: !extra };
}
