import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EMPTY_SEARCH, clearFiltersHref, parseSearchParams } from "@/lib/public/search-params";
import ActiveFilters from "./ActiveFilters";

afterEach(() => cleanup());

const neighborhoods = [{ id: "1", name: "Palermo", slug: "palermo" }];

describe("ActiveFilters", () => {
  it("renders nothing without filters", () => {
    const { container } = render(
      <ActiveFilters state={EMPTY_SEARCH} neighborhoods={neighborhoods} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists removable chips and a clear-all link that keeps the operation", () => {
    const state = parseSearchParams({ operacion: "venta", barrio: "palermo", tipo: "casa" });
    render(<ActiveFilters state={state} neighborhoods={neighborhoods} />);

    expect(screen.getByRole("link", { name: "Quitar filtro: Palermo" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&tipo=casa",
    );
    expect(screen.getByRole("link", { name: "Quitar filtro: Casa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });

  it("can hide its clear link while keeping the chips", () => {
    const state = parseSearchParams({ operacion: "venta", barrio: "palermo" });
    render(<ActiveFilters state={state} neighborhoods={neighborhoods} showClear={false} />);

    expect(screen.getByRole("link", { name: "Quitar filtro: Palermo" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Limpiar filtros" })).toBeNull();
  });

  it("clears every filter (barrios, price, switches, code) but keeps operation and sort", () => {
    const state = parseSearchParams({
      operacion: "alquiler",
      barrio: "palermo",
      desde: "100000",
      cochera: "1",
      codigo: "SP-0101",
      orden: "mayor-precio",
    });
    render(<ActiveFilters state={state} neighborhoods={neighborhoods} />);

    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      clearFiltersHref(state),
    );
    expect(clearFiltersHref(state)).toBe("/propiedades?operacion=alquiler&orden=mayor-precio");
  });
});
