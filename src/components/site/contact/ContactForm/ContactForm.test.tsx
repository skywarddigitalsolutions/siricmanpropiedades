import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContactState } from "@/lib/leads/contact-form";
import ContactForm from "./ContactForm";

type Action = (prev: ContactState, formData: FormData) => Promise<ContactState>;

afterEach(() => cleanup());

function renderForm(action: Action) {
  render(<ContactForm action={action} />);
  return userEvent.setup();
}

describe("ContactForm", () => {
  it("offers labelled fields, the topic options and a hidden honeypot", () => {
    const { container } = render(<ContactForm action={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Envianos un mensaje" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono o email")).toBeRequired();
    expect(screen.getByLabelText("Tu mensaje")).toBeInTheDocument();
    const options = screen.getAllByRole("option").map((option) => option.textContent);
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
    await user.selectOptions(screen.getByLabelText("Motivo de consulta"), "rent");
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
    expect(screen.getByLabelText("Motivo de consulta")).toHaveValue("sell");
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
