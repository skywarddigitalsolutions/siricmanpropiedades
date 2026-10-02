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

  it("shows featured sale and rent sections", async () => {
    listPublicProperties.mockImplementation(async (filters: { operation?: string }) => {
      const isSale = filters.operation === "sale";
      return {
        items: ["a", "b", "c"].map((id) =>
          makePublicProperty({
            id: `${filters.operation}-${id}`,
            slug: `${filters.operation}-${id}`,
            title: `${isSale ? "Venta" : "Alquiler"} ${id}`,
            operation: isSale ? "sale" : "rent",
          }),
        ),
        total: 3,
      };
    });

    render(await Home());

    expect(listPublicProperties).toHaveBeenCalledWith({ operation: "sale", featured: true, limit: 6 });
    expect(listPublicProperties).toHaveBeenCalledWith({ operation: "rent", featured: true, limit: 6 });
    expect(listPublicProperties).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("heading", { level: 2, name: "Destacadas en venta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Destacadas en alquiler" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Venta a/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alquiler a/ })).toBeInTheDocument();
  });

  it("falls back to the latest of that operation when fewer than 3 are featured", async () => {
    listPublicProperties.mockImplementation(
      async (filters: { operation?: string; featured?: boolean }) => ({
        items: filters.featured
          ? []
          : [makePublicProperty({ id: `l-${filters.operation}`, title: `Reciente ${filters.operation}` })],
        total: 1,
      }),
    );

    render(await Home());

    expect(listPublicProperties).toHaveBeenCalledWith({ operation: "sale", limit: 6 });
    expect(listPublicProperties).toHaveBeenCalledWith({ operation: "rent", limit: 6 });
    expect(screen.getByRole("link", { name: /Reciente sale/ })).toBeInTheDocument();
  });

  it("hides a section with no properties and keeps the other", async () => {
    listPublicProperties.mockImplementation(async (filters: { operation?: string }) => ({
      items: filters.operation === "sale" ? [makePublicProperty({ title: "Solo venta" })] : [],
      total: 0,
    }));

    render(await Home());

    expect(screen.getByRole("heading", { level: 2, name: "Destacadas en venta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Destacadas en alquiler" })).toBeNull();
  });

  it("hides only the section whose request fails", async () => {
    listPublicProperties.mockImplementation(async (filters: { operation?: string }) => {
      if (filters.operation === "rent") throw new ApiError(500, "boom");
      return { items: [makePublicProperty({ title: "Solo venta" })], total: 1 };
    });

    render(await Home());

    expect(screen.getByRole("heading", { level: 2, name: "Destacadas en venta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Destacadas en alquiler" })).toBeNull();
  });

  it("no longer renders the personal quote block", async () => {
    render(await Home());

    expect(screen.queryByText("Atención personal")).toBeNull();
  });

  it("still renders when the catalog is unavailable", async () => {
    listPublicProperties.mockRejectedValue(new ApiError(0, "down"));
    getPublicNeighborhoods.mockRejectedValue(new ApiError(0, "down"));

    render(await Home());

    expect(screen.getByRole("search", { name: "Buscar propiedades" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Destacadas/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Solicitar tasación/ })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
  });

  it("shows the appraisal call to action with benefits and a WhatsApp alternative", async () => {
    render(await Home());

    const cta = screen.getByRole("region", { name: "¿Querés vender o alquilar?" });
    expect(within(cta).getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(within(cta).getByRole("link", { name: /Solicitar tasación/ })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
    expect(within(cta).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
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
