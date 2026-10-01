import type { PublicNeighborhood } from "./types";

export const MAX_SUGGESTIONS = 8;

export type NeighborhoodMatch = {
  neighborhood: PublicNeighborhood;
  /** Matched range on the original `name`, for highlighting. */
  start: number;
  length: number;
};

/** Lowercase, accent-free, trimmed. Precomposed accents keep the string length. */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** 0: name prefix, 1: word prefix, 2: substring; `null` when it does not match. */
function rank(name: string, query: string): { rank: number; start: number } | null {
  if (name.startsWith(query)) return { rank: 0, start: 0 };
  for (let i = 1; i < name.length; i++) {
    if ((name[i - 1] === " " || name[i - 1] === "-") && name.startsWith(query, i)) {
      return { rank: 1, start: i };
    }
  }
  const index = name.indexOf(query);
  return index >= 0 ? { rank: 2, start: index } : null;
}

/**
 * Typeahead matches for a barrio query: accent- and case-insensitive, name
 * prefixes first, then word prefixes, then substrings (alphabetical inside a rank).
 */
export function matchNeighborhoods(
  query: string,
  neighborhoods: PublicNeighborhood[],
  limit = MAX_SUGGESTIONS,
): NeighborhoodMatch[] {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  const matches: (NeighborhoodMatch & { rank: number; key: string })[] = [];
  for (const neighborhood of neighborhoods) {
    const key = normalizeSearch(neighborhood.name);
    const found = rank(key, needle);
    if (found) {
      matches.push({
        neighborhood,
        start: found.start,
        length: needle.length,
        rank: found.rank,
        key,
      });
    }
  }
  matches.sort((a, b) => a.rank - b.rank || a.key.localeCompare(b.key, "es"));
  return matches.slice(0, limit).map(({ neighborhood, start, length }) => ({
    neighborhood,
    start,
    length,
  }));
}

/** The barrio whose full name equals the text (accent/case-insensitive). */
export function findExactNeighborhood(
  text: string,
  neighborhoods: PublicNeighborhood[],
): PublicNeighborhood | undefined {
  const needle = normalizeSearch(text);
  if (!needle) return undefined;
  return neighborhoods.find((n) => normalizeSearch(n.name) === needle);
}
