import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { PropertyListItem } from "@/lib/api/properties";
import PropertyList from "./PropertyList";

afterEach(() => {
  cleanup();
});

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
    coverThumbnailUrl: "https://media.test/p1-thumb.webp",
    imageCount: 3,
    ...overrides,
  };
}

const publicationAction = vi.fn();

describe("PropertyList", () => {
  it("renders each property's title, code, operation/type, neighborhood, price and badges", () => {
    render(
      <PropertyList
        properties={[makeProperty()]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    expect(screen.getAllByText("Casa en Palermo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SP-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Palermo").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/US[$] 150.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Publicada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
  });

  it("links each property to its editor route", () => {
    render(
      <PropertyList
        properties={[makeProperty({ id: "p42" })]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Casa en Palermo" });
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/admin/propiedades/p42");
    }
  });

  it("shows the empty-catalog message with a create CTA when there are no filters", () => {
    render(<PropertyList
        properties={[]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />);

    expect(
      screen.getByText(/[Tt]odavía no hay propiedades/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crear la primera propiedad" }),
    ).toHaveAttribute("href", "/admin/propiedades/nueva");
  });

  it("shows the no-results message with a clear-filters CTA when filters are active", () => {
    render(<PropertyList
        properties={[]}
        hasActiveFilters={true}
        publicationAction={publicationAction}
      />);

    expect(
      screen.getByText(/No se encontraron propiedades/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }),
    ).toHaveAttribute("href", "/admin/propiedades");
  });

  it("shows the cover thumbnail on the cards and the table, with a photo count badge", () => {
    render(
      <PropertyList
        properties={[makeProperty({ imageCount: 5 })]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    expect(
      document.querySelectorAll('img[src="https://media.test/p1-thumb.webp"]'),
    ).toHaveLength(2);
    expect(screen.getAllByText("5 fotos").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sin fotos")).not.toBeInTheDocument();
  });

  it("shows a 'Sin fotos' chip instead of an image when there are no photos", () => {
    render(
      <PropertyList
        properties={[makeProperty({ imageCount: 0, coverThumbnailUrl: null })]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getAllByText("Sin fotos").length).toBeGreaterThan(0);
  });

  it("offers 'Ver en el sitio' only for published properties", () => {
    render(
      <PropertyList
        properties={[
          makeProperty({ id: "a", slug: "pub", publicationStatus: "published" }),
          makeProperty({ id: "b", slug: "draft", publicationStatus: "draft" }),
        ]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    const links = screen.getAllByRole("link", { name: /Ver en el sitio/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/propiedades/pub");
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("offers Retirar for published and Publicar for drafts via the lifecycle action", () => {
    render(
      <PropertyList
        properties={[
          makeProperty({ id: "a", title: "Uno", publicationStatus: "published" }),
          makeProperty({ id: "b", title: "Dos", publicationStatus: "draft" }),
        ]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    expect(
      screen.getAllByRole("button", { name: "Retirar Uno" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Publicar Dos" }).length,
    ).toBeGreaterThan(0);
  });

  it("does not nest interactive controls inside the title link", () => {
    render(
      <PropertyList
        properties={[makeProperty()]}
        hasActiveFilters={false}
        publicationAction={publicationAction}
      />,
    );

    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("button, a")).toBeNull();
    }
  });
});
