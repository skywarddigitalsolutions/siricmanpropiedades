import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PropertyFilters from "./PropertyFilters";

afterEach(() => {
  cleanup();
});

const neighborhoods = [
  { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
  { id: "n2", name: "Belgrano", slug: "belgrano", createdAt: "2024-01-01" },
];

describe("PropertyFilters", () => {
  it("renders a GET search form with the search field always visible", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );

    const form = screen.getByRole("search", { name: "Filtrar propiedades" });
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
  });

  it("pre-fills the search field from the current q filter", () => {
    render(
      <PropertyFilters
        filters={{ q: "casa en venta" }}
        neighborhoods={[]}
        activeFilterCount={0}
      />,
    );

    expect(screen.getByLabelText("Buscar")).toHaveValue("casa en venta");
  });

  it("shows the active filter count on the collapsible summary", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={2} />,
    );

    expect(screen.getByText("Filtros (2)")).toBeInTheDocument();
  });

  it("hides the count when there are no secondary filters", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );

    expect(screen.getByText("Filtros")).toBeInTheDocument();
  });

  it("opens the details element when any secondary filter is active", () => {
    render(
      <PropertyFilters
        filters={{ operation: "sale" }}
        neighborhoods={[]}
        activeFilterCount={1}
      />,
    );

    const details = screen.getByText("Filtros (1)").closest("details");
    expect(details).toHaveAttribute("open");
  });

  it("renders the status, operation, type, deal status and neighborhood selects", () => {
    render(
      <PropertyFilters
        filters={{}}
        neighborhoods={neighborhoods}
        activeFilterCount={0}
      />,
    );

    expect(screen.getByLabelText("Estado de publicación")).toBeInTheDocument();
    expect(screen.getByLabelText("Operación")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Estado comercial")).toBeInTheDocument();
    const neighborhoodSelect = screen.getByLabelText("Barrio");
    expect(neighborhoodSelect).toBeInTheDocument();
    expect(screen.getByText("Palermo")).toBeInTheDocument();
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
  });

  it("renders an Aplicar submit and a Limpiar link back to the bare route", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );

    expect(
      screen.getByRole("button", { name: "Aplicar" }),
    ).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/admin/propiedades",
    );
  });
});
