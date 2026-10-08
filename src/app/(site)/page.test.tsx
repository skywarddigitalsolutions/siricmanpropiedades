import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { makePublicProperty } from "@/test/fixtures/public-property";

const { listPublicProperties, getPublicNeighborhoods } = vi.hoisted(() => ({
  listPublicProperties: vi.fn(),
  getPublicNeighborhoods: vi.fn(),
}));
vi.mock("@/lib/api/public-catalog", () => ({ listPublicProperties, getPublicNeighborhoods }));

import { ApiError } from "@/lib/api/client";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import Home from "./page";

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  listPublicProperties.mockResolvedValue({ items: [makePublicProperty()], total: 1 });
});

const HERO = "Vendé tu propiedad con alguien que la cuide como propia.";
const PROCESS = "Un proceso claro, de la tasación a la escritura";
const WHY = "Tu venta, en manos de una persona, no de un call center";
const FAQ = "Lo que preguntan los propietarios antes de vender";
const RENTALS = "¿Tenés una propiedad alquilada? Nosotros la administramos";
const CONSORTIUM = "Administración de consorcios";
const BUYER = "¿Buscás comprar o alquilar?";
const FEATURED = "Propiedades destacadas";
const FINAL = "¿Pensás vender tu propiedad?";

/** Whether `later` comes after `earlier` in the document. */
function isAfter(earlier: HTMLElement, later: HTMLElement) {
  return Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("Home page", () => {
  it("opens with the seller hero that leads to the selling page and WhatsApp", async () => {
    render(await Home());

    const hero = screen.getByRole("region", { name: HERO });
    expect(within(hero).getByRole("heading", { level: 1, name: HERO })).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: "Quiero vender mi propiedad" })).toHaveAttribute(
      "href",
      "/vender",
    );
    expect(within(hero).getByRole("link", { name: "Hablar por WhatsApp" })).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE),
    );
    expect(screen.queryByRole("search", { name: "Buscar propiedades" })).toBeNull();
    expect(getPublicNeighborhoods).not.toHaveBeenCalled();
  });

  it("orders the sections from selling, to rental management, consortium, buyers and the final call", async () => {
    render(await Home());

    const ordered = [
      screen.getByRole("region", { name: HERO }),
      screen.getByRole("list", { name: "Por qué confiar en nosotros" }),
      screen.getByRole("region", { name: PROCESS }),
      screen.getByRole("region", { name: WHY }),
      screen.getByRole("region", { name: FAQ }),
      screen.getByRole("region", { name: RENTALS }),
      screen.getByRole("region", { name: CONSORTIUM }),
      screen.getByRole("region", { name: BUYER }),
      screen.getByRole("region", { name: FEATURED }),
      screen.getByRole("region", { name: FINAL }),
    ];
    for (let index = 1; index < ordered.length; index += 1) {
      expect(isAfter(ordered[index - 1], ordered[index])).toBe(true);
    }
  });

  it("sends the process and the closing call to the selling page", async () => {
    render(await Home());

    for (const name of [PROCESS, FINAL]) {
      expect(
        within(screen.getByRole("region", { name })).getByRole("link", { name: "Pedí tu tasación" }),
      ).toHaveAttribute("href", "/vender");
    }
    expect(
      within(screen.getByRole("region", { name: FINAL })).getByRole("link", {
        name: "Escribinos por WhatsApp",
      }),
    ).toHaveAttribute("href", buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE));
  });

  it("shows a single featured carousel with properties of any operation", async () => {
    listPublicProperties.mockResolvedValue({
      items: ["a", "b", "c"].map((id) =>
        makePublicProperty({ id: `p-${id}`, slug: `p-${id}`, title: `Propiedad ${id}` }),
      ),
      total: 3,
    });

    render(await Home());

    expect(listPublicProperties).toHaveBeenCalledTimes(1);
    expect(listPublicProperties).toHaveBeenCalledWith({ featured: true, limit: 6 });
    expect(screen.getByRole("heading", { level: 2, name: FEATURED })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Propiedad a/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Destacadas en/ })).toBeNull();
  });

  it("falls back to the latest published when fewer than 3 are featured", async () => {
    listPublicProperties.mockImplementation(async (filters: { featured?: boolean }) => ({
      items: filters.featured ? [] : [makePublicProperty({ id: "latest", title: "Reciente" })],
      total: 1,
    }));

    render(await Home());

    expect(listPublicProperties).toHaveBeenCalledWith({ limit: 6 });
    expect(screen.getByRole("link", { name: /Reciente/ })).toBeInTheDocument();
  });

  it("hides the featured section when there are no properties", async () => {
    listPublicProperties.mockResolvedValue({ items: [], total: 0 });

    render(await Home());

    expect(screen.queryByRole("heading", { level: 2, name: FEATURED })).toBeNull();
    expect(screen.getByRole("region", { name: BUYER })).toBeInTheDocument();
  });

  it("still renders every static section when the catalog is unavailable", async () => {
    listPublicProperties.mockRejectedValue(new ApiError(0, "down"));

    render(await Home());

    expect(screen.getByRole("heading", { level: 1, name: HERO })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: FEATURED })).toBeNull();
    for (const name of [PROCESS, WHY, FAQ, RENTALS, CONSORTIUM, BUYER, FINAL]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("keeps the buyer cards and property type shortcuts reachable", async () => {
    render(await Home());

    const buyer = screen.getByRole("region", { name: BUYER });
    expect(within(buyer).getByRole("link", { name: /^Comprar,\s*Propiedades en venta$/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
    expect(within(buyer).getByRole("link", { name: /^Alquilar,\s*Propiedades en alquiler$/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler",
    );
    expect(screen.getByRole("link", { name: "Departamentos" })).toHaveAttribute(
      "href",
      "/propiedades?tipo=departamento",
    );
  });

  it("introduces Gabriel in the selling sections and Ana María only in the consortium block", async () => {
    render(await Home());

    expect(screen.getAllByText(/Ana María Fierro Pedrayes/)).toHaveLength(1);
    const consortium = screen.getByRole("region", { name: CONSORTIUM });
    expect(within(consortium).getByText(/Ana María Fierro Pedrayes, con 15 años/)).toBeInTheDocument();
    expect(screen.getAllByText(/Gabriel/).length).toBeGreaterThan(0);
  });

  it("removes the old generic sections", async () => {
    render(await Home());

    expect(screen.queryByRole("region", { name: "Todo lo que necesitás, en un solo lugar" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Una inmobiliaria con nombre y apellido" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Vendé o alquilá sin complicarte" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 2, name: "Destacadas en alquiler" })).toBeNull();
    expect(screen.queryByText("Atención personalizada")).toBeNull();
  });

  it("never offers 'vender o alquilar' and keeps the appraisal route on /vender", async () => {
    const { container } = render(await Home());

    expect(container.textContent).not.toMatch(/vender o alquilar|vendé o alquilá/i);
    expect(container.querySelector('a[href="/tasaciones"]')).toBeNull();
  });

  it("describes the agency as schema.org JSON-LD", async () => {
    const { container } = render(await Home());

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toMatchObject({ "@type": "RealEstateAgent" });
  });
});
