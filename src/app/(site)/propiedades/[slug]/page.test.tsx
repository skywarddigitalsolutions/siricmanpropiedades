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
vi.mock("./actions", () => ({ sendInquiryAction: vi.fn() }));

import { ApiError } from "@/lib/api/client";
import { inquiryMessage, whatsappInquiry } from "@/lib/public/property-view";
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
    expect(screen.getAllByText("US$ 185.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gorriti 4800 · Palermo, CABA").length).toBeGreaterThan(0);
    const facts = screen.getByRole("region", { name: "Características" });
    expect(within(facts).getByText("Tipo")).toBeInTheDocument();
    expect(within(facts).getByText("Departamento")).toBeInTheDocument();
    expect(within(facts).getByText("Superficie cubierta")).toBeInTheDocument();
    expect(within(facts).getByText("72 m²")).toBeInTheDocument();
    expect(within(facts).getByText("12 años")).toBeInTheDocument();
    expect(within(facts).queryByText("Expensas")).toBeNull();
    expect(within(facts).queryByText("Cochera")).toBeNull();
    // Conditions are part of the same section, below the facts.
    expect(within(facts).getByText("Apto crédito")).toBeInTheDocument();
  });

  it("shows the main specs like the listing card, before the title and location", async () => {
    render(await PropertyPage(params()));

    const specs = screen.getByRole("list", { name: "Características principales" });
    expect(within(specs).getByText("78 m² totales")).toBeInTheDocument();
    expect(within(specs).getByText("3 ambientes")).toBeInTheDocument();
    expect(within(specs).getByText("2 dormitorios")).toBeInTheDocument();
    expect(within(specs).getByText("1 baño")).toBeInTheDocument();
    expect(within(specs).queryByText("Con cochera")).toBeNull();
    const location = screen.getAllByText("Gorriti 4800 · Palermo, CABA")[0];
    expect(specs.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the description right after the title, before the full characteristics", async () => {
    render(await PropertyPage(params()));

    const title = screen.getByRole("heading", { level: 1 });
    const description = screen.getByRole("region", { name: "Descripción" });
    const facts = screen.getByRole("region", { name: "Características" });
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(title, description)).toBe(true);
    expect(follows(description, facts)).toBe(true);
  });

  it("shows amenities with their own section before services, only when there are any", async () => {
    render(await PropertyPage(params()));
    expect(screen.queryByRole("region", { name: "Comodidades" })).toBeNull();
    cleanup();

    getPublicProperty.mockResolvedValue(
      makePublicPropertyDetail({ amenities: { pool: true, gym: true } }),
    );
    render(await PropertyPage(params()));

    const amenities = screen.getByRole("region", { name: "Comodidades" });
    expect(within(amenities).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Pileta",
      "Gimnasio",
    ]);
    const services = screen.getByRole("region", { name: "Servicios" });
    expect(amenities.compareDocumentPosition(services) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    expect(screen.getByRole("link", { name: "Llamar" })).toHaveAttribute("href", expect.stringMatching(/^tel:/));
  });

  it("offers the inquiry form prefilled with the property", async () => {
    render(await PropertyPage(params()));

    const aside = screen.getByRole("complementary", { name: "Consultá por esta propiedad" });
    const message = within(aside).getByLabelText("Mensaje (opcional)");
    expect(message).toHaveValue(inquiryMessage(makePublicPropertyDetail()));
    // The code is for the agency only; the form already sends which property it is.
    expect((message as HTMLTextAreaElement).value).not.toContain("SP-0101");
    expect(within(aside).getByRole("button", { name: "Enviar consulta" })).toBeInTheDocument();
  });

  it("hides the exact address when the owner chose to", async () => {
    getPublicProperty.mockResolvedValue(makePublicPropertyDetail({ address: null }));

    render(await PropertyPage(params()));

    expect(screen.queryByText(/Gorriti/)).toBeNull();
    expect(screen.getAllByText("Palermo, CABA").length).toBeGreaterThan(0);
    expect(screen.queryByText(/aproximada/i)).toBeNull();
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

  it("keeps the property code out of the top row", async () => {
    render(await PropertyPage(params()));

    const topRow = screen.getByRole("link", { name: /Ver más propiedades/ }).parentElement;
    expect(topRow).not.toHaveTextContent(/Cód\./);
  });

  it("embeds the listing as schema.org JSON-LD", async () => {
    const { container } = render(await PropertyPage(params()));

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.textContent!)).toMatchObject({
      "@type": "RealEstateListing",
      url: "http://localhost:3000/propiedades/luminoso-3-ambientes-con-balcon",
    });
  });

  it("renders the not-found page for an unknown slug", async () => {
    getPublicProperty.mockRejectedValue(new ApiError(404, "Not found"));

    await expect(PropertyPage(params("no-existe"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("generateMetadata", () => {
  it("builds a unique title, description, canonical and share image", async () => {
    const metadata = await generateMetadata(params());

    expect(metadata.title).toBe("Luminoso 3 ambientes con balcón al frente · US$ 185.000");
    expect(metadata.description).toMatch(/^Departamento en venta en Palermo/);
    expect(metadata.alternates?.canonical).toBe("/propiedades/luminoso-3-ambientes-con-balcon");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://media.test/p1-1.webp", width: 1600, height: 1200 },
    ]);
  });
});
