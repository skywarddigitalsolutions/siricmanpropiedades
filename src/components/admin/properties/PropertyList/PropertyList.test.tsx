import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Property } from "@/lib/api/properties";
import PropertyList from "./PropertyList";

afterEach(() => {
  cleanup();
});

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

describe("PropertyList", () => {
  it("renders each property's title, code, operation/type, neighborhood, price and badges", () => {
    render(
      <PropertyList
        properties={[makeProperty()]}
        hasActiveFilters={false}
      />,
    );

    expect(screen.getAllByText("Casa en Palermo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SP-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Palermo").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/USD 150.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Publicada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
  });

  it("links each property to its editor route", () => {
    render(
      <PropertyList
        properties={[makeProperty({ id: "p42" })]}
        hasActiveFilters={false}
      />,
    );

    const links = screen.getAllByRole("link", { name: /Casa en Palermo/ });
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/admin/propiedades/p42");
    }
  });

  it("shows the empty-catalog message with a create CTA when there are no filters", () => {
    render(<PropertyList properties={[]} hasActiveFilters={false} />);

    expect(
      screen.getByText(/[Tt]odavía no hay propiedades/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crear la primera propiedad" }),
    ).toHaveAttribute("href", "/admin/propiedades/nueva");
  });

  it("shows the no-results message with a clear-filters CTA when filters are active", () => {
    render(<PropertyList properties={[]} hasActiveFilters={true} />);

    expect(
      screen.getByText(/No se encontraron propiedades/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }),
    ).toHaveAttribute("href", "/admin/propiedades");
  });
});
