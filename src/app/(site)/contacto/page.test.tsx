import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

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
    expect(screen.getByRole("link", { name: /Teléfono/ })).toHaveAttribute(
      "href",
      "tel:+5491138967363",
    );
    // Each piece of data once: WhatsApp doesn't repeat the number, hours live in the office block.
    expect(screen.getAllByText("11 3896-7363")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveTextContent("Escribinos ahora");
    expect(screen.queryByText("Horario (con cita previa)")).toBeNull();
  });

  it("keeps the intro and the contact options in a side column, then the form", () => {
    const { container } = render(<ContactPage />);

    const side = container.querySelector("[data-side-column]") as HTMLElement;
    expect(side).not.toBeNull();
    expect(within(side).getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      within(side).getByText("Escribinos por el medio que prefieras y te responde Gabriel."),
    ).toBeInTheDocument();
    const options = within(side).getByRole("list", { name: "Contacto directo" });
    expect(within(options).getAllByRole("listitem")).toHaveLength(4);
    const form = screen.getByRole("heading", { name: "Envianos un mensaje" });
    expect(side.contains(form)).toBe(false);
    expect(side.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the office address and hours next to the map", () => {
    render(<ContactPage />);

    const office = screen.getByRole("region", { name: "Las Casas 4054, 1° B" });
    expect(within(office).getByText("Oficina")).toBeInTheDocument();
    expect(within(office).getByText("Boedo, CABA")).toBeInTheDocument();
    expect(within(office).getByText("10:30 a 18:00 · con cita previa")).toBeInTheDocument();
  });

  it("offers the contact form and the office map", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { name: "Envianos un mensaje" })).toBeInTheDocument();
    expect(screen.getByTitle("Mapa de la oficina")).toHaveAttribute(
      "src",
      expect.stringContaining("Las%20Casas%204054"),
    );
    // No label over the map: the address is in the office block next to it.
    expect(screen.queryByText("Las Casas 4054, 1° B · Boedo")).toBeNull();
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Contacto");
    expect(metadata.description).toEqual(expect.stringContaining("Boedo"));
    expect(metadata.alternates).toEqual({ canonical: "/contacto" });
  });
});
