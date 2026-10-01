// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listLeads } = vi.hoisted(() => ({ listLeads: vi.fn() }));
vi.mock("@/lib/api/leads", () => ({ listLeads }));

import { loadNavBadges } from "./nav-badges";

beforeEach(() => {
  listLeads.mockReset();
});

describe("loadNavBadges", () => {
  it("counts new leads with a one-item query", async () => {
    listLeads.mockResolvedValue({ items: [], total: 4 });

    expect(await loadNavBadges("jwt")).toEqual({ "/admin/consultas": 4 });
    expect(listLeads).toHaveBeenCalledWith("jwt", { status: "new", limit: 1 });
  });

  it("returns no badges when the count can't be loaded, so the panel still renders", async () => {
    // Any failure (network, 5xx, expired token) hides the badge.
    listLeads.mockRejectedValue(new Error("No se pudo contactar al servicio."));

    expect(await loadNavBadges("jwt")).toEqual({});
  });
});
