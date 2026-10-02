import type { Currency, Operation } from "@/lib/properties/enums";

/**
 * Public favorites live in the visitor's browser (`localStorage`), no account.
 * Each entry keeps a small snapshot so the list can render before (or without)
 * a refresh from the API, and so a price change can be noticed later.
 *
 * Plain module (no `server-only`, no React): pure list helpers plus a tiny
 * external store that `useSyncExternalStore` can subscribe to.
 */
export const FAVORITES_KEY = "siricman:favorites:v1";
export const FAVORITES_CAP = 50;

export type FavoriteSnapshot = {
  slug: string;
  title: string;
  price: number;
  currency: Currency;
  operation: Operation;
  cover: string | null;
  neighborhood: string;
  savedAt: number;
};

export type FavoriteInput = Omit<FavoriteSnapshot, "savedAt">;

const EMPTY: FavoriteSnapshot[] = [];

function isSnapshot(value: unknown): value is FavoriteSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.price === "number" &&
    (item.currency === "USD" || item.currency === "ARS") &&
    (item.operation === "sale" || item.operation === "rent") &&
    (item.cover === null || typeof item.cover === "string") &&
    typeof item.neighborhood === "string" &&
    typeof item.savedAt === "number"
  );
}

/** Tolerant parse: corrupt, foreign or duplicated entries are dropped. */
export function parseFavorites(raw: string | null): FavoriteSnapshot[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const seen = new Set<string>();
    const list: FavoriteSnapshot[] = [];
    for (const item of data) {
      if (!isSnapshot(item) || seen.has(item.slug)) continue;
      seen.add(item.slug);
      list.push(item);
    }
    return list.slice(0, FAVORITES_CAP);
  } catch {
    return EMPTY;
  }
}

/** Newest first, one entry per slug, capped (the oldest are dropped). */
export function withFavorite(list: FavoriteSnapshot[], item: FavoriteSnapshot): FavoriteSnapshot[] {
  return [item, ...list.filter((existing) => existing.slug !== item.slug)].slice(0, FAVORITES_CAP);
}

export function withoutFavorite(list: FavoriteSnapshot[], slug: string): FavoriteSnapshot[] {
  return list.filter((item) => item.slug !== slug);
}

let cache: { raw: string | null; list: FavoriteSnapshot[] } = { raw: null, list: EMPTY };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(FAVORITES_KEY);
  } catch {
    return null;
  }
}

/** Current list; the same array reference until the stored value changes. */
export function readFavorites(): FavoriteSnapshot[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, list: parseFavorites(raw) };
  return cache.list;
}

function write(list: FavoriteSnapshot[]): void {
  const raw = list.length ? JSON.stringify(list) : null;
  try {
    if (raw === null) window.localStorage.removeItem(FAVORITES_KEY);
    else window.localStorage.setItem(FAVORITES_KEY, raw);
  } catch {
    // Private mode or quota: keep the in-memory view for this tab only.
    cache = { raw, list };
  }
  listeners.forEach((listener) => listener());
}

export function addFavorite(input: FavoriteInput): void {
  write(withFavorite(readFavorites(), { ...input, savedAt: Date.now() }));
}

export function removeFavorite(slug: string): void {
  write(withoutFavorite(readFavorites(), slug));
}

/** Returns whether the property is saved after the toggle. */
export function toggleFavorite(input: FavoriteInput): boolean {
  const saved = readFavorites().some((item) => item.slug === input.slug);
  if (saved) removeFavorite(input.slug);
  else addFavorite(input);
  return !saved;
}

export function subscribeFavorites(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getServerFavorites(): FavoriteSnapshot[] {
  return EMPTY;
}
