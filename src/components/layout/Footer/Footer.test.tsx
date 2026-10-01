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
    expect(screen.getByText("11 3896-7363 · @gabrielsiricman")).toBeInTheDocument();
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
});
