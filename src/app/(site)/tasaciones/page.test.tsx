import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("./actions", () => ({ sendAppraisalAction: vi.fn() }));

import AppraisalPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("AppraisalPage", () => {
  it("introduces the page", () => {
    render(<AppraisalPage />);

    expect(screen.getByText("VENDÉ O ALQUILÁ CON NOSOTROS")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Tasamos tu propiedad y te acompañamos hasta la firma",
      }),
    ).toBeInTheDocument();
  });

  it("explains the three steps in order", () => {
    render(<AppraisalPage />);

    const steps = within(screen.getByRole("list", { name: "Cómo funciona" })).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("1");
    expect(steps[0]).toHaveTextContent("Contanos de tu propiedad");
    expect(steps[0]).toHaveTextContent("Completá el formulario o escribinos por WhatsApp.");
    expect(steps[1]).toHaveTextContent("Visita y análisis");
    expect(steps[1]).toHaveTextContent("Comparamos con operaciones reales de la zona.");
    expect(steps[2]).toHaveTextContent("Informe y estrategia");
    expect(steps[2]).toHaveTextContent("Valor sugerido, fotos y plan de difusión.");
  });

  it("offers a contact alternative with the office data", () => {
    render(<AppraisalPage />);

    const contact = screen.getByRole("complementary", { name: "Contacto directo" });
    expect(within(contact).getByText("¿Preferís hablarlo?")).toBeInTheDocument();
    expect(within(contact).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      "https://wa.me/5491138967363?text=Hola%20Gabriel%2C%20te%20escribo%20desde%20la%20web.",
    );
    expect(within(contact).getByRole("link", { name: /11 3896-7363/ })).toHaveAttribute(
      "href",
      "tel:+5491138967363",
    );
    expect(contact).toHaveTextContent("10:30 a 18:00 · con cita previa");
  });

  it("offers the appraisal form", () => {
    render(<AppraisalPage />);

    expect(screen.getByRole("heading", { name: "Pedí tu tasación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar tasación" })).toBeInTheDocument();
  });

  it("sets the title, description, canonical and Open Graph", () => {
    expect(metadata.title).toBe("Tasaciones");
    expect(metadata.description).toEqual(expect.stringContaining("tasación"));
    expect(metadata.alternates).toEqual({ canonical: "/tasaciones" });
    expect(metadata.openGraph).toMatchObject({ type: "website", title: "Tasaciones", url: "/tasaciones" });
  });
});
