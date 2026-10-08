import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import AboutPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("AboutPage", () => {
  it("opens with the consortium administrator block before the hero", () => {
    render(<AboutPage />);

    const block = screen.getByRole("region", { name: "Administración de consorcios" });
    expect(within(block).getByText("ADMINISTRACIÓN")).toBeInTheDocument();
    expect(within(block).getByText("Ana María Fierro Pedrayes")).toBeInTheDocument();
    expect(
      within(block).getByText("Administración de consorcios · 15 años de trayectoria"),
    ).toBeInTheDocument();
    expect(
      within(block).getByText("Trato directo con cada propietario del edificio."),
    ).toBeInTheDocument();
    expect(
      within(block).getByRole("link", { name: "Conocé la administración de consorcios" }),
    ).toHaveAttribute("href", "/administracion-de-consorcios");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(block.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("introduces the agency with the seller focus", () => {
    render(<AboutPage />);

    expect(screen.getByText("NOSOTROS")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Una inmobiliaria con nombre y apellido" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "En Siricman Propiedades te atienden las mismas personas de principio a fin: Gabriel Siricman te acompaña en la venta de tu propiedad y en cada operación, y Ana María Fierro Pedrayes está a cargo de la administración de consorcios.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Logo Siricman Propiedades")).toBeInTheDocument();
  });

  it("states the mission and the vision", () => {
    render(<AboutPage />);

    expect(screen.getByText("MISIÓN")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Acompañar a cada propietario en la venta de su propiedad con un servicio cercano, transparente y profesional, y brindar una administración de alquileres y de consorcios ordenada y confiable.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("VISIÓN")).toBeInTheDocument();
    expect(screen.getByText(/Ser una inmobiliaria referente/)).toBeInTheDocument();
  });

  it("lists the six values with their descriptions", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Nuestros valores" })).toBeInTheDocument();
    const values = screen.getByRole("list", { name: "Nuestros valores" });
    expect(within(values).getAllByRole("listitem")).toHaveLength(6);
    expect(within(values).queryByText("Responsabilidad")).toBeNull();
    expect(within(values).getByText("Cercanía humana")).toBeInTheDocument();
    expect(
      within(values).getByText("Relaciones construidas con respeto, escucha y amistad."),
    ).toBeInTheDocument();
  });

  it("shows Gabriel and Ana María in the team, with photo or initials and no placeholders", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Quién está detrás" })).toBeInTheDocument();
    // Right after the hero: the person behind the agency comes before mission and values.
    const who = screen.getByRole("heading", { level: 2, name: "Quién está detrás" });
    const values = screen.getByRole("heading", { level: 2, name: "Nuestros valores" });
    expect(who.compareDocumentPosition(values) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(who.compareDocumentPosition(screen.getByText("MISIÓN")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const team = screen.getByRole("list", { name: "Quién está detrás" });
    // Two people: count the team list's own rows, not the nested credentials.
    expect(team.children).toHaveLength(2);
    expect(within(team).getByText("Gabriel Siricman")).toBeInTheDocument();
    expect(within(team).getByText("Martillero Público y Corredor Inmobiliario")).toBeInTheDocument();
    expect(within(team).getByText("Matrícula N° 10024")).toBeInTheDocument();
    // Data from the client: consortium administrator registration and UTN teaching.
    expect(
      within(team).getByText("Administrador de consorcios · Matrícula RPA N° 12221"),
    ).toBeInTheDocument();
    expect(within(team).getByText("Docente en UTN")).toBeInTheDocument();
    const photo = within(team).getByRole("img", { name: "Gabriel Siricman" });
    expect(decodeURIComponent(photo.getAttribute("src")!)).toContain("/team/gabriel.jpg");
    expect(within(team).queryByText("GS")).not.toBeInTheDocument();
    expect(within(team).getByText("Ana María Fierro Pedrayes")).toBeInTheDocument();
    expect(within(team).getByText("Administración de consorcios")).toBeInTheDocument();
    expect(
      within(team).getByText(/15 años de trayectoria en la administración de consorcios/),
    ).toBeInTheDocument();
    // No photo for Ana María: an initials avatar, and no invented license.
    expect(within(team).getByRole("img", { name: "Ana María Fierro Pedrayes" })).toHaveTextContent("AF");
    expect(within(team).getAllByRole("img")).toHaveLength(2);
    expect(within(team).getAllByText(/Matrícula/)).toHaveLength(2);
    expect(container.textContent).not.toContain("[Nombre]");
  });

  it("gives Gabriel a profile card with a bio and direct contact buttons", () => {
    render(<AboutPage />);

    const team = screen.getByRole("list", { name: "Quién está detrás" });
    expect(within(team).getByText(/Hoy te acompaña en la venta de tu propiedad/)).toBeInTheDocument();
    expect(within(team).getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(within(team).getByRole("link", { name: "Escribinos" })).toHaveAttribute("href", "/contacto");
    expect(within(team).getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/gabrielsiricman/",
    );
  });

  it("closes with links to the appraisal and contact pages", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { level: 2, name: "¿Pensás vender tu propiedad?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pedí una tasación o escribinos, te respondemos a la brevedad."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedí tu tasación" })).toHaveAttribute("href", "/vender");
    expect(screen.getByRole("link", { name: "Contactanos" })).toHaveAttribute("href", "/contacto");
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Nosotros");
    expect(metadata.description).toBe(
      "Conocé a quienes te atienden en Siricman Propiedades: Gabriel Siricman, corredor inmobiliario matriculado, te acompaña en la venta de tu propiedad, y Ana María Fierro Pedrayes administra consorcios con 15 años de trayectoria.",
    );
    expect(metadata.alternates).toEqual({ canonical: "/nosotros" });
    expect(metadata.openGraph).toMatchObject({ title: "Nosotros", url: "/nosotros" });
  });
});
