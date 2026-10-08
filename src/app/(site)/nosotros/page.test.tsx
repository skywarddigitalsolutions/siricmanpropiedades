import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import AboutPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("AboutPage", () => {
  it("introduces the agency", () => {
    render(<AboutPage />);

    expect(screen.getByText("NOSOTROS")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Once años cuidando propiedades y a las personas que viven en ellas",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nace de la administración de consorcios/)).toBeInTheDocument();
    expect(screen.queryByText(/una década/)).toBeNull();
    // Gabriel's own mission text stays word for word.
    expect(
      screen.getByText(/acompañando a cada cliente con la experiencia y la confianza de más de 11 años\./),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Logo Siricman Propiedades")).toBeInTheDocument();
  });

  it("states the mission and the vision", () => {
    render(<AboutPage />);

    expect(screen.getByText("MISIÓN")).toBeInTheDocument();
    expect(screen.getByText(/Brindar soluciones inmobiliarias y de administración/)).toBeInTheDocument();
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

  it("shows only Gabriel Siricman in the team, with his photo and no placeholders", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Quién está detrás" })).toBeInTheDocument();
    // Right after the hero: the person behind the agency comes before mission and values.
    const who = screen.getByRole("heading", { level: 2, name: "Quién está detrás" });
    const values = screen.getByRole("heading", { level: 2, name: "Nuestros valores" });
    expect(who.compareDocumentPosition(values) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(who.compareDocumentPosition(screen.getByText("MISIÓN")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const team = screen.getByRole("list", { name: "Quién está detrás" });
    // One person: count the team list's own rows, not the nested credentials.
    expect(team.children).toHaveLength(1);
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
    expect(container.textContent).not.toContain("[Nombre]");
  });

  it("gives Gabriel a profile card with a bio and direct contact buttons", () => {
    render(<AboutPage />);

    const team = screen.getByRole("list", { name: "Quién está detrás" });
    expect(within(team).getByText(/Más de 11 años administrando consorcios/)).toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: "Solicitar tasación" })).toHaveAttribute("href", "/vender");
    expect(screen.getByRole("link", { name: "Contactanos" })).toHaveAttribute("href", "/contacto");
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Nosotros");
    expect(metadata.description).toEqual(expect.stringContaining("consorcios"));
    expect(metadata.alternates).toEqual({ canonical: "/nosotros" });
    expect(metadata.openGraph).toMatchObject({ title: "Nosotros", url: "/nosotros" });
  });
});
