import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EMPTY_SEARCH } from "@/lib/public/search-params";
import ResultsPagination from "./ResultsPagination";

afterEach(() => cleanup());

describe("ResultsPagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<ResultsPagination state={EMPTY_SEARCH} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("numbers the pages, marks the current one and keeps the filters in links", () => {
    render(
      <ResultsPagination state={{ ...EMPTY_SEARCH, operation: "sale", page: 6 }} totalPages={12} />,
    );

    expect(screen.getByRole("link", { name: "Página 5" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&pagina=5",
    );
    expect(screen.getByRole("link", { name: "Página 1" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
    const current = screen.getByText("6", { selector: "[aria-current='page']" });
    expect(current).toBeInTheDocument();
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("rel", "prev");
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute("rel", "next");
  });

  it("hides the previous link on the first page", () => {
    render(<ResultsPagination state={EMPTY_SEARCH} totalPages={3} />);
    expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
    expect(screen.getByRole("link", { name: "Siguiente" })).toBeInTheDocument();
  });
});
