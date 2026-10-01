import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { listNeighborhoods } = vi.hoisted(() => ({ listNeighborhoods: vi.fn() }));
vi.mock("@/lib/api/properties", () => ({ listNeighborhoods }));

vi.mock("./actions", () => ({ createPropertyAction: vi.fn() }));

import NewPropertyPage from "./page";

afterEach(() => cleanup());

describe("NewPropertyPage", () => {
  it("renders step 1 of the guided flow with the neighborhoods, USD by default and the later steps disabled", async () => {
    listNeighborhoods.mockResolvedValue([
      { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
    ]);

    render(await NewPropertyPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Nueva propiedad" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Palermo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Moneda")).toHaveValue("USD");
    expect(
      screen.getByRole("button", { name: "Guardar y continuar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 4: Datos")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Fotos/ })).toBeNull();
  });
});
