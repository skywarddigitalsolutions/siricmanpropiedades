import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EMPTY_SEARCH, parseSearchParams } from "@/lib/public/search-params";
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
    expect(screen.getByRole("link", { name: "Limpiar todo" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });
});
