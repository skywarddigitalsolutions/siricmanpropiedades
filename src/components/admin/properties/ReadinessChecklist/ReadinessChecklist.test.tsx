import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { computeReadiness } from "@/lib/properties/readiness";
import ReadinessChecklist from "./ReadinessChecklist";

afterEach(() => {
  cleanup();
});

describe("ReadinessChecklist", () => {
  it("shows each requirement and where to fix the pending ones", () => {
    render(
      <ReadinessChecklist
        propertyId="p1"
        readiness={computeReadiness({ imageCount: 0, description: "corta", price: 1000 })}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("Al menos una foto").closest("li")).toHaveTextContent(
      "Pendiente",
    );
    expect(screen.getByText("Precio cargado").closest("li")).toHaveTextContent("Listo");
    expect(screen.getByRole("link", { name: "Cargá fotos en el paso 2." })).toHaveAttribute(
      "href",
      "/admin/propiedades/p1?paso=fotos",
    );
    expect(
      screen.getByRole("link", { name: "Escribila en el paso 3." }),
    ).toHaveAttribute("href", "/admin/propiedades/p1?paso=descripcion");
    expect(screen.getByText(/Faltan 2 requisitos para publicar/)).toBeInTheDocument();
  });

  it("says the property is ready to publish when everything is done", () => {
    render(
      <ReadinessChecklist
        propertyId="p1"
        readiness={computeReadiness({
          imageCount: 2,
          description: "x".repeat(60),
          price: 1000,
        })}
      />,
    );

    expect(screen.getByText("Lista para publicar")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
