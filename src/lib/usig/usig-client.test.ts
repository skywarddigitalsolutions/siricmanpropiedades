import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupBarrio, searchAddresses, UsigUnavailableError } from "./usig-client";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("searchAddresses", () => {
  it("calls the normalizer with the encoded query and returns CABA suggestions", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        direccionesNormalizadas: [
          {
            altura: 123,
            cod_partido: "caba",
            coordenadas: { x: "-58.417745", y: "-34.612817" },
            nombre_calle: "BOEDO",
            tipo: "calle_altura",
          },
        ],
      }),
    );

    const result = await searchAddresses("avenida boedo 123");

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe("https://servicios.usig.buenosaires.gob.ar");
    expect(parsed.pathname).toBe("/normalizar/");
    expect(parsed.searchParams.get("direccion")).toBe("avenida boedo 123");
    expect(parsed.searchParams.get("geocodificar")).toBe("true");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(result).toEqual([{ address: "Boedo 123", lat: -34.612817, lon: -58.417745 }]);
  });

  it("throws UsigUnavailableError on a network failure, non-200 or invalid JSON", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(searchAddresses("boedo 1")).rejects.toBeInstanceOf(UsigUnavailableError);

    fetchMock.mockResolvedValueOnce(new Response("x", { status: 502 }));
    await expect(searchAddresses("boedo 1")).rejects.toBeInstanceOf(UsigUnavailableError);

    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    await expect(searchAddresses("boedo 1")).rejects.toBeInstanceOf(UsigUnavailableError);
  });
});

describe("lookupBarrio", () => {
  it("asks datos_utiles with x=lon and y=lat and returns the barrio", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ barrio: "Almagro" }));

    const barrio = await lookupBarrio(-34.6094, -58.4152);

    const parsed = new URL(fetchMock.mock.calls[0][0] as string);
    expect(parsed.origin).toBe("https://ws.usig.buenosaires.gob.ar");
    expect(parsed.pathname).toBe("/datos_utiles/");
    expect(parsed.searchParams.get("x")).toBe("-58.4152");
    expect(parsed.searchParams.get("y")).toBe("-34.6094");
    expect(barrio).toBe("Almagro");
  });

  it("returns null when USIG has no barrio and throws when unavailable", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ barrio: "" }));
    expect(await lookupBarrio(1, 2)).toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("down"));
    await expect(lookupBarrio(1, 2)).rejects.toBeInstanceOf(UsigUnavailableError);
  });
});
