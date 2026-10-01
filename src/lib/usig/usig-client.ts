import "server-only";
import {
  barrioFromDatosUtiles,
  parseNormalizerResponse,
  type AddressSuggestion,
} from "./address";

const NORMALIZER_URL = "https://servicios.usig.buenosaires.gob.ar/normalizar/";
const DATOS_UTILES_URL = "https://ws.usig.buenosaires.gob.ar/datos_utiles/";
/** USIG answers in well under a second; do not hold the admin request longer. */
const TIMEOUT_MS = 4000;
const MAX_OPTIONS = 10;

/** USIG is down, slow or answered garbage; callers degrade to "could not validate". */
export class UsigUnavailableError extends Error {
  constructor(message = "USIG no disponible") {
    super(message);
    this.name = "UsigUnavailableError";
  }
}

async function getJson(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new UsigUnavailableError();
  }
  if (!response.ok) throw new UsigUnavailableError();
  try {
    return await response.json();
  } catch {
    throw new UsigUnavailableError();
  }
}

/** Geocoded CABA address suggestions for a (already sanitized) free-text query. */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const url = new URL(NORMALIZER_URL);
  url.searchParams.set("direccion", query);
  url.searchParams.set("geocodificar", "true");
  url.searchParams.set("maxOptions", String(MAX_OPTIONS));
  return parseNormalizerResponse(await getJson(url));
}

/** Barrio name for a WGS84 point (`x` is longitude, `y` latitude), or `null` outside CABA. */
export async function lookupBarrio(lat: number, lon: number): Promise<string | null> {
  const url = new URL(DATOS_UTILES_URL);
  url.searchParams.set("x", String(lon));
  url.searchParams.set("y", String(lat));
  return barrioFromDatosUtiles(await getJson(url));
}
