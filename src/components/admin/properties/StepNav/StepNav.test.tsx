import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StepNav from "./StepNav";

afterEach(() => {
  cleanup();
});

describe("StepNav", () => {
  it("links to the previous and next steps", () => {
    render(<StepNav propertyId="p1" current="fotos" />);

    expect(screen.getByRole("link", { name: /Anterior: Datos/ })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1?paso=datos",
    );
    expect(
      screen.getByRole("link", { name: /Siguiente: Descripción y extras/ }),
    ).toHaveAttribute("href", "/admin/propiedades/p1?paso=descripcion");
  });

  it("has no previous link on the first step and no next on the last", () => {
    const { rerender } = render(<StepNav propertyId="p1" current="datos" />);
    expect(screen.queryByRole("link", { name: /Anterior/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Siguiente: Fotos/ })).toBeInTheDocument();

    rerender(<StepNav propertyId="p1" current="vista-previa" />);
    expect(screen.queryByRole("link", { name: /Siguiente/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Anterior: Descripción y extras/ })).toBeInTheDocument();
  });
});
