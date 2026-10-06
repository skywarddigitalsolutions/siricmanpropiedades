import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ConsortiumState } from "@/lib/leads/consortium-form";
import ConsortiumForm from "./ConsortiumForm";

type Action = (prev: ConsortiumState, formData: FormData) => Promise<ConsortiumState>;

afterEach(() => cleanup());

describe("ConsortiumForm", () => {
  it("offers labelled fields, an optional unit count and a hidden honeypot", () => {
    const { container } = render(<ConsortiumForm action={vi.fn()} />);

    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono o email")).toBeRequired();
    expect(screen.getByLabelText("Dirección del edificio")).toBeRequired();
    expect(screen.getByLabelText(/Cantidad aproximada de unidades/)).not.toBeRequired();
    expect(screen.getByLabelText(/Mensaje/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pedir propuesta" })).toBeInTheDocument();
    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("tells the visitor how their data is used, linking the privacy policy", () => {
    render(<ConsortiumForm action={vi.fn()} />);

    expect(screen.getByText(/Usamos tus datos solo para responder tu consulta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("submits the building data and confirms once sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = userEvent.setup();
    render(<ConsortiumForm action={action} />);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono o email"), "11 3896-7363");
    await user.type(screen.getByLabelText("Dirección del edificio"), "Av. Rivadavia 1234");
    await user.type(screen.getByLabelText(/Cantidad aproximada de unidades/), "24");
    await user.click(screen.getByRole("button", { name: "Pedir propuesta" }));

    expect(await screen.findByRole("status")).toHaveTextContent("¡Recibimos tu consulta!");
    const sent = action.mock.calls[0][1];
    expect(sent.get("contact")).toBe("11 3896-7363");
    expect(sent.get("address")).toBe("Av. Rivadavia 1234");
    expect(sent.get("units")).toBe("24");
  });

  it("shows errors next to the fields and keeps what was typed", async () => {
    const user = userEvent.setup();
    render(
      <ConsortiumForm
        action={vi.fn<Action>(async () => ({
          status: "error",
          fieldErrors: { address: "Indicá la dirección del edificio." },
          values: { name: "Ana", address: "", message: "Mi mensaje" },
        }))}
      />,
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.type(screen.getByLabelText("Teléfono o email"), "11 3896-7363");
    await user.type(screen.getByLabelText("Dirección del edificio"), "x");
    await user.click(screen.getByRole("button", { name: "Pedir propuesta" }));

    expect(await screen.findByText("Indicá la dirección del edificio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección del edificio")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nombre y apellido")).toHaveValue("Ana");
    expect(screen.getByLabelText(/Mensaje/)).toHaveValue("Mi mensaje");
  });
});
