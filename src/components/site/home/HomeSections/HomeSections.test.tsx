import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import { ServicesGrid } from "./HomeSections";

afterEach(() => cleanup());

const TITLE = "Todo lo que necesitás, en un solo lugar";

const SERVICES = [
  ["Comprar", buildSearchHref(EMPTY_SEARCH, { operation: "sale" })],
  ["Alquilar", buildSearchHref(EMPTY_SEARCH, { operation: "rent" })],
  ["Vender o tasar", "/tasaciones"],
  ["Administración de consorcios", "/administracion-de-consorcios"],
] as const;

describe("ServicesGrid", () => {
  it("is a section named by its heading, with an eyebrow and a lead", () => {
    render(<ServicesGrid />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("SERVICIOS")).toBeInTheDocument();
    expect(
      within(section).getByText(
        "Compramos, vendemos, alquilamos y administramos. Un mismo equipo en cada paso.",
      ),
    ).toBeInTheDocument();
  });

  it("lists the four services in order, each as one full-row link", () => {
    render(<ServicesGrid />);

    const section = screen.getByRole("region", { name: TITLE });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(SERVICES.length);
    SERVICES.forEach(([title, href], index) => {
      const links = within(items[index]).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(expect.stringContaining(title));
      expect(links[0]).toHaveAttribute("href", href);
    });
  });

  it("titles each service with a level-3 heading", () => {
    render(<ServicesGrid />);

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(SERVICES.map(([title]) => title));
  });

  it("links the consortium row to the consortium administration page", () => {
    render(<ServicesGrid />);

    expect(screen.getByRole("link", { name: /Administración de consorcios/ })).toHaveAttribute(
      "href",
      "/administracion-de-consorcios",
    );
  });
});
