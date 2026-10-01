/**
 * Pure helpers around the USIG (Buenos Aires city) address normalizer and its
 * "datos útiles" service. No I/O here: `usig-client.ts` does the fetching and
 * the admin route handler gates it behind the session, so the browser never
 * talks to USIG (the admin CSP keeps `connect-src 'self'`).
 */
import { normalizeSearch } from "@/lib/public/neighborhood-match";

export type AddressSuggestion = {
  /** Nicely cased address, e.g. "Av. del Libertador 1500". */
  address: string;
  lat: number;
  lon: number;
};

export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 120;

const PARTICLES = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);
/** Result kinds that point at a concrete place; street-only matches are not an address. */
const ADDRESS_KINDS = new Set(["calle_altura", "calle_y_calle"]);

function capitalize(word: string): string {
  const lower = word.toLocaleLowerCase("es-AR");
  const index = lower.search(/\p{L}/u);
  // Words starting with a digit ("11") stay as they are; "(x)" keeps its bracket.
  if (index !== 0) return lower;
  return lower.charAt(0).toLocaleUpperCase("es-AR") + lower.slice(1);
}

/** "AV. DE LOS INCAS" -> "Av. de los Incas"; particles stay lowercase after the first word. */
export function titleCaseStreet(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && PARTICLES.has(word.toLocaleLowerCase("es-AR"))
        ? word.toLocaleLowerCase("es-AR")
        : capitalize(word),
    )
    .join(" ");
}

/** USIG writes avenues as "SANTA FE AV."; people write "Av. Santa Fe". */
function streetName(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.*\S)\s+AV\.$/i);
  return titleCaseStreet(match ? `AV. ${match[1]}` : trimmed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return typeof value !== "boolean" && value !== null && value !== "" && Number.isFinite(parsed)
    ? parsed
    : null;
}

/** Turns the normalizer's JSON into CABA-only suggestions (best effort; junk is skipped). */
export function parseNormalizerResponse(json: unknown): AddressSuggestion[] {
  if (!isRecord(json) || !Array.isArray(json.direccionesNormalizadas)) return [];

  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];
  for (const entry of json.direccionesNormalizadas) {
    if (!isRecord(entry)) continue;
    if (entry.cod_partido !== "caba") continue;
    if (typeof entry.tipo !== "string" || !ADDRESS_KINDS.has(entry.tipo)) continue;
    if (typeof entry.nombre_calle !== "string" || !entry.nombre_calle.trim()) continue;
    if (!isRecord(entry.coordenadas)) continue;
    const lon = toNumber(entry.coordenadas.x);
    const lat = toNumber(entry.coordenadas.y);
    if (lat === null || lon === null) continue;

    let address: string;
    if (entry.tipo === "calle_y_calle") {
      if (typeof entry.nombre_calle_cruce !== "string" || !entry.nombre_calle_cruce.trim()) continue;
      address = `${streetName(entry.nombre_calle)} y ${streetName(entry.nombre_calle_cruce)}`;
    } else {
      const height = toNumber(entry.altura);
      if (height === null) continue;
      address = `${streetName(entry.nombre_calle)} ${height}`;
    }

    if (seen.has(address)) continue;
    seen.add(address);
    suggestions.push({ address, lat, lon });
  }
  return suggestions;
}

/** Validates and normalizes the user's query; `null` means "do not call USIG". */
export function sanitizeAddressQuery(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  const query = value.trim().replace(/\s+/g, " ");
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) return null;
  return query;
}

/** The barrio name from a `datos_utiles` response, or `null` when unknown. */
export function barrioFromDatosUtiles(json: unknown): string | null {
  if (!isRecord(json) || typeof json.barrio !== "string") return null;
  const barrio = json.barrio.trim();
  return barrio ? barrio : null;
}

/** The app's barrio matching a USIG barrio name (case and accent insensitive). */
export function findNeighborhoodByName<T extends { name: string }>(
  name: string,
  neighborhoods: T[],
): T | undefined {
  const needle = normalizeSearch(name);
  if (!needle) return undefined;
  return neighborhoods.find((item) => normalizeSearch(item.name) === needle);
}

/** The back has no floor/unit field, so it travels after a comma: "Boedo 123, 4° B". */
export function splitAddress(address: string): { base: string; unit: string } {
  const index = address.indexOf(",");
  if (index < 0) return { base: address.trim(), unit: "" };
  return {
    base: address.slice(0, index).trim(),
    unit: address.slice(index + 1).trim(),
  };
}

export function joinAddress(base: string, unit: string): string {
  const cleanBase = base.trim();
  const cleanUnit = unit.trim();
  return cleanUnit ? `${cleanBase}, ${cleanUnit}` : cleanBase;
}
