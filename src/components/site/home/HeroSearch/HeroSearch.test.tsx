import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dropdownValue } from "@/test/dropdown";
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
    expect(decodeURIComponent(photo!.getAttribute("src")!)).toContain("/hero.jpg");
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

  it("offers the property type through the shared dropdown", async () => {
    const user = userEvent.setup();
    const { form } = setup();

    const tipo = within(form).getByRole("combobox", { name: "Tipo" });
    expect(tipo.tagName).toBe("BUTTON");
    expect(tipo).toHaveTextContent("Todos");
    expect(dropdownValue(tipo)).toBe("");
    expect(form.querySelector('input[type="hidden"][name="tipo"]')).not.toBeNull();

    await user.click(tipo);
    await user.click(screen.getByRole("option", { name: "Departamento" }));

    expect(dropdownValue(tipo)).toBe("departamento");
  });

  it("offers rooms through the shared dropdown, Indistinto by default", async () => {
    const user = userEvent.setup();
    const { form } = setup();

    const rooms = within(form).getByRole("combobox", { name: "Ambientes" });
    expect(rooms).toHaveTextContent("Indistinto");
    expect(form.querySelector('input[type="hidden"][name="ambientes"]')).toHaveValue("");

    await user.click(rooms);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Indistinto", "1", "2", "3", "4", "5+"]);
    await user.click(screen.getByRole("option", { name: "5+" }));

    expect(dropdownValue(rooms)).toBe("5");
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
