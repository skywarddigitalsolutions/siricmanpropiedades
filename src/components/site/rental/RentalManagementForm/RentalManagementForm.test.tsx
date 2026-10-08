import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RentalState } from "@/lib/leads/rental-management-form";
import RentalManagementForm from "./RentalManagementForm";

type Action = (prev: RentalState, formData: FormData) => Promise<RentalState>;

afterEach(() => cleanup());

describe("RentalManagementForm", () => {
  it("offers labelled fields, the rental status choice and a hidden honeypot", () => {
    const { container } = render(<RentalManagementForm action={vi.fn()} />);

    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText(/Teléfono o email/)).toBeRequired();
    expect(screen.getByLabelText("Dirección de la propiedad")).toBeRequired();
    const group = screen.getByRole("group", { name: "¿La propiedad está alquilada?" });
    expect(group).toBeInTheDocument();
    expect(screen.getByLabelText("Sí, ya tiene inquilino")).toBeRequired();
    expect(screen.getByLabelText("No, la quiero alquilar")).toBeInTheDocument();
    expect(screen.getByLabelText(/Contanos lo que necesites/)).not.toBeRequired();
    expect(screen.getByRole("button", { name: "Quiero que la administren" })).toBeInTheDocument();
    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("tells the visitor how their data is used, linking the privacy policy", () => {
    render(<RentalManagementForm action={vi.fn()} />);

    expect(screen.getByText(/Usamos tus datos solo para responder tu consulta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("submits the property data and confirms once sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = userEvent.setup();
    render(<RentalManagementForm action={action} />);

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText(/Teléfono o email/), "11 3896-7363");
    await user.type(screen.getByLabelText("Dirección de la propiedad"), "Av. Rivadavia 1234");
    await user.click(screen.getByLabelText("No, la quiero alquilar"));
    await user.click(screen.getByRole("button", { name: "Quiero que la administren" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Recibimos tu consulta");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Gabriel se comunica con vos para conocer tu propiedad.",
    );
    const sent = action.mock.calls[0][1];
    expect(sent.get("contact")).toBe("11 3896-7363");
    expect(sent.get("address")).toBe("Av. Rivadavia 1234");
    expect(sent.get("rented")).toBe("no");
  });

  it("shows errors next to the fields and keeps what was typed", async () => {
    const user = userEvent.setup();
    render(
      <RentalManagementForm
        action={vi.fn<Action>(async () => ({
          status: "error",
          fieldErrors: {
            address: "Indicá la dirección de la propiedad.",
            rented: "Contanos si la propiedad ya está alquilada.",
          },
          values: { name: "Ana", address: "", rented: "yes", message: "Mi mensaje" },
        }))}
      />,
    );

    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
    await user.type(screen.getByLabelText(/Teléfono o email/), "11 3896-7363");
    await user.type(screen.getByLabelText("Dirección de la propiedad"), "x");
    await user.click(screen.getByLabelText("Sí, ya tiene inquilino"));
    await user.click(screen.getByRole("button", { name: "Quiero que la administren" }));

    expect(await screen.findByText("Indicá la dirección de la propiedad.")).toBeInTheDocument();
    expect(screen.getByText("Contanos si la propiedad ya está alquilada.")).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección de la propiedad")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nombre y apellido")).toHaveValue("Ana");
    expect(screen.getByLabelText("Sí, ya tiene inquilino")).toBeChecked();
    expect(screen.getByLabelText(/Contanos lo que necesites/)).toHaveValue("Mi mensaje");
  });
});
