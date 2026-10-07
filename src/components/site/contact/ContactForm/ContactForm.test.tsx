import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContactState } from "@/lib/leads/contact-form";
import { dropdownValue, openLabels, pick } from "@/test/dropdown";
import ContactForm from "./ContactForm";

type Action = (prev: ContactState, formData: FormData) => Promise<ContactState>;

afterEach(() => cleanup());

function renderForm(action: Action) {
  render(<ContactForm action={action} />);
  return userEvent.setup();
}

describe("ContactForm", () => {
  it("offers labelled fields, the topic options and a hidden honeypot", async () => {
    const user = userEvent.setup();
    const { container } = render(<ContactForm action={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Envianos un mensaje" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono o email")).toBeRequired();
    expect(screen.getByLabelText("Tu mensaje")).toBeInTheDocument();
    expect(screen.queryByText(/opcional/i)).toBeNull();
    expect(screen.getByText(/Usamos tus datos solo para responder tu consulta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
    const options = await openLabels(user, screen.getByLabelText("Motivo de consulta"));
    expect(options).toEqual([
      "Quiero comprar",
      "Quiero alquilar",
      "Quiero vender o tasar",
      "Administración de consorcios",
      "Otro",
    ]);
    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("confirms once the message is sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = renderForm(action);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono o email"), "11 3896-7363");
    await pick(user, screen.getByLabelText("Motivo de consulta"), /alquil/i);
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("¡Mensaje enviado!");
    expect(status).toHaveTextContent("Te respondemos a la brevedad.");
    const sent = action.mock.calls[0][1];
    expect(sent.get("contact")).toBe("11 3896-7363");
    expect(sent.get("topic")).toBe("rent");
  });

  it("shows errors next to the fields and keeps what was typed", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { contact: "Dejanos un teléfono o un email para responderte." },
        values: { name: "Ana", topic: "sell", message: "Mi mensaje" },
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.type(screen.getByLabelText("Teléfono o email"), "ana@");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Dejanos un teléfono o un email para responderte.")).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono o email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nombre y apellido")).toHaveValue("Ana");
    expect(dropdownValue(screen.getByLabelText("Motivo de consulta"))).toBe("sell");
    expect(screen.getByLabelText("Tu mensaje")).toHaveValue("Mi mensaje");
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
    await user.type(screen.getByLabelText("Teléfono o email"), "ana@");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Probá de nuevo en un minuto.");
  });
});

describe("ContactForm accessibility", () => {
  it("moves focus to the first invalid field after a failed submit and announces the count", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: {
          name: "Escribí tu nombre (2 a 100 caracteres).",
          contact: "Dejanos un teléfono o un email para responderte.",
        },
        values: {},
      })),
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "A");
    await user.type(screen.getByLabelText("Teléfono o email"), "x");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await screen.findByText("Escribí tu nombre (2 a 100 caracteres).");
    expect(screen.getByLabelText("Nombre y apellido")).toHaveFocus();
    expect(screen.getByLabelText("Nombre y apellido")).toHaveAccessibleDescription(
      "Escribí tu nombre (2 a 100 caracteres).",
    );
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Hay 2 campos para revisar.",
    );
  });

  it("explains the combined field with a hint and does not autofill an email into it", () => {
    render(<ContactForm action={vi.fn()} />);

    const field = screen.getByLabelText("Teléfono o email");
    expect(field).toHaveAttribute("autocomplete", "off");
    expect(field).toHaveAccessibleDescription(/teléfono o un email/);
  });

  it("offers next steps after sending", async () => {
    const user = renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono o email"), "11 3896-7363");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await screen.findByText("¡Mensaje enviado!");
    expect(screen.getByRole("link", { name: "Seguir viendo propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
  });
});
