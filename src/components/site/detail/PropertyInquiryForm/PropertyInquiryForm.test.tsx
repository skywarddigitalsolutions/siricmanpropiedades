import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { InquiryState } from "@/lib/leads/inquiry-form";
import PropertyInquiryForm from "./PropertyInquiryForm";

type Action = (prev: InquiryState, formData: FormData) => Promise<InquiryState>;

afterEach(() => cleanup());

function renderForm(action: Action) {
  render(
    <PropertyInquiryForm
      action={action}
      defaultMessage="Hola, me interesa la propiedad SP-0101."
      whatsappHref="https://wa.me/5491138967363?text=Hola"
    />,
  );
  return userEvent.setup();
}

describe("PropertyInquiryForm", () => {
  it("offers labelled fields with the message prefilled and the WhatsApp alternative", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mensaje (opcional)")).toHaveValue("Hola, me interesa la propiedad SP-0101.");
    expect(screen.getByRole("link", { name: "Consultar por WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5491138967363?text=Hola",
    );
  });

  it("hides the honeypot from people and assistive technology", () => {
    const { container } = render(
      <PropertyInquiryForm action={vi.fn()} defaultMessage="" whatsappHref="#" />,
    );

    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("thanks the visitor once the inquiry is sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = renderForm(action);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByRole("status")).toHaveTextContent("¡Gracias por tu consulta!");
    expect(action.mock.calls[0][1].get("name")).toBe("Ana García");
  });

  it("shows errors next to the fields and keeps what was typed", async () => {
    const action = vi.fn<Action>(async () => ({
      status: "error",
      fieldErrors: { phone: "Dejanos un teléfono o un email para responderte." },
      values: { name: "Ana", message: "Mi mensaje" },
    }));
    const user = renderForm(action);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("Dejanos un teléfono o un email para responderte.")).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nombre y apellido")).toHaveValue("Ana");
    expect(screen.getByLabelText("Mensaje (opcional)")).toHaveValue("Mi mensaje");
  });

  it("shows general errors as an alert", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { general: "Probá de nuevo en un minuto." },
        values: {},
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Probá de nuevo en un minuto.");
  });
});

describe("PropertyInquiryForm accessibility", () => {
  it("focuses the first invalid field after a failed submit", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { phone: "Dejanos un teléfono o un email para responderte." },
        values: { name: "Ana" },
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await screen.findByText("Dejanos un teléfono o un email para responderte.");
    expect(screen.getByLabelText("Teléfono")).toHaveFocus();
  });

  it("says that one contact way is enough, next to both fields, and marks the message optional", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    expect(screen.getByLabelText("Teléfono")).toHaveAccessibleDescription(
      "Con un teléfono o un email alcanza.",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Con un teléfono o un email alcanza.",
    );
  });

  it("offers next steps after sending", async () => {
    const user = renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await screen.findByText("¡Gracias por tu consulta!");
    expect(screen.getByRole("link", { name: "Seguir viendo propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
  });
});
