import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { FOUNDER } from "@/lib/public/team";
import WhySell from "./WhySell";

afterEach(() => cleanup());

const TITLE = "Tu venta, en manos de una persona, no de un call center";

const REASONS = [
  ["Hablás siempre con Gabriel", "Desde la primera visita hasta la firma, sin pasar de mano en mano."],
  ["Precio con fundamento", "Un valor sugerido basado en operaciones reales, no en promesas."],
  [
    "Seguridad en cada paso",
    "Revisamos la documentación y te explicamos cada etapa de la operación.",
  ],
  ["Te mantenemos al tanto", "Sabés qué pasa con tu propiedad: consultas, visitas y ofertas."],
] as const;

describe("WhySell", () => {
  it("is a section named by its heading, with an eyebrow", () => {
    render(<WhySell />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(within(section).getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(within(section).getByText("POR QUÉ VENDER CON NOSOTROS")).toBeInTheDocument();
  });

  it("lists the four reasons, each titled by a level-3 heading", () => {
    render(<WhySell />);

    const list = screen.getByRole("list", { name: TITLE });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent)).toEqual(
      REASONS.map(([title]) => title),
    );
    REASONS.forEach(([, text], index) => {
      expect(within(items[index]).getByText(text)).toBeInTheDocument();
    });
  });

  it("presents Gabriel with photo, role and license, and links to the about page", () => {
    render(<WhySell />);

    const section = screen.getByRole("region", { name: TITLE });
    const photo = within(section).getByRole("img", { name: FOUNDER.name });
    expect(decodeURIComponent(photo.getAttribute("src")!)).toContain(FOUNDER.photo);
    expect(within(section).getByText(FOUNDER.name)).toBeInTheDocument();
    expect(within(section).getByText(FOUNDER.role)).toBeInTheDocument();
    expect(within(section).getByText(FOUNDER.license)).toBeInTheDocument();
    expect(within(section).getByText("Docente en UTN")).toBeInTheDocument();
    expect(within(section).getByText("+11 años de experiencia")).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "Conocé más sobre nosotros" })).toHaveAttribute(
      "href",
      "/nosotros",
    );
  });

  it("puts Gabriel's profile in the section header, before the reasons", () => {
    render(<WhySell />);

    const section = screen.getByRole("region", { name: TITLE });
    const header = within(section).getByRole("heading", { level: 2 }).closest("header")!;
    expect(header).not.toBeNull();
    expect(within(header).getByRole("img", { name: FOUNDER.name })).toBeInTheDocument();
    expect(within(header).getByText("Docente en UTN")).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Conocé más sobre nosotros" })).toBeInTheDocument();
    const list = within(section).getByRole("list", { name: TITLE });
    expect(header).not.toContainElement(list);
    expect(header.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Nothing is left hanging under the cards.
    expect(list.nextElementSibling).toBeNull();
  });

  it("keeps the consortium administrator and invented claims out of the selling pitch", () => {
    render(<WhySell />);

    const section = screen.getByRole("region", { name: TITLE });
    expect(section.textContent).not.toMatch(/Ana Mar|Fierro|mejor precio|gratis|días|alquil/i);
  });
});
