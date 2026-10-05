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
    expect(screen.getByText(/nace de más de una década administrando consorcios/)).toBeInTheDocument();
    expect(screen.getByAltText("Logo Siricman Propiedades")).toBeInTheDocument();
  });

  it("states the mission and the vision", () => {
    render(<AboutPage />);

    expect(screen.getByText("MISIÓN")).toBeInTheDocument();
    expect(screen.getByText(/Brindar soluciones inmobiliarias y de administración/)).toBeInTheDocument();
    expect(screen.getByText("VISIÓN")).toBeInTheDocument();
    expect(screen.getByText(/Ser una inmobiliaria referente/)).toBeInTheDocument();
  });

  it("lists the seven values with their descriptions", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Nuestros valores" })).toBeInTheDocument();
    const values = screen.getByRole("list", { name: "Nuestros valores" });
    expect(within(values).getAllByRole("listitem")).toHaveLength(7);
    expect(within(values).getByText("Cercanía humana")).toBeInTheDocument();
    expect(
      within(values).getByText("Relaciones construidas con respeto, escucha y amistad."),
    ).toBeInTheDocument();
  });

  it("shows only Gabriel Siricman in the team, with initials and no placeholders", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Equipo" })).toBeInTheDocument();
    const team = screen.getByRole("list", { name: "Equipo" });
    expect(within(team).getAllByRole("listitem")).toHaveLength(1);
    expect(within(team).getByText("Gabriel Siricman")).toBeInTheDocument();
    expect(within(team).getByText("Martillero Público y Corredor Inmobiliario")).toBeInTheDocument();
    expect(within(team).getByText("Matrícula N° 10024")).toBeInTheDocument();
    expect(within(team).getByText("GS")).toBeInTheDocument();
    expect(container.textContent).not.toContain("[Nombre]");
  });

  it("gives Gabriel a profile card with a bio and direct contact buttons", () => {
    render(<AboutPage />);

    const team = screen.getByRole("list", { name: "Equipo" });
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

    expect(screen.getByRole("link", { name: "Solicitar tasación" })).toHaveAttribute("href", "/tasaciones");
    expect(screen.getByRole("link", { name: "Contactanos" })).toHaveAttribute("href", "/contacto");
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Nosotros");
    expect(metadata.description).toEqual(expect.stringContaining("consorcios"));
    expect(metadata.alternates).toEqual({ canonical: "/nosotros" });
    expect(metadata.openGraph).toMatchObject({ title: "Nosotros", url: "/nosotros" });
  });
});
