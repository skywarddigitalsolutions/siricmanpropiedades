import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { makePublicProperty } from "@/test/fixtures/public-property";

const { listPublicProperties, getPublicNeighborhoods } = vi.hoisted(() => ({
  listPublicProperties: vi.fn(),
  getPublicNeighborhoods: vi.fn(),
}));
vi.mock("@/lib/api/public-catalog", () => ({ listPublicProperties, getPublicNeighborhoods }));

import { ApiError } from "@/lib/api/client";
import Home from "./page";

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getPublicNeighborhoods.mockResolvedValue([
    { id: "n1", name: "Palermo", slug: "palermo" },
    { id: "n2", name: "Belgrano", slug: "belgrano" },
  ]);
  listPublicProperties.mockResolvedValue({ items: [makePublicProperty()], total: 1 });
});

describe("Home page", () => {
  it("renders the hero search that submits to the results page", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { level: 1, name: "Encontrá tu próxima propiedad en CABA" }),
    ).toBeInTheDocument();
    const form = screen.getByRole("search", { name: "Buscar propiedades" });
    expect(form).toHaveAttribute("action", "/propiedades");
    expect(within(form).getByRole("combobox", { name: "Ubicación" })).toBeInTheDocument();
    expect(form.querySelector('input[type="hidden"][name="barrio"]')).toHaveValue("");
    expect(within(form).getByRole("radio", { name: "Comprar" })).toHaveAttribute("value", "venta");
  });

  it("shows the featured properties", async () => {
    render(await Home());

    expect(listPublicProperties).toHaveBeenCalledWith({ featured: true, limit: 6 });
    expect(screen.getByRole("heading", { level: 2, name: "Destacadas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luminoso 3 ambientes/ })).toBeInTheDocument();
  });

  it("falls back to the newest properties when none is featured", async () => {
    listPublicProperties
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({ items: [makePublicProperty({ title: "PH reciclado" })], total: 1 });

    render(await Home());

    expect(listPublicProperties).toHaveBeenLastCalledWith({ limit: 6 });
    expect(screen.getByRole("heading", { level: 2, name: "Recién publicadas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /PH reciclado/ })).toBeInTheDocument();
  });

  it("still renders when the catalog is unavailable", async () => {
    listPublicProperties.mockRejectedValue(new ApiError(0, "down"));
    getPublicNeighborhoods.mockRejectedValue(new ApiError(0, "down"));

    render(await Home());

    expect(screen.getByRole("search", { name: "Buscar propiedades" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Destacadas" })).toBeNull();
    expect(screen.getByRole("link", { name: /Solicitar tasación/ })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
  });

  it("describes the agency as schema.org JSON-LD", async () => {
    const { container } = render(await Home());

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toMatchObject({ "@type": "RealEstateAgent" });
  });

  it("links the property types to filtered results", async () => {
    render(await Home());

    expect(screen.getByRole("link", { name: "Departamentos" })).toHaveAttribute(
      "href",
      "/propiedades?tipo=departamento",
    );
    expect(screen.getByRole("link", { name: "PH" })).toHaveAttribute("href", "/propiedades?tipo=ph");
  });
});
