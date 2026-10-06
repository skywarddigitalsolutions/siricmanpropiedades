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
      defaultMessage="Hola, me interesa la propiedad."
    />,
  );
  return userEvent.setup();
}

describe("PropertyInquiryForm", () => {
  it("offers labelled fields with the message prefilled and a single send button", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Mensaje (opcional)")).toHaveValue("Hola, me interesa la propiedad.");
    expect(screen.getByRole("button", { name: "Enviar consulta" })).toBeInTheDocument();
    // WhatsApp lives in the fixed contact bar, not next to the send button.
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("tells the visitor how their data is used, linking the privacy policy", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    expect(screen.getByText(/Usamos tus datos solo para responder tu consulta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("hides the honeypot from people and assistive technology", () => {
    const { container } = render(
      <PropertyInquiryForm action={vi.fn()} defaultMessage="" />,
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

describe("PropertyInquiryForm message toggle (collapsed on desktop)", () => {
  it("offers 'Agregar un mensaje', collapsed, and still sends the prefilled message", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    const toggle = screen.getByRole("button", { name: "Agregar un mensaje" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const message = screen.getByLabelText("Mensaje (opcional)");
    expect(message.closest("[data-collapsed]")).not.toBeNull();
    // Hidden, not disabled: the prefilled text goes out with the inquiry.
    const data = new FormData(message.closest("form")!);
    expect(data.get("message")).toBe("Hola, me interesa la propiedad.");
  });

  it("opens the message field and moves focus into it", async () => {
    const user = renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    await user.click(screen.getByRole("button", { name: "Agregar un mensaje" }));

    const message = screen.getByLabelText("Mensaje (opcional)");
    expect(message.closest("[data-collapsed]")).toBeNull();
    expect(message).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Agregar un mensaje" })).toBeNull();
  });

  it("keeps an opened message open, with what was typed, after an error on another field", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { phone: "Dejanos un teléfono o un email para responderte." },
        values: { name: "Ana", message: "Quiero visitarla el sábado" },
      })),
    );

    await user.click(screen.getByRole("button", { name: "Agregar un mensaje" }));
    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await screen.findByText("Dejanos un teléfono o un email para responderte.");
    const message = screen.getByLabelText("Mensaje (opcional)");
    expect(message.closest("[data-collapsed]")).toBeNull();
    expect(message).toHaveValue("Quiero visitarla el sábado");
    expect(screen.queryByRole("button", { name: "Agregar un mensaje" })).toBeNull();
  });

  it("keeps a never-opened message collapsed, with the prefill, after an error on another field", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { phone: "Dejanos un teléfono o un email para responderte." },
        values: { name: "Ana", message: "Hola, me interesa la propiedad." },
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    await screen.findByText("Dejanos un teléfono o un email para responderte.");
    const message = screen.getByLabelText("Mensaje (opcional)");
    expect(message.closest("[data-collapsed]")).not.toBeNull();
    expect(message).toHaveValue("Hola, me interesa la propiedad.");
  });

  it("starts open when the message has an error", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { message: "El mensaje es muy largo." },
        values: { name: "Ana", phone: "1122334455", message: "x" },
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("El mensaje es muy largo.")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensaje (opcional)").closest("[data-collapsed]")).toBeNull();
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
