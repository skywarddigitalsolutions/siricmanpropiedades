import type { PublicPropertyListItem } from "./types";

/** Cards per home section. */
export const SHOWCASE_SIZE = 6;
/** Below this many featured properties the section is completed with the latest ones. */
export const MIN_FEATURED = 3;

/** Whether the featured list is too short to stand alone. */
export function needsFallback(featuredCount: number): boolean {
  return featuredCount < MIN_FEATURED;
}

/**
 * Properties for a home section: the featured ones when there are enough,
 * otherwise those first and then the latest published (same operation),
 * without repeats, up to `SHOWCASE_SIZE`.
 */
export function pickShowcase(
  featured: PublicPropertyListItem[],
  latest: PublicPropertyListItem[],
): PublicPropertyListItem[] {
  const picked = featured.slice(0, SHOWCASE_SIZE);
  if (!needsFallback(featured.length)) return picked;
  const seen = new Set(picked.map((property) => property.id));
  for (const property of latest) {
    if (picked.length >= SHOWCASE_SIZE) break;
    if (seen.has(property.id)) continue;
    seen.add(property.id);
    picked.push(property);
  }
  return picked;
}
