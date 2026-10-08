import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("./actions", () => ({ sendConsortiumAction: vi.fn() }));

import { WHATSAPP_PHONE } from "@/lib/whatsapp";
import ConsortiumPage, { metadata } from "./page";

afterEach(() => cleanup());

describe("ConsortiumPage", () => {
  it("introduces the service and points the primary call to action at the form", () => {
    render(<ConsortiumPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Administración de consorcios en CABA" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedí una propuesta" })).toHaveAttribute(
      "href",
      "#propuesta",
    );
    expect(document.getElementById("propuesta")).not.toBeNull();
  });

  it("offers a WhatsApp link with a prefilled consortium message", () => {
    render(<ConsortiumPage />);

    const link = screen.getByRole("link", { name: /WhatsApp/ });
    const href = new URL(link.getAttribute("href")!);
    expect(href.pathname).toBe(`/${WHATSAPP_PHONE}`);
    expect(href.searchParams.get("text")).toBe(
      "Hola, quiero consultar por la administración de consorcios de mi edificio.",
    );
  });

  it("lists what the administration includes", () => {
    render(<ConsortiumPage />);

    const section = screen.getByRole("region", { name: "Qué incluye" });
    // Three themes, each a titled checklist; the eight services split among them.
    const groups = within(section).getAllByRole("heading", { level: 3 });
    expect(groups.map((group) => group.textContent)).toEqual(["Cuentas", "Edificio", "Gestión"]);
    const items = within(section).getAllByRole("listitem").filter((item) => item.closest("ul ul"));
    expect(items).toHaveLength(8);
    expect(within(section).getByText("Liquidación de expensas")).toBeInTheDocument();
    expect(within(section).getByText(/Ley 941/)).toBeInTheDocument();
  });

  it("shows who runs the administration: Ana María first, then Gabriel", () => {
    render(<ConsortiumPage />);

    const who = screen.getByRole("region", { name: "Quién te administra" });
    expect(within(who).getByRole("img", { name: "Ana María Fierro Pedrayes" })).toHaveTextContent("AF");
    expect(
      within(who).getByText("Administración de consorcios · 15 años de trayectoria"),
    ).toBeInTheDocument();
    expect(
      within(who).getByText("Ana María Fierro Pedrayes").compareDocumentPosition(
        within(who).getByText("Gabriel Siricman"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(who).getByRole("img", { name: "Gabriel Siricman" })).toBeInTheDocument();
    expect(within(who).getByText("Gabriel Siricman")).toBeInTheDocument();
    // Only the consortium registration: the broker license is not relevant to this service.
    expect(within(who).queryByText(/Martillero Público y Corredor Inmobiliario/)).not.toBeInTheDocument();
    expect(within(who).queryByText("Matrícula N° 10024")).not.toBeInTheDocument();
    expect(
      within(who).getByText("Administrador de consorcios · Matrícula RPA N° 12221"),
    ).toBeInTheDocument();
    expect(within(who).getByRole("link", { name: /Escribinos/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
    const includes = screen.getByRole("region", { name: "Qué incluye" });
    const process = screen.getByRole("region", { name: "Cómo trabajamos" });
    expect(includes.compareDocumentPosition(who) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(who.compareDocumentPosition(process) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("explains how we work and why choose us", () => {
    render(<ConsortiumPage />);

    const steps = within(screen.getByRole("region", { name: "Cómo trabajamos" })).getAllByRole(
      "listitem",
    );
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(4);
  });

  it("shows the hero stat card with the years and the three highlights", () => {
    render(<ConsortiumPage />);

    const card = screen.getByRole("complementary", { name: "Datos de la administración" });
    expect(within(card).getByText("15")).toBeInTheDocument();
    expect(
      within(card).getByText("años de trayectoria de Ana María en administración de consorcios"),
    ).toBeInTheDocument();
    const items = within(card).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Trato directo con Ana María Fierro Pedrayes y Gabriel Siricman",
      "Cuentas claras para cada propietario",
      "Atención por WhatsApp y teléfono",
    ]);
  });

  it("does not repeat the hero claims in a trust strip", () => {
    render(<ConsortiumPage />);

    expect(screen.queryByRole("region", { name: "Datos de confianza" })).not.toBeInTheDocument();
  });

  it("says each idea once: the lead tells what they do, the hero card why them", () => {
    render(<ConsortiumPage />);

    expect(
      screen.getByText(
        "Liquidamos las expensas, cuidamos el mantenimiento y te acompañamos en cada asamblea.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Por qué elegirnos" })).toBeNull();
    expect(screen.queryByText(/11 años|\+11/)).toBeNull();
    expect(
      screen.getByText(
        "Dejanos los datos básicos y nos comunicamos con vos para conocer el consorcio y cotizar la administración.",
      ),
    ).toBeInTheDocument();
  });

  it("answers the frequent questions with native disclosures, as on /tasaciones", () => {
    render(<ConsortiumPage />);

    const section = screen.getByRole("region", { name: "Lo que suelen preguntarnos" });
    expect(within(section).getByText("Preguntas frecuentes")).toBeInTheDocument();
    expect(section.querySelectorAll("details").length).toBeGreaterThanOrEqual(4);
    expect(within(section).getByText(/cambio de administración/i, { selector: "summary" })).toBeInTheDocument();
    expect(within(section).getByText(/honorarios/i, { selector: "summary" })).toBeInTheDocument();
  });

  it("ends with the proposal form", () => {
    render(<ConsortiumPage />);

    const section = document.getElementById("propuesta")!;
    expect(within(section).getByLabelText("Dirección del edificio")).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Pedir propuesta" })).toBeInTheDocument();
  });

  it("sets the title, description and canonical", () => {
    expect(metadata.title).toBe("Administración de consorcios");
    expect(metadata.description).toEqual(expect.stringContaining("consorcios"));
    expect(metadata.description).toContain(
      "a cargo de Ana María Fierro Pedrayes, con 15 años de trayectoria",
    );
    expect(metadata.description).not.toContain("11 años");
    expect(metadata.alternates).toEqual({ canonical: "/administracion-de-consorcios" });
  });
});
