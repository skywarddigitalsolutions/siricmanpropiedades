// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import {
  archiveProperty,
  createProperty,
  deleteProperty,
  deletePropertyImage,
  getProperty,
  listNeighborhoods,
  listProperties,
  publishProperty,
  reorderPropertyImages,
  unpublishProperty,
  updateDealStatus,
  updateProperty,
  uploadPropertyImage,
  type CreatePropertyInput,
} from "./properties";

describe("properties endpoint functions", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  describe("listProperties", () => {
    it("fetches the plain list endpoint when no filters are given", async () => {
      apiFetch.mockResolvedValue({ items: [], total: 0 });

      await listProperties("token-1");

      expect(apiFetch).toHaveBeenCalledWith("/admin/properties", {
        token: "token-1",
      });
    });

    it("appends only the provided filters as query params", async () => {
      apiFetch.mockResolvedValue({ items: [], total: 0 });

      await listProperties("token-1", {
        publicationStatus: "published",
        q: "Palermo",
        limit: 20,
        offset: 0,
      });

      const [path] = apiFetch.mock.calls[0] as [string, unknown];
      expect(path).toBe(
        "/admin/properties?publicationStatus=published&q=Palermo&limit=20&offset=0",
      );
    });

    it("omits undefined filters entirely", async () => {
      apiFetch.mockResolvedValue({ items: [], total: 0 });

      await listProperties("token-1", {
        operation: undefined,
        q: "casa",
      });

      const [path] = apiFetch.mock.calls[0] as [string, unknown];
      expect(path).toBe("/admin/properties?q=casa");
    });
  });

  it("getProperty fetches the detail endpoint bearing the token", async () => {
    apiFetch.mockResolvedValue({ id: "p1", images: [] });

    await getProperty("token-1", "p1");

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1", {
      token: "token-1",
    });
  });

  it("createProperty posts the input to /admin/properties", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });
    const input: CreatePropertyInput = {
      operation: "sale",
      type: "apartment",
      title: "Depto en Palermo",
      neighborhoodId: "n1",
      address: "Av. Santa Fe 3253",
      currency: "USD",
      price: 150000,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      coveredArea: 65,
      totalArea: 70,
      age: 5,
    };

    await createProperty("token-1", input);

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties", {
      method: "POST",
      body: input,
      token: "token-1",
    });
  });

  it("updateProperty patches the property with a partial input", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await updateProperty("token-1", "p1", { title: "Nuevo título" });

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1", {
      method: "PATCH",
      body: { title: "Nuevo título" },
      token: "token-1",
    });
  });

  it("updateProperty forwards an explicit null to clear description/expenses", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await updateProperty("token-1", "p1", { description: null, expenses: null });

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1", {
      method: "PATCH",
      body: { description: null, expenses: null },
      token: "token-1",
    });
  });

  it("publishProperty patches the publish lifecycle route", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await publishProperty("token-1", "p1");

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1/publish", {
      method: "PATCH",
      token: "token-1",
    });
  });

  it("archiveProperty patches the archive lifecycle route", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await archiveProperty("token-1", "p1");

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1/archive", {
      method: "PATCH",
      token: "token-1",
    });
  });

  it("unpublishProperty patches the unpublish lifecycle route", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await unpublishProperty("token-1", "p1");

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1/unpublish", {
      method: "PATCH",
      token: "token-1",
    });
  });

  it("updateDealStatus patches the deal-status route with the new status", async () => {
    apiFetch.mockResolvedValue({ id: "p1" });

    await updateDealStatus("token-1", "p1", "reserved");

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/properties/p1/deal-status",
      {
        method: "PATCH",
        body: { dealStatus: "reserved" },
        token: "token-1",
      },
    );
  });

  it("deleteProperty sends a DELETE bearing the token", async () => {
    apiFetch.mockResolvedValue(undefined);

    await deleteProperty("token-1", "p1");

    expect(apiFetch).toHaveBeenCalledWith("/admin/properties/p1", {
      method: "DELETE",
      token: "token-1",
    });
  });

  it("uploadPropertyImage posts a single-field FormData named file", async () => {
    apiFetch.mockResolvedValue({ id: "img1" });
    const file = new File(["x"], "photo.webp", { type: "image/webp" });

    await uploadPropertyImage("token-1", "p1", file);

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/properties/p1/images",
      expect.objectContaining({ method: "POST", token: "token-1" }),
    );
    const [, opts] = apiFetch.mock.calls[0] as [string, { body: FormData }];
    const formData = opts.body;
    expect(formData).toBeInstanceOf(FormData);
    expect(Array.from(formData.keys())).toEqual(["file"]);
    expect(formData.get("file")).toBe(file);
  });

  it("reorderPropertyImages puts the new order", async () => {
    apiFetch.mockResolvedValue([]);

    await reorderPropertyImages("token-1", "p1", ["a", "b"]);

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/properties/p1/images/order",
      {
        method: "PUT",
        body: { imageIds: ["a", "b"] },
        token: "token-1",
      },
    );
  });

  it("deletePropertyImage sends a DELETE for the nested image resource", async () => {
    apiFetch.mockResolvedValue(undefined);

    await deletePropertyImage("token-1", "p1", "img1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/properties/p1/images/img1",
      { method: "DELETE", token: "token-1" },
    );
  });

  it("listNeighborhoods fetches the public endpoint with no token", async () => {
    apiFetch.mockResolvedValue([{ id: "n1", name: "Palermo", slug: "palermo" }]);

    await listNeighborhoods();

    expect(apiFetch).toHaveBeenCalledWith("/neighborhoods");
  });
});
