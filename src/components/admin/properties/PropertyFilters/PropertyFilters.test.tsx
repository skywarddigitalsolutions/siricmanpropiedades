import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("renders the currency, operation, type, deal status and neighborhood selects", () => {
    render(
      <PropertyFilters
        filters={{}}
        neighborhoods={neighborhoods}
        activeFilterCount={0}
      />,
    );

    expect(screen.getByLabelText("Moneda")).toBeInTheDocument();
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

  it("uses the Código, título o dirección placeholder", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );

    expect(screen.getByLabelText("Buscar")).toHaveAttribute(
      "placeholder",
      "Código, título o dirección",
    );
  });

  it("keeps the status tab as a hidden input so filtering does not drop it", () => {
    const { container } = render(
      <PropertyFilters
        filters={{ publicationStatus: "draft" }}
        neighborhoods={[]}
        activeFilterCount={0}
      />,
    );

    expect(
      container.querySelector('input[type="hidden"][name="publicationStatus"]'),
    ).toHaveValue("draft");
  });

  it("disables the price sorts with a hint until a currency is chosen", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );

    expect(
      screen.getByRole("option", { name: "Precio: menor a mayor" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Precio: mayor a menor" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Elegí una moneda para ordenar por precio."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Moneda"), {
      target: { value: "USD" },
    });

    expect(
      screen.getByRole("option", { name: "Precio: menor a mayor" }),
    ).toBeEnabled();
  });

  it("offers the Sin fotos toggle with value false", () => {
    render(
      <PropertyFilters
        filters={{ hasImages: false }}
        neighborhoods={[]}
        activeFilterCount={1}
      />,
    );

    const toggle = screen.getByRole("checkbox", { name: "Sin fotos" });
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAttribute("name", "hasImages");
    expect(toggle).toHaveAttribute("value", "false");
  });

  it("submits the form when a select changes (filters apply on change)", () => {
    render(
      <PropertyFilters filters={{}} neighborhoods={[]} activeFilterCount={0} />,
    );
    const form = screen.getByRole("search", { name: "Filtrar propiedades" });
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener("submit", onSubmit);

    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "editadas" },
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
