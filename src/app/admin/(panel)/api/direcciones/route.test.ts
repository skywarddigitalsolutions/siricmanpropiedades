import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionCookie } = vi.hoisted(() => ({ getSessionCookie: vi.fn() }));
vi.mock("@/lib/session/cookies", () => ({ getSessionCookie }));

const { searchAddresses, lookupBarrio } = vi.hoisted(() => ({
  searchAddresses: vi.fn(),
  lookupBarrio: vi.fn(),
}));
vi.mock("@/lib/usig/usig-client", () => ({
  searchAddresses,
  lookupBarrio,
  UsigUnavailableError: class UsigUnavailableError extends Error {},
}));

import { UsigUnavailableError } from "@/lib/usig/usig-client";
import { GET } from "./route";

function request(query: string) {
  return new Request(`http://admin.test/admin/api/direcciones${query}`);
}

describe("GET /admin/api/direcciones", () => {
  beforeEach(() => {
    getSessionCookie.mockReset();
    getSessionCookie.mockResolvedValue("jwt");
    searchAddresses.mockReset();
    lookupBarrio.mockReset();
  });

  it("answers 401 without a session cookie and never calls USIG", async () => {
    getSessionCookie.mockResolvedValue(undefined);

    const response = await GET(request("?q=boedo 123"));

    expect(response.status).toBe(401);
    expect(searchAddresses).not.toHaveBeenCalled();
  });

  it("returns suggestions for a valid query", async () => {
    const suggestions = [{ address: "Boedo 123", lat: -34.6, lon: -58.4 }];
    searchAddresses.mockResolvedValue(suggestions);

    const response = await GET(request("?q=%20boedo%20%20123%20"));

    expect(searchAddresses).toHaveBeenCalledWith("boedo 123");
    expect(await response.json()).toEqual({ suggestions });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers an empty list without calling USIG when the query is too short or too long", async () => {
    const short = await GET(request("?q=ab"));
    const long = await GET(request(`?q=${"a".repeat(121)}`));

    expect(await short.json()).toEqual({ suggestions: [] });
    expect(await long.json()).toEqual({ suggestions: [] });
    expect(searchAddresses).not.toHaveBeenCalled();
  });

  it("degrades gracefully when USIG is unavailable", async () => {
    searchAddresses.mockRejectedValue(new UsigUnavailableError("down"));

    const response = await GET(request("?q=boedo 123"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ suggestions: [], unavailable: true });
  });

  it("looks up the barrio for coordinates", async () => {
    lookupBarrio.mockResolvedValue("Almagro");

    const response = await GET(request("?lat=-34.6094&lon=-58.4152"));

    expect(lookupBarrio).toHaveBeenCalledWith(-34.6094, -58.4152);
    expect(await response.json()).toEqual({ barrio: "Almagro" });
  });

  it("rejects out-of-range coordinates and degrades when the barrio lookup fails", async () => {
    const bad = await GET(request("?lat=999&lon=abc"));
    expect(bad.status).toBe(400);

    lookupBarrio.mockRejectedValue(new UsigUnavailableError("down"));
    const down = await GET(request("?lat=-34.6&lon=-58.4"));
    expect(await down.json()).toEqual({ barrio: null, unavailable: true });
  });

  it("answers 400 when neither q nor coordinates are given", async () => {
    const response = await GET(request(""));
    expect(response.status).toBe(400);
  });
});
