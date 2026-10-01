import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { listNeighborhoods } = vi.hoisted(() => ({ listNeighborhoods: vi.fn() }));
vi.mock("@/lib/api/properties", () => ({ listNeighborhoods }));

vi.mock("./actions", () => ({ createPropertyAction: vi.fn() }));

import NewPropertyPage from "./page";

afterEach(() => cleanup());

describe("NewPropertyPage", () => {
  it("renders an empty create form with the neighborhoods", async () => {
    listNeighborhoods.mockResolvedValue([
      { id: "n1", name: "Palermo", slug: "palermo", createdAt: "2024-01-01" },
    ]);

    render(await NewPropertyPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Nueva propiedad" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Palermo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Crear propiedad" })).toBeInTheDocument();
  });
});
