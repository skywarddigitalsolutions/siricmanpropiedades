import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { makePublicPropertyDetail } from "@/test/fixtures/public-property";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const { getPublicProperty } = vi.hoisted(() => ({ getPublicProperty: vi.fn() }));
vi.mock("@/lib/api/public-catalog", () => ({ getPublicProperty }));

import { ApiError } from "@/lib/api/client";
import { whatsappInquiry } from "@/lib/public/property-view";
import PropertyPage, { generateMetadata } from "./page";

const params = (slug = "luminoso-3-ambientes-con-balcon") => ({
  params: Promise.resolve({ slug }),
});

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  getPublicProperty.mockResolvedValue(makePublicPropertyDetail());
});

describe("PropertyPage", () => {
  it("shows the price, title, location and every fact", async () => {
    render(await PropertyPage(params()));

    expect(getPublicProperty).toHaveBeenCalledWith("luminoso-3-ambientes-con-balcon");
    expect(
      screen.getByRole("heading", { level: 1, name: "Luminoso 3 ambientes con balcón al frente" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("USD 185.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gorriti 4800 · Palermo, CABA").length).toBeGreaterThan(0);
    const facts = screen.getByRole("list", { name: "Características" });
    expect(within(facts).getByText("Sup. cubierta")).toBeInTheDocument();
    expect(within(facts).getByText("72 m²")).toBeInTheDocument();
    expect(within(facts).getByText("12 años")).toBeInTheDocument();
  });

  it("shows conditions, description paragraphs and services", async () => {
    render(await PropertyPage(params()));

    expect(screen.getByText("Apto crédito")).toBeInTheDocument();
    expect(screen.getByText("Departamento muy luminoso.")).toBeInTheDocument();
    expect(screen.getByText("Cerca del subte.")).toBeInTheDocument();
    const services = screen.getByRole("region", { name: "Servicios" });
    expect(within(services).getByText("Gas natural")).toBeInTheDocument();
  });

  it("offers a WhatsApp inquiry naming the property", async () => {
    render(await PropertyPage(params()));

    const { href } = whatsappInquiry(makePublicPropertyDetail());
    const links = screen.getAllByRole("link", { name: /WhatsApp/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", href);
    expect(screen.getByRole("link", { name: "Consultar" })).toHaveAttribute("href", "#consulta");
  });

  it("hides the exact address when the owner chose to", async () => {
    getPublicProperty.mockResolvedValue(makePublicPropertyDetail({ address: null }));

    render(await PropertyPage(params()));

    expect(screen.queryByText(/Gorriti/)).toBeNull();
    expect(screen.getAllByText("Palermo, CABA · zona aproximada").length).toBeGreaterThan(0);
  });

  it("warns when the property is no longer available", async () => {
    getPublicProperty.mockResolvedValue(makePublicPropertyDetail({ dealStatus: "sold" }));

    render(await PropertyPage(params()));

    expect(screen.getByRole("note")).toHaveTextContent(
      "Vendida. Esta propiedad ya no está disponible.",
    );
  });

  it("links back to the results of the same operation", async () => {
    render(await PropertyPage(params()));

    expect(screen.getByRole("link", { name: /Ver más propiedades/ })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
  });

  it("renders the not-found page for an unknown slug", async () => {
    getPublicProperty.mockRejectedValue(new ApiError(404, "Not found"));

    await expect(PropertyPage(params("no-existe"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("generateMetadata", () => {
  it("builds a unique title, description, canonical and share image", async () => {
    const metadata = await generateMetadata(params());

    expect(metadata.title).toBe("Luminoso 3 ambientes con balcón al frente · USD 185.000");
    expect(metadata.description).toMatch(/^Departamento en venta en Palermo/);
    expect(metadata.alternates?.canonical).toBe("/propiedades/luminoso-3-ambientes-con-balcon");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://media.test/p1-1.webp", width: 1600, height: 1200 },
    ]);
  });
});
