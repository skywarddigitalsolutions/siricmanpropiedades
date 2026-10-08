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
    expect(screen.getByText("Matrícula N° 10024")).toBeInTheDocument();
    expect(
      screen.getByText("© 2026 Siricman Propiedades · Sitio desarrollado por Skyward Digital Solutions"),
    ).toBeInTheDocument();
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

  it("lists WhatsApp and Instagram once, in Contacto, with no icon-only duplicates", () => {
    render(<Footer />);

    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull();
    expect(screen.queryByRole("link", { name: "WhatsApp" })).toBeNull();
    expect(screen.getAllByRole("link", { name: /WhatsApp/ })).toHaveLength(1);
  });

  it("names every service in the tagline and offers the appraisal as the closing action", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        "Venta, alquiler, tasaciones y administración de consorcios en CABA, con trato personal de principio a fin.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tasá tu propiedad" })).toHaveAttribute(
      "href",
      "/vender",
    );
  });

  it("organises the footer in Contacto and Secciones columns", () => {
    render(<Footer />);

    expect(screen.getByRole("heading", { name: "Secciones" })).toBeInTheDocument();

    const contact = screen.getByRole("heading", { name: "Contacto" }).parentElement!;
    expect(within(contact).getByText("Las Casas 4054, 1° B · Boedo, CABA")).toBeInTheDocument();
    expect(within(contact).getByRole("link", { name: "11 3896-7363" })).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Navegación del sitio" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "/propiedades?operacion=venta",
      "/propiedades?operacion=alquiler",
      "/vender",
      "/administracion-de-consorcios",
      "/nosotros",
      "/contacto",
    ]);
    expect(within(nav).getByRole("link", { name: "Comprar" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Vender" })).toHaveAttribute("href", "/vender");
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
