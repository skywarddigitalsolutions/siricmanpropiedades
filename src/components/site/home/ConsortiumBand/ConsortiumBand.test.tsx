import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import ConsortiumBand from "./ConsortiumBand";

afterEach(() => cleanup());

describe("ConsortiumBand", () => {
  it("is a compact section named by its heading, with an eyebrow", () => {
    render(<ConsortiumBand />);

    const section = screen.getByRole("region", { name: "Administración de consorcios" });
    expect(
      within(section).getByRole("heading", { level: 2, name: "Administración de consorcios" }),
    ).toBeInTheDocument();
    expect(within(section).getByText("CONSORCIOS")).toBeInTheDocument();
  });

  it("names Ana María Fierro Pedrayes as the administrator, with her 15 years", () => {
    render(<ConsortiumBand />);

    expect(
      screen.getByText(
        "Administración a cargo de Ana María Fierro Pedrayes, con 15 años de trayectoria. Liquidación de expensas, mantenimiento y asambleas, con trato directo.",
      ),
    ).toBeInTheDocument();
  });

  it("links to the consortium administration page", () => {
    render(<ConsortiumBand />);

    expect(
      screen.getByRole("link", { name: "Conocé la administración de consorcios" }),
    ).toHaveAttribute("href", "/administracion-de-consorcios");
  });
});
