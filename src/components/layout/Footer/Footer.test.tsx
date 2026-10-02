import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the brand, address and contact information", () => {
    render(<Footer />);

    expect(screen.getByText("SIRICMAN")).toBeInTheDocument();
    expect(screen.getByText("PROPIEDADES")).toBeInTheDocument();
    expect(screen.getByText("Las Casas 4054, 1° B · Boedo, CABA")).toBeInTheDocument();
    expect(screen.getByText("10:30 a 18:00 · con cita previa")).toBeInTheDocument();
    expect(
      screen.getByText("Gabriel Siricman · Martillero Público y Corredor Inmobiliario"),
    ).toBeInTheDocument();
    expect(screen.getByText("© 2026 Siricman Propiedades")).toBeInTheDocument();
  });

  it("links the public contact email with mailto", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: "info@siricmanpropiedades.com.ar" }),
    ).toHaveAttribute("href", "mailto:info@siricmanpropiedades.com.ar");
  });

  it("makes phone, WhatsApp and Instagram tappable", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "11 3896-7363" })).toHaveAttribute(
      "href",
      "tel:+5491138967363",
    );
    expect(screen.getByRole("link", { name: "Escribinos por WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(screen.getByRole("link", { name: "@gabrielsiricman" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/gabrielsiricman/",
    );
  });

  it("has icon buttons for Instagram and WhatsApp in the brand column", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/gabrielsiricman/",
    );
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
  });

  it("organises the footer in Contacto and Navegación columns", () => {
    render(<Footer />);

    const contact = screen.getByRole("heading", { name: "Contacto" }).parentElement!;
    expect(within(contact).getByText("Las Casas 4054, 1° B · Boedo, CABA")).toBeInTheDocument();
    expect(within(contact).getByRole("link", { name: "11 3896-7363" })).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Navegación del sitio" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "/propiedades?operacion=venta",
      "/propiedades?operacion=alquiler",
      "/tasaciones",
      "/administracion-de-consorcios",
      "/nosotros",
      "/contacto",
    ]);
    expect(within(nav).getByRole("link", { name: "Comprar" })).toBeInTheDocument();
  });

  it("links the legal pages and shows no placeholder registration", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Términos y condiciones" })).toHaveAttribute(
      "href",
      "/terminos",
    );
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute(
      "href",
      "/privacidad",
    );
    expect(screen.queryByText(/a completar/i)).toBeNull();
    expect(screen.queryByText(/CUCICBA/)).toBeNull();
  });
});
