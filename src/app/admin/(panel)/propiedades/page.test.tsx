import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { PropertyListItem } from "@/lib/api/properties";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { listProperties, listNeighborhoods } = vi.hoisted(() => ({
  listProperties: vi.fn(),
  listNeighborhoods: vi.fn(),
}));
vi.mock("@/lib/api/properties", () => ({ listProperties, listNeighborhoods }));

vi.mock("@/app/admin/(panel)/propiedades/[id]/lifecycle-actions", () => ({
  changePublicationAction: vi.fn(),
}));

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import AdminPropertiesPage from "./page";

function makeProperty(
  overrides: Partial<PropertyListItem> = {},
): PropertyListItem {
  return {
    id: "p1",
    code: "SP-0001",
    slug: "casa-en-palermo",
    operation: "sale",
    type: "house",
    title: "Casa en Palermo",
    description: null,
    neighborhood: {
      id: "n1",
      name: "Palermo",
      slug: "palermo",
      createdAt: "2024-01-01",
    },
    address: "Av. Siempre Viva 123",
    showExactAddress: true,
    currency: "USD",
    price: 150000,
    expenses: null,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    hasGarage: true,
    coveredArea: 120,
    totalArea: 150,
    age: 10,
    creditEligible: false,
    petsAllowed: true,
    immediateAvailability: true,
    marketingTag: "none",
    featured: false,
    hasWater: true,
    hasNaturalGas: true,
    hasSewer: true,
    hasElectricity: true,
    hasInternet: true,
    publicationStatus: "published",
    dealStatus: "available",
    firstPublishedAt: "2024-02-01",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
    coverThumbnailUrl: null,
    imageCount: 0,
    ...overrides,
  };
}

const COUNTS = { draft: 2, published: 5, archived: 1 };

function searchParamsOf(
  params: Record<string, string | string[] | undefined>,
) {
  return Promise.resolve(params);
}

describe("AdminPropertiesPage", () => {
  beforeEach(() => {
    listProperties.mockReset();
    listNeighborhoods.mockReset();
    getSessionToken.mockReset();
    getSessionToken.mockResolvedValue("jwt-admin");
    listNeighborhoods.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("forwards parsed filters, limit and offset to listProperties with the session token", async () => {
    listProperties.mockResolvedValue({ items: [makeProperty()], total: 1, counts: COUNTS });

    await AdminPropertiesPage({
      searchParams: searchParamsOf({ q: "casa", operation: "sale", page: "2" }),
    });

    expect(listProperties).toHaveBeenCalledWith("jwt-admin", {
      q: "casa",
      operation: "sale",
      limit: 20,
      offset: 20,
    });
  });

  it("forwards currency, hasImages and the mapped sort to listProperties", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    await AdminPropertiesPage({
      searchParams: searchParamsOf({
        currency: "USD",
        hasImages: "false",
        orden: "precio-asc",
      }),
    });

    expect(listProperties).toHaveBeenCalledWith("jwt-admin", {
      currency: "USD",
      hasImages: false,
      sort: "price",
      order: "asc",
      limit: 20,
      offset: 0,
    });
  });

  it("shows the status chips with the counts from the back", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(screen.getByRole("link", { name: "Publicadas 5" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Todas 8" })).toBeInTheDocument();
  });

  it("renders the fetched properties and the Nueva propiedad action", async () => {
    listProperties.mockResolvedValue({ items: [makeProperty()], total: 1, counts: COUNTS });

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Propiedades" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nueva propiedad" }),
    ).toHaveAttribute("href", "/admin/propiedades/nueva");
    expect(screen.getAllByText("Casa en Palermo").length).toBeGreaterThan(0);
  });

  it("puts a plus icon on the Nueva propiedad action", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(
      screen.getByRole("link", { name: "Nueva propiedad" }).querySelector("svg"),
    ).not.toBeNull();
  });

  it("passes the fetched neighborhoods into the filters' barrio select", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });
    listNeighborhoods.mockResolvedValue([
      { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
    ]);

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(screen.getByText("Palermo")).toBeInTheDocument();
  });

  it("shows the empty-catalog state when there are no properties and no filters", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(
      screen.getByRole("link", { name: "Crear la primera propiedad" }),
    ).toBeInTheDocument();
  });

  it("confirms a deletion when coming back from the editor", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0, counts: COUNTS });

    const page = await AdminPropertiesPage({
      searchParams: searchParamsOf({ eliminada: "1" }),
    });
    render(page);

    expect(screen.getByRole("status")).toHaveTextContent("Propiedad eliminada.");
  });

  it("redirects to /admin/login?reason=expired on a 401 from listProperties", async () => {
    listProperties.mockRejectedValue(new ApiError(401, "Invalid or expired token"));

    await expectRedirect(
      AdminPropertiesPage({ searchParams: searchParamsOf({}) }),
      "/admin/login?reason=expired",
    );
  });

  it("renders an empty list with a notice instead of crashing on a 400", async () => {
    listProperties.mockRejectedValue(new ApiError(400, "Bad request"));

    const page = await AdminPropertiesPage({
      searchParams: searchParamsOf({ operation: "sale" }),
    });
    render(page);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("lets a non-401/400 ApiError bubble for the error.tsx boundary", async () => {
    const error = new ApiError(0, "No se pudo contactar al servicio.");
    listProperties.mockRejectedValue(error);

    await expect(
      AdminPropertiesPage({ searchParams: searchParamsOf({}) }),
    ).rejects.toBe(error);
  });
});
