import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { openLabels } from "@/test/dropdown";

const { getPublicNeighborhoods } = vi.hoisted(() => ({ getPublicNeighborhoods: vi.fn() }));
vi.mock("./actions", () => ({ sendAppraisalAction: vi.fn() }));
vi.mock("@/lib/api/public-catalog", () => ({ getPublicNeighborhoods }));

import { ApiError } from "@/lib/api/client";
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
  it("introduces the page and sums up what happens next in one line", async () => {
    render(await AppraisalPage());

    expect(screen.getByText("Vendé o alquilá con nosotros")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Tasamos tu propiedad y te acompañamos hasta la firma",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Te contactamos, visitamos la propiedad y te entregamos un informe con el valor sugerido y el plan para venderla o alquilarla.",
      ),
    ).toBeInTheDocument();
  });

  it("has no step list: the home already explains the process", async () => {
    render(await AppraisalPage());

    expect(screen.queryByRole("list", { name: "Cómo funciona" })).toBeNull();
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

    const faq = screen.getByRole("region", { name: "Lo que suelen preguntarnos" });
    expect(within(faq).getByText("Preguntas frecuentes")).toBeInTheDocument();
    const questions = within(faq).getAllByRole("group");
    expect(questions.map((question) => question.querySelector("summary")?.textContent)).toEqual([
      "¿Qué necesito tener a mano?",
      "¿La tasación me obliga a vender o alquilar con ustedes?",
      "¿En qué se basa el valor sugerido?",
      "¿Tasan también para alquilar?",
    ]);
    expect(questions.every((question) => !question.hasAttribute("open"))).toBe(true);
    expect(faq).toHaveTextContent("Te entregamos el informe y vos decidís si querés avanzar con nosotros.");
    const form = screen.getByRole("heading", { name: "Pedí tu tasación" });
    expect(form.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(["side", "below"])("offers the office contact data (%s copy)", async (placement) => {
    render(await AppraisalPage());

    const contact = screen
      .getAllByRole("complementary", { name: "Contacto directo" })
      .find((candidate) => candidate.dataset.placement === placement)!;
    expect(within(contact).queryByText("¿Preferís hablarlo?")).toBeNull();
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
    expect(metadata.title).toBe("Tasaciones");
    expect(metadata.description).toEqual(expect.stringContaining("tasación"));
    expect(metadata.alternates).toEqual({ canonical: "/tasaciones" });
    expect(metadata.openGraph).toMatchObject({ type: "website", title: "Tasaciones", url: "/tasaciones" });
  });
});
