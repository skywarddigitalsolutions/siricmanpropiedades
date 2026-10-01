import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PropertyStepper from "./PropertyStepper";

afterEach(() => {
  cleanup();
});

describe("PropertyStepper", () => {
  it("lists the four steps and marks the current one", () => {
    render(<PropertyStepper current="fotos" propertyId="p1" />);

    const nav = screen.getByRole("navigation", { name: "Pasos de la propiedad" });
    expect(nav).toBeInTheDocument();
    for (const label of ["Datos", "Fotos", "Descripción y extras", "Vista previa"]) {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /Fotos/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("link", { name: /Datos/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("links every step to its paso on an existing property (free navigation)", () => {
    render(<PropertyStepper current="datos" propertyId="p1" />);

    expect(screen.getByRole("link", { name: /Descripción y extras/ })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1?paso=descripcion",
    );
    expect(screen.getByRole("link", { name: /Vista previa/ })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1?paso=vista-previa",
    );
  });

  it("disables the later steps until the draft exists", () => {
    render(<PropertyStepper current="datos" />);

    expect(screen.queryByRole("link", { name: /Fotos/ })).toBeNull();
    const photos = screen.getByText("Fotos").closest("li");
    expect(photos).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a compact progress label with the step title and a progress bar", () => {
    render(<PropertyStepper current="descripcion" propertyId="p1" />);

    expect(screen.getByText("Paso 3 de 4: Descripción y extras")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
  });
});
