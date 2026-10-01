import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PropertyPagination from "./PropertyPagination";

afterEach(() => {
  cleanup();
});

describe("PropertyPagination", () => {
  it("renders the total count and current page/total pages", () => {
    render(
      <PropertyPagination page={2} totalPages={5} total={97} filters={{}} />,
    );

    expect(screen.getByText("97 propiedades")).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 5")).toBeInTheDocument();
  });

  it("uses the singular count label for exactly one property", () => {
    render(
      <PropertyPagination page={1} totalPages={1} total={1} filters={{}} />,
    );

    expect(screen.getByText("1 propiedad")).toBeInTheDocument();
  });

  it("has an accessible nav label", () => {
    render(
      <PropertyPagination page={1} totalPages={3} total={50} filters={{}} />,
    );

    expect(
      screen.getByRole("navigation", { name: "Paginación de propiedades" }),
    ).toBeInTheDocument();
  });

  it("links Anterior/Siguiente preserving filters, and disables at bounds", () => {
    render(
      <PropertyPagination
        page={2}
        totalPages={3}
        total={60}
        filters={{ operation: "sale" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/admin/propiedades?operation=sale",
    );
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/admin/propiedades?operation=sale&page=3",
    );
  });

  it("disables Anterior on the first page", () => {
    render(
      <PropertyPagination page={1} totalPages={3} total={60} filters={{}} />,
    );

    expect(
      screen.queryByRole("link", { name: "Anterior" }),
    ).not.toBeInTheDocument();
  });

  it("disables Siguiente on the last page", () => {
    render(
      <PropertyPagination page={3} totalPages={3} total={60} filters={{}} />,
    );

    expect(
      screen.queryByRole("link", { name: "Siguiente" }),
    ).not.toBeInTheDocument();
  });
});
