import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen, within } from "@testing-library/react";
import BuyerSearch from "./BuyerSearch";

afterEach(() => cleanup());

const TITLE = "¿Buscás comprar o alquilar?";
// Title and subtitle joined by a visually hidden comma (engines differ on the
// whitespace around it).
const BUY_NAME = /^Comprar,\s*Propiedades en venta$/;
const RENT_NAME = /^Alquilar,\s*Propiedades en alquiler$/;

const TYPE_LINKS = [
  ["Departamentos", "/propiedades?tipo=departamento"],
  ["Casas", "/propiedades?tipo=casa"],
  ["PH", "/propiedades?tipo=ph"],
  ["Terrenos", "/propiedades?tipo=terreno"],
  ["Locales", "/propiedades?tipo=local"],
  ["Oficinas", "/propiedades?tipo=oficina"],
  ["Cocheras", "/propiedades?tipo=cochera"],
] as const;

describe("BuyerSearch", () => {
  it("is a section named by its heading, with an eyebrow", () => {
    render(<BuyerSearch />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("PARA QUIENES BUSCAN")).toBeInTheDocument();
  });

  it("links the buy card to sale listings, named by its visible text", () => {
    render(<BuyerSearch />);

    expect(screen.getByRole("link", { name: BUY_NAME })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });

  it("links the rent card to rental listings, named by its visible text", () => {
    render(<BuyerSearch />);

    expect(screen.getByRole("link", { name: RENT_NAME })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler",
    );
  });

  it("keeps the card photos decorative", () => {
    render(<BuyerSearch />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    for (const name of [BUY_NAME, RENT_NAME]) {
      const photo = screen.getByRole("link", { name }).querySelector("img");
      expect(photo).toHaveAttribute("alt", "");
    }
  });

  it("lists every property type as a link to its filtered results", () => {
    render(<BuyerSearch />);

    expect(
      screen.getByRole("heading", { level: 3, name: "¿Qué tipo de propiedad?" }),
    ).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "¿Qué tipo de propiedad?" });
    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual(TYPE_LINKS);
  });

  it("hides the decorative icons from assistive tech", () => {
    render(<BuyerSearch />);

    const link = screen.getByRole("link", { name: "Departamentos" });
    const icon = link.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(isInaccessible(icon!)).toBe(true);
  });

  it("links to all the listings", () => {
    render(<BuyerSearch />);

    expect(screen.getByRole("link", { name: "Ver todas las propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
  });
});
