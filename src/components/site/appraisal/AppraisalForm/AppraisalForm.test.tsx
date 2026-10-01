import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppraisalState } from "@/lib/leads/appraisal-form";
import AppraisalForm from "./AppraisalForm";

type Action = (prev: AppraisalState, formData: FormData) => Promise<AppraisalState>;

afterEach(() => cleanup());

function renderForm(action: Action) {
  render(<AppraisalForm action={action} />);
  return userEvent.setup();
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "house");
  await user.type(screen.getByLabelText("Dirección y barrio"), "Boedo");
  await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
  await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
}

describe("AppraisalForm", () => {
  it("offers the operation toggle, labelled fields, property types and a hidden honeypot", () => {
    const { container } = render(<AppraisalForm action={vi.fn()} />);

    const group = screen.getByRole("radiogroup", { name: "Qué querés hacer" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Vender" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Alquilar" })).not.toBeChecked();
    expect(screen.getByLabelText("Tipo de propiedad")).toBeRequired();
    expect(screen.getByLabelText("Dirección y barrio")).toBeRequired();
    expect(screen.getByLabelText("Ambientes")).not.toBeRequired();
    expect(screen.getByLabelText("Superficie aprox. (m²)")).not.toBeRequired();
    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono")).toBeRequired();
    expect(screen.getByLabelText("Comentarios (opcional)")).not.toBeRequired();
    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual([
      "Elegí una opción",
      "Departamento",
      "Casa",
      "PH",
      "Terreno",
      "Local",
      "Oficina",
      "Cochera",
    ]);
    expect(screen.getByRole("button", { name: "Solicitar tasación" })).toBeInTheDocument();
    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("confirms once the request is sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = renderForm(action);

    await user.click(screen.getByRole("radio", { name: "Alquilar" }));
    await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "ph");
    await user.type(screen.getByLabelText("Dirección y barrio"), "Las Casas 4054, Boedo");
    await user.type(screen.getByLabelText("Ambientes"), "3");
    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Recibimos tu solicitud");
    expect(status).toHaveTextContent("Te contactamos para coordinar la visita.");
    const sent = action.mock.calls[0][1];
    expect(sent.get("operation")).toBe("rent");
    expect(sent.get("propertyType")).toBe("ph");
    expect(sent.get("rooms")).toBe("3");
    expect(sent.get("phone")).toBe("11 3896-7363");
  });

  it("shows errors next to the fields and keeps what was typed", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { rooms: "Los ambientes deben ser un número entero de 0 a 50." },
        values: {
          operation: "rent",
          propertyType: "house",
          address: "Boedo",
          rooms: "99",
          area: "80",
          name: "Ana",
          phone: "11 3896-7363",
          message: "Mi mensaje",
        },
      })),
    );

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    expect(await screen.findByText("Los ambientes deben ser un número entero de 0 a 50.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ambientes")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Ambientes")).toHaveValue(99);
    expect(screen.getByRole("radio", { name: "Alquilar" })).toBeChecked();
    expect(screen.getByLabelText("Tipo de propiedad")).toHaveValue("house");
    expect(screen.getByLabelText("Dirección y barrio")).toHaveValue("Boedo");
    expect(screen.getByLabelText("Superficie aprox. (m²)")).toHaveValue(80);
    expect(screen.getByLabelText("Comentarios (opcional)")).toHaveValue("Mi mensaje");
  });

  it("shows general errors as an alert", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { general: "Probá de nuevo en un minuto." },
        values: {},
      })),
    );

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Probá de nuevo en un minuto.");
  });
});
