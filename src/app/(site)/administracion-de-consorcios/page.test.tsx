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
    expect(href.searchParams.get("text")).toMatch(/administración de consorcios/i);
  });

  it("lists what the administration includes", () => {
    render(<ConsortiumPage />);

    const section = screen.getByRole("region", { name: "Qué incluye" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(8);
    expect(within(section).getByText("Liquidación de expensas")).toBeInTheDocument();
    expect(within(section).getByText(/Ley 941/)).toBeInTheDocument();
  });

  it("explains how we work and why choose us", () => {
    render(<ConsortiumPage />);

    const steps = within(screen.getByRole("region", { name: "Cómo trabajamos" })).getAllByRole(
      "listitem",
    );
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(4);
    const why = screen.getByRole("region", { name: "Por qué elegirnos" });
    expect(within(why).getAllByText(/Gabriel Siricman/).length).toBeGreaterThanOrEqual(1);
    expect(within(why).getByRole("heading", { level: 3, name: "Trato directo con Gabriel Siricman" })).toBeInTheDocument();
    expect(within(why).getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows a trust strip made only of the approved claims", () => {
    render(<ConsortiumPage />);

    const strip = screen.getByRole("region", { name: "Datos de confianza" });
    const items = within(strip).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("+11"),
      expect.stringContaining("Trato directo"),
      expect.stringContaining("Cuentas claras"),
    ]);
  });

  it("answers the frequent questions with native disclosures", () => {
    const { container } = render(<ConsortiumPage />);

    expect(container.querySelectorAll("details").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/cambio de administración/i, { selector: "summary" })).toBeInTheDocument();
    expect(screen.getByText(/honorarios/i, { selector: "summary" })).toBeInTheDocument();
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
    expect(metadata.alternates).toEqual({ canonical: "/administracion-de-consorcios" });
  });
});
