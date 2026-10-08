import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppraisalState } from "@/lib/leads/appraisal-form";
import { dropdownValue, openLabels, pick } from "@/test/dropdown";
import AppraisalForm from "./AppraisalForm";

type Action = (prev: AppraisalState, formData: FormData) => Promise<AppraisalState>;

afterEach(() => cleanup());

const NEIGHBORHOODS = ["Almagro", "Boedo", "Palermo"];

function renderForm(action: Action, neighborhoods: string[] = NEIGHBORHOODS) {
  render(<AppraisalForm action={action} neighborhoods={neighborhoods} />);
  return userEvent.setup();
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre y apellido"), "Ana");
  await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
}

describe("AppraisalForm", () => {
  it("offers the operation toggle, labelled fields, property types and a hidden honeypot", async () => {
    const user = userEvent.setup();
    const { container } = render(<AppraisalForm action={vi.fn()} neighborhoods={NEIGHBORHOODS} />);

    const group = screen.getByRole("radiogroup", { name: "Qué querés hacer" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Vender" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Alquilar" })).not.toBeChecked();
    expect(screen.getByLabelText("Tipo de propiedad")).not.toBeRequired();
    expect(screen.getByLabelText("Tipo de propiedad")).not.toHaveAttribute("aria-required");
    expect(screen.getByLabelText("Barrio")).not.toHaveAttribute("aria-required");
    expect(screen.getByLabelText("Dirección")).not.toBeRequired();
    expect(screen.getByLabelText("Ambientes")).not.toBeRequired();
    expect(screen.getByLabelText("Superficie total (m²)")).not.toBeRequired();
    expect(screen.getByLabelText("Nombre y apellido")).toBeRequired();
    expect(screen.getByLabelText("Teléfono")).toBeRequired();
    expect(screen.getByLabelText("Comentarios")).not.toBeRequired();
    const options = await openLabels(user, screen.getByLabelText("Tipo de propiedad"));
    expect(options).toEqual([
      "Sin especificar",
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

  it("never marks fields as optional: only name and phone are asked for", () => {
    const { container } = render(<AppraisalForm action={vi.fn()} neighborhoods={NEIGHBORHOODS} />);

    expect(container).not.toHaveTextContent("opcional");
  });

  it("offers the barrios as a dropdown, separate from the address", async () => {
    const user = renderForm(vi.fn());

    expect(screen.getByLabelText("Barrio")).toHaveTextContent("Elegí un barrio");
    expect(await openLabels(user, screen.getByLabelText("Barrio"))).toEqual([
      "Sin especificar",
      ...NEIGHBORHOODS,
    ]);
    expect(screen.queryByLabelText("Dirección y barrio")).toBeNull();
  });

  it("pairs related fields side by side on desktop: type + barrio, name + phone", () => {
    renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    const typePair = screen.getByLabelText("Tipo de propiedad").closest("[data-desktop-pair]");
    expect(typePair).not.toBeNull();
    expect(typePair).toContainElement(screen.getByLabelText("Barrio"));
    const contactPair = screen.getByLabelText("Nombre y apellido").closest("[data-desktop-pair]");
    expect(contactPair).not.toBeNull();
    expect(contactPair).toContainElement(screen.getByLabelText("Teléfono"));
  });

  it("lets the visitor clear a barrio or a type back to empty with 'Sin especificar'", async () => {
    const user = renderForm(vi.fn<Action>(async () => ({ status: "sent" })));
    const barrio = screen.getByLabelText("Barrio");
    const type = screen.getByLabelText("Tipo de propiedad");

    await pick(user, barrio, "Palermo");
    await pick(user, type, "Casa");
    expect(dropdownValue(barrio)).toBe("Palermo");
    expect(dropdownValue(type)).toBe("house");

    await pick(user, barrio, "Sin especificar");
    await pick(user, type, "Sin especificar");

    expect(dropdownValue(barrio)).toBe("");
    expect(barrio).toHaveTextContent("Elegí un barrio");
    expect(dropdownValue(type)).toBe("");
    expect(type).toHaveTextContent("Elegí una opción");
  });

  it("leaves the barrio field out when there are no barrios to offer", () => {
    renderForm(vi.fn(), []);

    expect(screen.queryByLabelText("Barrio")).toBeNull();
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();
  });

  it("sends with just a name and a phone", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = renderForm(action);

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    await screen.findByRole("status");
    const sent = action.mock.calls[0][1];
    expect(sent.get("operation")).toBe("sell");
    expect(sent.get("propertyType")).toBe("");
    expect(sent.get("neighborhood")).toBe("");
  });

  it("explains how the data is used, with a link to the privacy page", () => {
    renderForm(vi.fn());

    expect(screen.getByText(/Usamos tus datos solo para responder tu consulta\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
  });

  it("confirms once the request is sent", async () => {
    const action = vi.fn<Action>(async () => ({ status: "sent" }));
    const user = renderForm(action);

    await user.click(screen.getByRole("radio", { name: "Alquilar" }));
    await pick(user, screen.getByLabelText("Tipo de propiedad"), "PH");
    await pick(user, screen.getByLabelText("Barrio"), "Boedo");
    await user.type(screen.getByLabelText("Dirección"), "Las Casas 4054");
    await user.type(screen.getByLabelText("Ambientes"), "3");
    await user.type(screen.getByLabelText("Nombre y apellido"), "Ana García");
    await user.type(screen.getByLabelText("Teléfono"), "11 3896-7363");
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Recibimos tu solicitud");
    expect(status).toHaveTextContent("Gabriel te contacta para coordinar la visita.");
    const sent = action.mock.calls[0][1];
    expect(sent.get("operation")).toBe("rent");
    expect(sent.get("propertyType")).toBe("ph");
    expect(sent.get("neighborhood")).toBe("Boedo");
    expect(sent.get("address")).toBe("Las Casas 4054");
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
          address: "Las Casas 4054",
          neighborhood: "Boedo",
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
    expect(dropdownValue(screen.getByLabelText("Tipo de propiedad"))).toBe("house");
    expect(dropdownValue(screen.getByLabelText("Barrio"))).toBe("Boedo");
    expect(screen.getByLabelText("Dirección")).toHaveValue("Las Casas 4054");
    expect(screen.getByLabelText("Superficie total (m²)")).toHaveValue(80);
    expect(screen.getByLabelText("Comentarios")).toHaveValue("Mi mensaje");
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

describe("AppraisalForm accessibility", () => {
  it("focuses the first invalid field after a failed submit", async () => {
    const user = renderForm(
      vi.fn<Action>(async () => ({
        status: "error",
        fieldErrors: { address: "La dirección puede tener hasta 200 caracteres.", phone: "Revisá el teléfono." },
        values: {},
      })),
    );

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    await screen.findByText("La dirección puede tener hasta 200 caracteres.");
    expect(screen.getByLabelText("Dirección")).toHaveFocus();
  });

  it("offers next steps after sending", async () => {
    const user = renderForm(vi.fn<Action>(async () => ({ status: "sent" })));

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Solicitar tasación" }));

    await screen.findByText("Recibimos tu solicitud");
    expect(screen.getByRole("link", { name: "Seguir viendo propiedades" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toBeInTheDocument();
  });
});
