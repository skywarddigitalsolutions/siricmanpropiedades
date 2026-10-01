// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import { deleteLead, getLead, listLeads, submitLead, updateLead } from "./leads";

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockResolvedValue({});
});

describe("leads API", () => {
  it("submits a public lead without a token (the BFF forwards the visitor IP)", async () => {
    await submitLead({
      type: "property_inquiry",
      propertyId: "p1",
      name: "Ana",
      phone: "1155554444",
    });

    expect(apiFetch).toHaveBeenCalledWith("/leads", {
      method: "POST",
      body: { type: "property_inquiry", propertyId: "p1", name: "Ana", phone: "1155554444" },
    });
  });

  it("lists leads with only the given filters", async () => {
    await listLeads("jwt", { status: "new", limit: 20, offset: 0, type: undefined });

    expect(apiFetch).toHaveBeenCalledWith("/admin/leads?status=new&limit=20&offset=0", {
      token: "jwt",
    });
  });

  it("reads, updates and deletes a lead", async () => {
    await getLead("jwt", "l1");
    await updateLead("jwt", "l1", { status: "contacted", notes: "" });
    await deleteLead("jwt", "l1");

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/admin/leads/l1", { token: "jwt" });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/admin/leads/l1", {
      method: "PATCH",
      body: { status: "contacted", notes: "" },
      token: "jwt",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/admin/leads/l1", {
      method: "DELETE",
      token: "jwt",
    });
  });
});

describe("leads API inbox filters", () => {
  it("sends the search and property filters", async () => {
    await listLeads("jwt", { q: "ana@mail.com", propertyId: "p-uuid", limit: 20, offset: 0 });

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/leads?q=ana%40mail.com&propertyId=p-uuid&limit=20&offset=0",
      { token: "jwt" },
    );
  });
});
