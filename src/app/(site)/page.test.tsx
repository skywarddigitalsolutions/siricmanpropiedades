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
  listPublicProperties.mockResolvedValue({ items: [makePublicProperty()], total: 1 });
});

describe("Home page", () => {
  it("renders the owner-focused hero that leads to an appraisal", async () => {
    render(await Home());

    const hero = screen.getByRole("region", { name: "Tu propiedad, en manos profesionales." });
    expect(
      within(hero).getByRole("heading", { level: 1, name: "Tu propiedad, en manos profesionales." }),
    ).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
    expect(within(hero).getByRole("link", { name: /Ver propiedades/ })).toHaveAttribute(
      "href",
      "/propiedades",
    );
    expect(screen.queryByRole("search", { name: "Buscar propiedades" })).toBeNull();
    expect(getPublicNeighborhoods).not.toHaveBeenCalled();
  });

  it("explains the owner process right after the hero", async () => {
    render(await Home());

    const hero = screen.getByRole("region", { name: "Tu propiedad, en manos profesionales." });
    const process = screen.getByRole("region", { name: "Vendé o alquilá sin complicarte" });
    expect(
      within(process).getByRole("heading", { level: 2, name: "Vendé o alquilá sin complicarte" }),
    ).toBeInTheDocument();
    expect(within(process).getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
    // Reading order: the hero comes before the process section.
    expect(hero.compareDocumentPosition(process) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

    render(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Destacadas/ })).toBeNull();
    const hero = screen.getByRole("region", { name: "Tu propiedad, en manos profesionales." });
    expect(within(hero).getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
    expect(
      screen.getByRole("region", { name: "Nos ocupamos de tu propiedad, todos los meses" }),
    ).toBeInTheDocument();
  });

  it("closes with the management section instead of the old appraisal call to action", async () => {
    render(await Home());

    const management = screen.getByRole("region", {
      name: "Nos ocupamos de tu propiedad, todos los meses",
    });
    const services = screen.getByRole("region", { name: "Todo lo que necesitás, en un solo lugar" });
    expect(
      services.compareDocumentPosition(management) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(management).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(screen.queryByRole("region", { name: "¿Querés vender o alquilar?" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Solicitar tasación/ })).toBeNull();
  });

  it("closes with the people behind the agency, after services and management", async () => {
    render(await Home());

    const services = screen.getByRole("region", { name: "Todo lo que necesitás, en un solo lugar" });
    const management = screen.getByRole("region", {
      name: "Nos ocupamos de tu propiedad, todos los meses",
    });
    const about = screen.getByRole("region", { name: "Una inmobiliaria con nombre y apellido" });
    expect(services.compareDocumentPosition(management) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(management.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(about).getByRole("link", { name: "Conocé más sobre nosotros" })).toHaveAttribute(
      "href",
      "/nosotros",
    );
  });

  it("describes the agency as schema.org JSON-LD", async () => {
    const { container } = render(await Home());

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toMatchObject({ "@type": "RealEstateAgent" });
  });

  it("shows the buyer section after the owner process section", async () => {
    render(await Home());

    const process = screen.getByRole("region", { name: "Vendé o alquilá sin complicarte" });
    const buyer = screen.getByRole("region", { name: "Encontrá tu próximo hogar" });
    expect(process.compareDocumentPosition(buyer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(buyer).getByRole("link", { name: /^Comprar,\s*Propiedades en venta$/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });

  it("no longer renders the property type chips navigation", async () => {
    render(await Home());

    expect(screen.queryByRole("navigation", { name: "Tipos de propiedad" })).toBeNull();
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
