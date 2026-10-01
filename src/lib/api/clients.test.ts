// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, apiFetchRaw } = vi.hoisted(() => ({ apiFetch: vi.fn(), apiFetchRaw: vi.fn() }));
vi.mock("./client", () => ({ apiFetch, apiFetchRaw }));

import { exportClientsCsv, listClients } from "./clients";

beforeEach(() => {
  apiFetch.mockReset();
  apiFetchRaw.mockReset();
});

describe("clients API", () => {
  it("lists clients with only the given filters", async () => {
    apiFetch.mockResolvedValue({ items: [], total: 0 });

    await listClients("jwt", { q: "ana", limit: 20, offset: 40 });

    expect(apiFetch).toHaveBeenCalledWith("/admin/clients?q=ana&limit=20&offset=40", {
      token: "jwt",
    });
  });

  it("omits an empty search", async () => {
    apiFetch.mockResolvedValue({ items: [], total: 0 });

    await listClients("jwt", { q: "", limit: 20, offset: 0 });

    expect(apiFetch).toHaveBeenCalledWith("/admin/clients?limit=20&offset=0", { token: "jwt" });
  });

  it("requests the CSV as a raw response, keeping the search", async () => {
    const response = new Response("email\r\n");
    apiFetchRaw.mockResolvedValue(response);

    expect(await exportClientsCsv("jwt", { q: "ana@mail.com" })).toBe(response);
    expect(apiFetchRaw).toHaveBeenCalledWith("/admin/clients/export.csv?q=ana%40mail.com", {
      token: "jwt",
    });
  });

  it("requests the whole CSV without a search", async () => {
    apiFetchRaw.mockResolvedValue(new Response(""));

    await exportClientsCsv("jwt", {});

    expect(apiFetchRaw).toHaveBeenCalledWith("/admin/clients/export.csv", { token: "jwt" });
  });
});
