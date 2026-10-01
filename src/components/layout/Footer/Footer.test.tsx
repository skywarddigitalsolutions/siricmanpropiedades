import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5491138967363"),
    );
    expect(screen.getByRole("link", { name: "@gabrielsiricman" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/gabrielsiricman/",
    );
  });
});
