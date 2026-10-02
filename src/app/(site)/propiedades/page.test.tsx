import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";
import { makePublicProperty } from "@/test/fixtures/public-property";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  usePathname: () => "/propiedades",
}));

const { listPublicProperties, getPublicNeighborhoods } = vi.hoisted(() => ({
  listPublicProperties: vi.fn(),
  getPublicNeighborhoods: vi.fn(),
}));
vi.mock("@/lib/api/public-catalog", () => ({ listPublicProperties, getPublicNeighborhoods }));

import { ApiError } from "@/lib/api/client";
import ResultsPage, { generateMetadata } from "./page";

const query = (params: Record<string, string> = {}) => ({ searchParams: Promise.resolve(params) });

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getPublicNeighborhoods.mockResolvedValue([{ id: "n1", name: "Palermo", slug: "palermo" }]);
  listPublicProperties.mockResolvedValue({ items: [makePublicProperty()], total: 25 });
});

describe("ResultsPage", () => {
  it("queries the API from the URL and lists the results with a count heading", async () => {
    render(await ResultsPage(query({ operacion: "venta", barrio: "palermo", pagina: "2" })));

    expect(listPublicProperties).toHaveBeenCalledWith({
      operation: "sale",
      neighborhood: "palermo",
      sort: "newest",
      limit: 12,
      offset: 12,
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "25 propiedades en venta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luminoso 3 ambientes/ })).toBeInTheDocument();
  });

  it("paginates with links that keep the filters", async () => {
    render(await ResultsPage(query({ operacion: "venta", pagina: "2" })));

    const pagination = screen.getByRole("navigation", { name: "Paginación" });
    expect(pagination).toHaveTextContent("Página 2 de 3");
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&pagina=3",
    );
  });

  it("redirects to the canonical URL when the query has empty or invalid params", async () => {
    await expectRedirect(
      ResultsPage(query({ operacion: "", barrio: "palermo", orden: "recientes" })),
      "/propiedades?barrio=palermo",
    );
    expect(listPublicProperties).not.toHaveBeenCalled();
  });

  it("opens the property directly when a code matches one listing", async () => {
    listPublicProperties.mockResolvedValue({ items: [makePublicProperty()], total: 1 });

    await expectRedirect(
      ResultsPage(query({ codigo: "SP-0101" })),
      "/propiedades/luminoso-3-ambientes-con-balcon",
    );
  });

  it("explains when a code does not exist", async () => {
    listPublicProperties.mockResolvedValue({ items: [], total: 0 });

    render(await ResultsPage(query({ codigo: "SP-9999" })));

    expect(screen.getByText("No encontramos la propiedad SP-9999")).toBeInTheDocument();
  });

  it("shows an empty state with a way to clear the filters", async () => {
    listPublicProperties.mockResolvedValue({ items: [], total: 0 });

    render(await ResultsPage(query({ operacion: "venta", tipo: "casa", ambientes: "5" })));

    expect(screen.getByText("Sin resultados con esos filtros")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });

  it("shows a retry message instead of crashing when the catalog is unavailable", async () => {
    listPublicProperties.mockRejectedValue(new ApiError(429, "Too Many Requests"));

    render(await ResultsPage(query({ operacion: "venta" })));

    expect(screen.getByText("No pudimos cargar las propiedades")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });
});

describe("generateMetadata", () => {
  it("titles landing-style searches and points the canonical to the clean URL", async () => {
    const metadata = await generateMetadata(query({ operacion: "venta", barrio: "palermo" }));

    expect(metadata.title).toBe("Propiedades en venta en Palermo");
    expect(metadata.alternates?.canonical).toBe("/propiedades?operacion=venta&barrio=palermo");
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps narrow filter combinations out of the index", async () => {
    const metadata = await generateMetadata(query({ ambientes: "3" }));

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("ResultsPage filter feedback", () => {
  it("shows removable chips for applied filters", async () => {
    render(await ResultsPage(query({ operacion: "venta", barrio: "palermo", tipo: "casa" })));

    expect(screen.getByRole("link", { name: "Quitar filtro: Palermo" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta&tipo=casa",
    );
    expect(screen.getByRole("link", { name: "Limpiar todo" })).toBeInTheDocument();
  });

  it("does not promise alerts in the empty state", async () => {
    listPublicProperties.mockResolvedValue({ items: [], total: 0 });

    render(await ResultsPage(query({ operacion: "venta", tipo: "casa" })));

    expect(screen.getByText(/por WhatsApp y te avisamos si ingresa algo similar/)).toBeInTheDocument();
  });
});
