// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import {
  CATALOG_REVALIDATE_SECONDS,
  NEIGHBORHOODS_REVALIDATE_SECONDS,
  getPublicNeighborhoods,
  getPublicProperty,
  listPublicProperties,
} from "./public-catalog";

describe("public catalog client", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ items: [], total: 0 });
  });

  it("lists published properties through the data cache with only the given filters", async () => {
    await listPublicProperties({
      operation: "sale",
      neighborhood: "palermo",
      minRooms: 2,
      hasGarage: true,
      featured: undefined,
      limit: 12,
      offset: 24,
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/properties?operation=sale&neighborhood=palermo&minRooms=2&hasGarage=true&limit=12&offset=24",
      { revalidate: CATALOG_REVALIDATE_SECONDS },
    );
  });

  it("lists without a query string when no filter is given", async () => {
    await listPublicProperties({});

    expect(apiFetch).toHaveBeenCalledWith("/properties", {
      revalidate: CATALOG_REVALIDATE_SECONDS,
    });
  });

  it("gets a property by its URL-encoded slug", async () => {
    apiFetch.mockResolvedValue({ slug: "casa-en-palermo", images: [] });

    await getPublicProperty("casa en palermo");

    expect(apiFetch).toHaveBeenCalledWith("/properties/casa%20en%20palermo", {
      revalidate: CATALOG_REVALIDATE_SECONDS,
    });
  });

  it("caches the neighborhood list for longer", async () => {
    apiFetch.mockResolvedValue([]);

    await getPublicNeighborhoods();

    expect(apiFetch).toHaveBeenCalledWith("/neighborhoods", {
      revalidate: NEIGHBORHOODS_REVALIDATE_SECONDS,
    });
    expect(NEIGHBORHOODS_REVALIDATE_SECONDS).toBeGreaterThan(
      CATALOG_REVALIDATE_SECONDS,
    );
  });
});
