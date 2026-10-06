import { afterEach, describe, expect, it } from "vitest";
import { cleanup, isInaccessible, render, screen, within } from "@testing-library/react";
import OwnerProcess from "./OwnerProcess";

afterEach(() => cleanup());

const TITLE = "Vendé o alquilá sin complicarte";

const STEPS = [
  ["Sabé cuánto vale tu propiedad", "Visitamos y comparamos con operaciones reales de la zona."],
  [
    "Mostrala como se merece",
    "Fotos, valor sugerido y un plan de difusión pensado para tu propiedad.",
  ],
  ["Nosotros nos ocupamos de todo", "Visitas, negociación y acompañamiento hasta la firma."],
] as const;

describe("OwnerProcess", () => {
  it("is a section named by its heading, with an eyebrow", () => {
    render(<OwnerProcess />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("PARA PROPIETARIOS")).toBeInTheDocument();
  });

  it("lists the three steps in order, each titled by a level-3 heading", () => {
    render(<OwnerProcess />);

    const list = screen.getByRole("list", { name: TITLE });
    const steps = within(list).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps.map((step) => within(step).getByRole("heading", { level: 3 }).textContent)).toEqual(
      STEPS.map(([title]) => title),
    );
    STEPS.forEach(([, text], index) => {
      expect(within(steps[index]).getByText(text)).toBeInTheDocument();
    });
  });

  it("hides the decorative step numbers from assistive tech", () => {
    render(<OwnerProcess />);

    for (const number of ["1", "2", "3"]) {
      expect(isInaccessible(screen.getByText(number))).toBe(true);
    }
    expect(screen.queryByText("4")).not.toBeInTheDocument();
  });

  it("no longer shows the trust card", () => {
    render(<OwnerProcess />);

    expect(
      screen.queryByRole("complementary", { name: "Por qué elegirnos" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\+11/)).not.toBeInTheDocument();
  });

  it("links the call to action to the appraisal page", () => {
    render(<OwnerProcess />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
  });
});
