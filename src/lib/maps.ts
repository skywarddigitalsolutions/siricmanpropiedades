export type MapPrecision = "exact" | "approximate";

const ZOOM: Record<MapPrecision, number> = { exact: 16, approximate: 14 };

/** Keyless Google Maps embed URL for a free-text query (address or barrio). */
export function buildMapEmbedUrl(query: string, precision: MapPrecision = "exact"): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=${ZOOM[precision]}`;
}
