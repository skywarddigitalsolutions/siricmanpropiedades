import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

afterEach(cleanup);

const hrefFor = (page: number) => `/x?pagina=${page}`;

function setup(page: number, totalPages: number) {
  return render(
    <Pagination
      label="Paginación de prueba"
      page={page}
      totalPages={totalPages}
      totalLabel="240 cosas"
      hrefFor={hrefFor}
    />,
  );
}

describe("Pagination", () => {
  it("shows the total and an accessible nav", () => {
    setup(5, 12);

    expect(screen.getByText("240 cosas")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Paginación de prueba" })).toBeInTheDocument();
  });

  it("renders numbered links with ellipses: 1 ... 4 5 6 ... 12", () => {
    setup(5, 12);

    const nav = screen.getByRole("navigation");
    const texts = Array.from(nav.querySelectorAll("li")).map((li) => li.textContent);
    // First and last items are the prev/next icon buttons.
    expect(texts.slice(1, -1)).toEqual(["1", "…", "4", "5", "6", "…", "12"]);
    expect(screen.getByRole("link", { name: "Página 4" })).toHaveAttribute("href", "/x?pagina=4");
  });

  it("marks the current page with aria-current and no link", () => {
    setup(5, 12);

    const current = screen.getByText("5");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Página 5" })).not.toBeInTheDocument();
  });

  it("links Anterior/Siguiente as icon buttons with accessible names", () => {
    setup(5, 12);

    const previous = screen.getByRole("link", { name: "Anterior" });
    const next = screen.getByRole("link", { name: "Siguiente" });
    expect(previous).toHaveAttribute("href", "/x?pagina=4");
    expect(next).toHaveAttribute("href", "/x?pagina=6");
    expect(previous.querySelector("svg")).not.toBeNull();
    expect(next.querySelector("svg")).not.toBeNull();
  });

  it("disables Anterior on the first page and Siguiente on the last", () => {
    setup(1, 3);
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Anterior")).toHaveAttribute("aria-disabled", "true");
    cleanup();

    setup(3, 3);
    expect(screen.queryByRole("link", { name: "Siguiente" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Siguiente")).toHaveAttribute("aria-disabled", "true");
  });

  it("still announces the current position to screen readers", () => {
    setup(2, 5);
    expect(screen.getByText("Página 2 de 5")).toBeInTheDocument();
  });
});
