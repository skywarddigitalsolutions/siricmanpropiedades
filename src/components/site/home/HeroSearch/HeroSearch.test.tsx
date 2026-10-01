import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import HeroSearch from "./HeroSearch";

afterEach(() => cleanup());

const NEIGHBORHOODS = [{ id: "1", name: "Palermo", slug: "palermo" }];

function setup() {
  const view = render(<HeroSearch neighborhoods={NEIGHBORHOODS} />);
  const form = screen.getByRole("search", { name: "Buscar propiedades" });
  return { ...view, form };
}

describe("HeroSearch", () => {
  it("uses the owner photo as a decorative, priority background", () => {
    const { container } = setup();

    const photo = container.querySelector("img");
    expect(photo).not.toBeNull();
    expect(decodeURIComponent(photo!.getAttribute("src")!)).toContain("/hero.jpeg");
    expect(photo).toHaveAttribute("alt", "");
  });

  it("searches by operation with a segmented control, Comprar/Alquilar wording", () => {
    const { form } = setup();

    const operations = within(form).getByRole("group", { name: "Operación" });
    expect(within(operations).getAllByRole("radio").map((r) => r.getAttribute("value"))).toEqual([
      "",
      "venta",
      "alquiler",
    ]);
    expect(within(operations).getByRole("radio", { name: "Todas" })).toBeChecked();
    expect(within(operations).getByRole("radio", { name: "Comprar" })).toBeInTheDocument();
    expect(within(operations).getByRole("radio", { name: "Alquilar" })).toBeInTheDocument();
  });

  it("offers the property type through the shared select", () => {
    const { form } = setup();

    const tipo = within(form).getByRole("combobox", { name: "Tipo" });
    expect(tipo.tagName).toBe("SELECT");
    expect(tipo).toHaveAttribute("name", "tipo");
    expect(within(tipo).getByRole("option", { name: "Departamento" })).toHaveValue("departamento");
  });

  it("offers rooms as segmented pills, Indistinto by default", () => {
    const { form } = setup();

    const rooms = within(form).getByRole("group", { name: "Ambientes" });
    const radios = within(rooms).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["", "1", "2", "3", "4", "5"]);
    expect(radios.every((r) => r.getAttribute("name") === "ambientes")).toBe(true);
    expect(within(rooms).getByRole("radio", { name: "Indistinto" })).toBeChecked();
    expect(within(rooms).getByRole("radio", { name: "5+" })).toHaveAttribute("value", "5");
  });

  it("keeps the code search reachable under the panel", () => {
    setup();

    const summary = screen.getByText("¿Tenés un código? Buscá por SP-0000");
    expect(summary.closest("details")).not.toBeNull();
    const codeForm = screen.getByRole("search", { name: "Buscar por código" });
    expect(within(codeForm).getByLabelText("Código de la propiedad")).toHaveAttribute(
      "name",
      "codigo",
    );
  });

  it("has a prominent submit button", () => {
    const { form } = setup();
    expect(within(form).getByRole("button", { name: "Buscar" })).toHaveAttribute("type", "submit");
  });
});
