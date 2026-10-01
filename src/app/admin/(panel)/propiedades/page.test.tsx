import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import type { Property } from "@/lib/api/properties";

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

const { getSessionToken } = vi.hoisted(() => ({ getSessionToken: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getSessionToken }));

import { ApiError } from "@/lib/api/client";
import AdminPropertiesPage from "./page";

function makeProperty(overrides: Partial<Property> = {}): Property {
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
    ...overrides,
  };
}

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
    listProperties.mockResolvedValue({ items: [makeProperty()], total: 1 });

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

  it("renders the fetched properties and the Nueva propiedad action", async () => {
    listProperties.mockResolvedValue({ items: [makeProperty()], total: 1 });

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

  it("passes the fetched neighborhoods into the filters' barrio select", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0 });
    listNeighborhoods.mockResolvedValue([
      { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
    ]);

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(screen.getByText("Palermo")).toBeInTheDocument();
  });

  it("shows the empty-catalog state when there are no properties and no filters", async () => {
    listProperties.mockResolvedValue({ items: [], total: 0 });

    const page = await AdminPropertiesPage({ searchParams: searchParamsOf({}) });
    render(page);

    expect(
      screen.getByRole("link", { name: "Crear la primera propiedad" }),
    ).toBeInTheDocument();
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
