import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { openLabels } from "@/test/dropdown";

const { getPublicNeighborhoods } = vi.hoisted(() => ({ getPublicNeighborhoods: vi.fn() }));
vi.mock("./actions", () => ({ sendAppraisalAction: vi.fn() }));
vi.mock("@/lib/api/public-catalog", () => ({ getPublicNeighborhoods }));

import { ApiError } from "@/lib/api/client";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import AppraisalPage, { metadata } from "./page";

beforeEach(() => {
  getPublicNeighborhoods.mockReset();
  getPublicNeighborhoods.mockResolvedValue([
    { id: "n1", name: "Almagro", slug: "almagro" },
    { id: "n2", name: "Boedo", slug: "boedo" },
  ]);
});
afterEach(() => cleanup());

describe("AppraisalPage", () => {
  it("introduces the page for sellers", async () => {
    render(await AppraisalPage());

    expect(screen.getByText("Vendé tu propiedad", { selector: "span" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Vendé tu propiedad con un corredor que te acompaña hasta la escritura",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Empezamos por una tasación profesional: visitamos tu propiedad, la comparamos con operaciones reales de la zona y te proponemos un plan de venta a medida.",
      ),
    ).toBeInTheDocument();
  });

  it("explains the next steps in three steps near the form", async () => {
    render(await AppraisalPage());

    const steps = screen.getByRole("list", { name: "Cómo sigue" });
    const items = within(steps).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Te contactamosCoordinamos la visita y conocemos tu propiedad.",
      "Recibís la tasaciónUn informe con el valor sugerido y sus fundamentos.",
      "Definimos el planSi decidís avanzar, armamos juntos el plan de venta.",
    ]);
  });

  it("puts the direct contact after the form on phones and in the side column on desktop", async () => {
    render(await AppraisalPage());

    const form = screen.getByRole("heading", { name: "Pedí tu tasación" });
    const contacts = screen.getAllByRole("complementary", { name: "Contacto directo" });
    expect(contacts).toHaveLength(2);
    const side = contacts.find((contact) => contact.dataset.placement === "side")!;
    const below = contacts.find((contact) => contact.dataset.placement === "below")!;
    // CSS shows one or the other; the phone copy keeps the reading order: form, then contact.
    expect(form.compareDocumentPosition(below) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(side.closest("[data-side-column]")).not.toBeNull();
  });

  it("answers the owner's common questions after the form, collapsed", async () => {
    render(await AppraisalPage());

    const faq = screen.getByRole("region", { name: "Lo que preguntan los propietarios antes de vender" });
    expect(within(faq).getByText("Preguntas frecuentes")).toBeInTheDocument();
    const questions = within(faq).getAllByRole("group");
    expect(questions.map((question) => question.querySelector("summary")?.textContent)).toEqual([
      "¿Qué necesito tener a mano?",
      "¿La tasación me obliga a vender con ustedes?",
      "¿En qué se basa el valor sugerido?",
      "¿Qué documentación necesito para vender?",
      "¿Tasan también para alquilar?",
    ]);
    expect(questions.every((question) => !question.hasAttribute("open"))).toBe(true);
    expect(faq).toHaveTextContent("No. Te entregamos el informe y vos decidís si avanzás con nosotros.");
    const form = screen.getByRole("heading", { name: "Pedí tu tasación" });
    expect(form.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(["side", "below"])("offers the office contact data (%s copy)", async (placement) => {
    render(await AppraisalPage());

    const contact = screen
      .getAllByRole("complementary", { name: "Contacto directo" })
      .find((candidate) => candidate.dataset.placement === placement)!;
    expect(within(contact).queryByText("¿Preferís hablarlo?")).toBeNull();
    expect(within(contact).getByRole("link", { name: /Escribinos por WhatsApp/ })).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE),
    );
    expect(within(contact).getByRole("link", { name: /11 3896-7363/ })).toHaveAttribute(
      "href",
      "tel:+5491138967363",
    );
    expect(contact).toHaveTextContent("10:30 a 18:00 · con cita previa");
  });

  it.each(["side", "below"])(
    "opens a ready seller message from a plain WhatsApp row, with no hint or extra block (%s copy)",
    async (placement) => {
      render(await AppraisalPage());

      const contact = screen
        .getAllByRole("complementary", { name: "Contacto directo" })
        .find((candidate) => candidate.dataset.placement === placement)!;
      const row = within(contact).getByRole("link", { name: /Escribinos por WhatsApp/ });
      expect(row).toHaveAttribute("href", buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE));
      expect(row).toHaveTextContent(/^Escribinos por WhatsApp$/);
      expect(within(contact).queryByText("¿Preferís WhatsApp?")).toBeNull();
      expect(within(contact).queryByRole("link", { name: "Completar por WhatsApp" })).toBeNull();
      expect(within(contact).queryByRole("list", { name: "Qué enviar" })).toBeNull();
    },
  );

  it("offers the appraisal form", async () => {
    render(await AppraisalPage());

    expect(screen.getByRole("heading", { name: "Pedí tu tasación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar tasación" })).toBeInTheDocument();
  });

  it("offers the catalog's barrios in the form", async () => {
    const user = userEvent.setup();
    render(await AppraisalPage());

    expect(await openLabels(user, screen.getByLabelText("Barrio"))).toEqual([
      "Sin especificar",
      "Almagro",
      "Boedo",
    ]);
  });

  it("still offers the form, without the barrio field, when the barrios cannot load", async () => {
    getPublicNeighborhoods.mockRejectedValue(new ApiError(0, "No se pudo contactar al servicio."));

    render(await AppraisalPage());

    expect(screen.queryByLabelText("Barrio")).toBeNull();
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar tasación" })).toBeInTheDocument();
  });

  it("sets the title, description, canonical and Open Graph", () => {
    expect(metadata.title).toBe("Vendé tu propiedad");
    expect(metadata.description).toBe(
      "Vendé tu propiedad en CABA con Gabriel Siricman, corredor inmobiliario matriculado: tasación profesional, plan de venta, difusión y acompañamiento hasta la escritura.",
    );
    expect(metadata.alternates).toEqual({ canonical: "/vender" });
    expect(metadata.openGraph).toMatchObject({ type: "website", title: "Vendé tu propiedad", url: "/vender" });
  });
});
