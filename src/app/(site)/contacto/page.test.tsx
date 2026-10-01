import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("./actions", () => ({ sendContactAction: vi.fn() }));

import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import ContactPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("ContactPage", () => {
  it("introduces the page", () => {
    render(<ContactPage />);

    expect(screen.getByText("CONTACTO")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Hablemos de tu próxima operación" }),
    ).toBeInTheDocument();
  });

  it("links every way to reach the office", () => {
    render(<ContactPage />);

    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE),
    );
    expect(screen.getByRole("link", { name: /Email/ })).toHaveAttribute(
      "href",
      "mailto:info@siricmanpropiedades.com.ar",
    );
    expect(screen.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://www.instagram.com/gabrielsiricman/",
    );
    expect(screen.getByRole("link", { name: /@gabrielsiricman/ })).toBeInTheDocument();
    expect(screen.getByText("Horario (con cita previa)")).toBeInTheDocument();
    expect(screen.getByText("10:30 a 18:00")).toBeInTheDocument();
  });

  it("offers the contact form and the office map", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { name: "Envianos un mensaje" })).toBeInTheDocument();
    expect(screen.getByTitle("Mapa de la oficina")).toHaveAttribute(
      "src",
      expect.stringContaining("Las%20Casas%204054"),
    );
    expect(screen.getByText("Las Casas 4054, 1° B · Boedo")).toBeInTheDocument();
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Contacto");
    expect(metadata.description).toEqual(expect.stringContaining("Boedo"));
    expect(metadata.alternates).toEqual({ canonical: "/contacto" });
  });
});
