import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen, within } from "@testing-library/react";
import OwnerProcess from "./OwnerProcess";

afterEach(() => cleanup());

const TITLE = "Un proceso claro, de la tasación a la escritura";

const STEPS = [
  [
    "Tasación profesional",
    "Visitamos tu propiedad y la comparamos con operaciones reales de la zona.",
  ],
  ["Plan de venta", "Definimos juntos el precio de publicación y cómo vamos a mostrarla."],
  ["Fotos y difusión", "La presentamos como se merece en los portales y en nuestros canales."],
  [
    "Visitas y negociación",
    "Coordinamos las visitas, filtramos interesados y negociamos por vos.",
  ],
  ["Firma y escritura", "Te acompañamos con la documentación hasta el día de la escritura."],
] as const;

describe("OwnerProcess", () => {
  it("is a section named by its heading, with a selling eyebrow", () => {
    render(<OwnerProcess />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("CÓMO VENDEMOS TU PROPIEDAD")).toBeInTheDocument();
  });

  it("lists the five selling steps in order, each titled by a level-3 heading", () => {
    render(<OwnerProcess />);

    const list = screen.getByRole("list", { name: TITLE });
    const steps = within(list).getAllByRole("listitem");
    expect(steps).toHaveLength(5);
    expect(steps.map((step) => within(step).getByRole("heading", { level: 3 }).textContent)).toEqual(
      STEPS.map(([title]) => title),
    );
    STEPS.forEach(([, text], index) => {
      expect(within(steps[index]).getByText(text)).toBeInTheDocument();
    });
  });

  it("hides the decorative step numbers from assistive tech", () => {
    render(<OwnerProcess />);

    for (const number of ["1", "2", "3", "4", "5"]) {
      expect(isInaccessible(screen.getByText(number))).toBe(true);
    }
    expect(screen.queryByText("6")).not.toBeInTheDocument();
  });

  it("does not mention rentals or invented figures", () => {
    render(<OwnerProcess />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(section.textContent).not.toMatch(/alquil|\+11|días/i);
  });

  it("links the call to action to the selling page", () => {
    render(<OwnerProcess />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute(
      "href",
      "/vender",
    );
  });
});
