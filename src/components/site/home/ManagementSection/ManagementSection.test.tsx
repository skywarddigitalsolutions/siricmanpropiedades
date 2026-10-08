import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import ManagementSection from "./ManagementSection";

afterEach(() => cleanup());

const TITLE = "¿Tenés una propiedad alquilada? Nosotros la administramos";

describe("ManagementSection", () => {
  it("is a section named by its heading, with an eyebrow and a lead", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("ADMINISTRACIÓN DE ALQUILERES")).toBeInTheDocument();
    expect(
      within(section).getByText(
        "Cobramos el alquiler, te rendimos cuentas todos los meses y nos ocupamos del inquilino.",
      ),
    ).toBeInTheDocument();
  });

  it("lists the three rental management benefits", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Cobranza mensual y rendición de cuentas",
      "Ajustes de contrato y renovaciones",
      "Mantenimiento y relación con el inquilino",
    ]);
  });

  it("links to the rental administration page", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(
      within(section).getByRole("link", { name: "Conocé el servicio" }),
    ).toHaveAttribute("href", "/administracion-de-alquileres");
    expect(within(section).getAllByRole("link")).toHaveLength(1);
  });

  it("no longer carries the consortium block or its years claim", () => {
    render(<ManagementSection />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).queryByText(/consorcio/i)).not.toBeInTheDocument();
    expect(section.textContent).not.toMatch(/11 años/);
  });
});
